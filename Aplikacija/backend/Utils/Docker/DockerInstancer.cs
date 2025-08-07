using backend.Models.Docker;
using Docker.DotNet;
using Docker.DotNet.Models;

namespace backend.Utils.Docker;

public class DockerInstancer : IDockerInstancer
{
    public async Task<string?> BuildImageAsync(string directory, Action<string>? handleProgress = null)
    {
        if (!Directory.Exists(directory) || !File.Exists(Path.Combine(directory, "Dockerfile")))
            throw new Exception("Docker directory is invalid");

        var buildParams = new ImageBuildParameters
        {
            Dockerfile = "Dockerfile"
        };
        var tarStream = BuildHelper.CreateTarForDockerBuild(directory);
        string? imageId = null;
        var progress = new Progress<JSONMessage>(message =>
        {
            if (string.IsNullOrEmpty(message.Stream)) return;

            handleProgress?.Invoke(message.Stream.Trim());

            if (message.Stream.Contains("Successfully built "))
            {
                var parts = message.Stream.Trim().Split(' ');
                if (parts.Length >= 3)
                    imageId = parts[2];
            }
        });

        await client.Images.BuildImageFromDockerfileAsync(
            buildParams,
            tarStream,
            null,
            null,
            progress,
            CancellationToken.None
        );

        if (imageId == null) return null;

        var imagesList = await client.Images.ListImagesAsync(new ImagesListParameters());
        var matched = imagesList.FirstOrDefault(img => img.ID.Replace("sha256:", "").StartsWith(imageId));

        if (matched == null)
            return null;

        return matched.ID;
    }

    public async Task CreateAndStartContainerAsync(int userId, int challengeId, string imageId)
    {
        List<Instance>? userInstances;
        lock (_lock)
        {
            if (!instances.TryGetValue(userId, out userInstances))
                userInstances = [];

            if (userInstances.Count >= 3)
                throw new Exception("Maximal number of instance per user is 3");

            if (userInstances.Any(ui => ui.ChallengeId == challengeId))
                throw new Exception("Instance for challenge is aready created");
        }

        var image = await client.Images.InspectImageAsync(imageId)
            ?? throw new Exception("Docker Image for this challenge is not found");

        var exposedPorts = image.Config.ExposedPorts?.Keys ?? [];
        if (exposedPorts.Count == 0)
            throw new Exception("Challenge doesn't have any ports exposed");

        var portBindings = new Dictionary<string, IList<PortBinding>>();
        var exposedPortDict = new Dictionary<string, EmptyStruct>();

        foreach (var port in exposedPorts)
        {
            portBindings[port] = [new PortBinding { HostPort = "" }];
            exposedPortDict[port] = default;
        }

        var container = await client.Containers.CreateContainerAsync(new CreateContainerParameters
        {
            Image = imageId,
            ExposedPorts = exposedPortDict,
            HostConfig = new HostConfig
            {
                PortBindings = portBindings
            }
        }) ?? throw new Exception("Container didn't creaate successfully");

        await client.Containers.StartContainerAsync(container.ID, new ContainerStartParameters());
        var containerInfo = await client.Containers.InspectContainerAsync(container.ID);

        var instance = new Instance
        {
            ContainerId = container.ID,
            ImageId = imageId,
            ChallengeId = challengeId,
            End = DateTime.Now.AddMinutes(30)
        };

        foreach (var port in containerInfo.NetworkSettings.Ports)
        {
            string containerPort = port.Key;
            var hostBinding = port.Value?.FirstOrDefault();

            if (hostBinding == null) continue;

            var parts = containerPort.Split('/');
            if (parts.Length != 2) continue;

            instance.Services.Add(new Service
            {
                PortIn = ushort.Parse(parts[0]),
                PortOut = ushort.Parse(hostBinding.HostPort),
                Type = parts[1] == "tcp" ? ServiceType.Tcp : ServiceType.Udp
            });
        }

        lock (_lock)
        {
            userInstances.Add(instance);
            instances[userId] = userInstances;
        }
    }

    public DateTime ExtendContainer(int userId, int challengeId)
    {
        lock (_lock)
        {
            if (!instances.TryGetValue(userId, out var userInstances))
                throw new Exception("User doesn't have any instance");

            var userChalInstance = userInstances.FirstOrDefault(uci => uci.ChallengeId == challengeId)
                ?? throw new Exception("User doesn't have instance for this challenge");

            if(userChalInstance.End.Subtract(DateTime.Now).Minutes < 10)
                userChalInstance.End = userChalInstance.End.AddMinutes(30);
            return userChalInstance.End;   
        }
    }

    public Instance? GetInstance(int userId, int challengeId)
    {
        lock (_lock)
        {
            if (!instances.TryGetValue(userId, out var userInstances))
                return null;

            return userInstances.FirstOrDefault(uci => uci.ChallengeId == challengeId);
        }
    }

    public async Task RemoveExpiredAsync()
    {
        var now = DateTime.Now;

        List<KeyValuePair<int, List<Instance>>> keyValues;
        lock (_lock)
        {
            keyValues = [.. instances];
        }

        foreach (var kvp in keyValues)
        {
            var userId = kvp.Key;
            var userInstances = kvp.Value;

            var expired = userInstances
                .Where(i => i.End < now)
                .ToList();

            foreach (var instance in expired)
            {
                await StopAndDeleteContainerAsync(userId, instance.ChallengeId);
            }
        }
    }

    public async Task StopAndDeleteContainerAsync(int userId, int challengeId)
    {
        Instance? userChalInstance;
        lock (_lock)
        {
            if (!instances.TryGetValue(userId, out var userInstances))
            throw new Exception("User doesn't have any instance");

            userChalInstance = userInstances.FirstOrDefault(uci => uci.ChallengeId == challengeId)
                ?? throw new Exception("User doesn't have instance for this challenge");

            userInstances.Remove(userChalInstance);
            if (userInstances.Count == 0)
                instances.Remove(userId);   
        }
        
        try
        {
            await client.Containers.StopContainerAsync(userChalInstance.ContainerId, new ContainerStopParameters());
        }
        catch { }

        try
        {            
            await client.Containers.RemoveContainerAsync(userChalInstance.ContainerId, new ContainerRemoveParameters
            {
                Force = true
            });
        }
        catch (DockerContainerNotFoundException)
        {
            throw new Exception("Container not found");
        }
    }

    public async Task RemoveImageAsync(string imageId, int challengeId)
    {
        foreach (var kvp in instances.ToList())
        {
            var userId = kvp.Key;
            var userInstances = kvp.Value;

            if (userInstances.Any(ui => ui.ChallengeId == challengeId))
            {
                await StopAndDeleteContainerAsync(userId, challengeId);
            }
        }

        await client.Images.DeleteImageAsync(imageId, new ImageDeleteParameters
        {
            Force = true
        });
    }

    private readonly Lock _lock = new();
    private readonly Dictionary<int, List<Instance>> instances = [];
    private readonly DockerClient client = new DockerClientConfiguration().CreateClient();
}

public interface IDockerInstancer
{
    Task<string?> BuildImageAsync(string directory, Action<string>? handleProgress);
    Task CreateAndStartContainerAsync(int userId, int challengeId, string imageId);
    Task StopAndDeleteContainerAsync(int userId, int challengeId);
    DateTime ExtendContainer(int userId, int challengeId);
    Instance? GetInstance(int userId, int challengeId);
    Task RemoveImageAsync(string imageId, int challengeId);
    Task RemoveExpiredAsync();
}