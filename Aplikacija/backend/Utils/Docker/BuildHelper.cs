namespace backend.Utils.Docker;

using System.IO.Compression;
using ICSharpCode.SharpZipLib.Tar;

public static class BuildHelper
{
    public static Stream CreateTarForDockerBuild(string directory)
    {
        var memoryStream = new MemoryStream();
        using var tarOutput = new TarOutputStream(memoryStream, Encoding.UTF8)
        {
            IsStreamOwner = false
        };

        AddDirectoryFilesToTar(tarOutput, directory, directory, true);
        tarOutput.Close();
        memoryStream.Seek(0, SeekOrigin.Begin);
        return memoryStream;
    }

    private static void AddDirectoryFilesToTar(TarOutputStream tarOutput, string rootDirectory, string currentDirectory, bool recursive)
    {
        string[] files = Directory.GetFiles(currentDirectory);
        foreach (var filePath in files)
        {
            string relativePath = Path.GetRelativePath(rootDirectory, filePath).Replace("\\", "/");
            var entry = TarEntry.CreateEntryFromFile(filePath);
            entry.Name = relativePath;
            tarOutput.PutNextEntry(entry);

            using var fs = File.OpenRead(filePath);
            fs.CopyTo(tarOutput);
            tarOutput.CloseEntry();
        }

        if (recursive)
        {
            foreach (var dir in Directory.GetDirectories(currentDirectory))
            {
                string relativeDirPath = Path.GetRelativePath(rootDirectory, dir).Replace("\\", "/") + "/";
                var dirEntry = TarEntry.CreateEntryFromFile(dir);
                dirEntry.Name = relativeDirPath;
                tarOutput.PutNextEntry(dirEntry);
                tarOutput.CloseEntry();

                AddDirectoryFilesToTar(tarOutput, rootDirectory, dir, recursive);
            }
        }
    }

    public static async Task<bool> ExtractZipAsync(Stream zipStream, string destination)
    {
        try
        {
            using var archive = new ZipArchive(zipStream, ZipArchiveMode.Read, leaveOpen: false);
            ForceDeleteDirectory(destination);
            Directory.CreateDirectory(destination);

            foreach (var entry in archive.Entries)
            {
                var filePath = Path.Combine(destination, entry.FullName);

                if (!filePath.StartsWith(Path.GetFullPath(destination)))
                    throw new InvalidDataException("Unsafe zip entry path detected");

                if (string.IsNullOrEmpty(entry.Name))
                {
                    Directory.CreateDirectory(filePath);
                    continue;
                }

                Directory.CreateDirectory(Path.GetDirectoryName(filePath)!);

                using var entryStream = entry.Open();
                using var fileStream = File.Create(filePath);
                await entryStream.CopyToAsync(fileStream);
            }

            return true;
        }
        catch
        {
            return false;
        }
    }

    public static void ForceDeleteDirectory(string path)
    {
        if (!Directory.Exists(path))
            return;

        foreach (var file in Directory.EnumerateFiles(path, "*", SearchOption.AllDirectories))
        {
            var attr = File.GetAttributes(file);
            if (attr.HasFlag(FileAttributes.ReadOnly))
                File.SetAttributes(file, attr & ~FileAttributes.ReadOnly);
        }

        Directory.Delete(path, recursive: true);
    }
}