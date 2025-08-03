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

        AddDirectoryFilesToTar(tarOutput, directory, true);
        tarOutput.Close();
        memoryStream.Seek(0, SeekOrigin.Begin);
        return memoryStream;
    }

    private static void AddDirectoryFilesToTar(TarOutputStream tarOutput, string source, bool recursive)
    {
        foreach (string filename in Directory.GetFiles(source))
        {
            var fileInfo = new FileInfo(filename);
            string tarName = filename.Substring(source.Length).TrimStart(Path.DirectorySeparatorChar);

            var entry = TarEntry.CreateEntryFromFile(filename);
            entry.Name = tarName.Replace("\\", "/");

            tarOutput.PutNextEntry(entry);

            using var fileStream = File.OpenRead(filename);
            fileStream.CopyTo(tarOutput);
            tarOutput.CloseEntry();
        }

        if (recursive)
        {
            foreach (string directory in Directory.GetDirectories(source))
            {
                AddDirectoryFilesToTar(tarOutput, directory, recursive);
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