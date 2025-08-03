
using backend.Utils.Docker;

namespace backend.Services.Docker;

public class DockerCleanupService(IDockerInstancer instancer, ILogger<DockerCleanupService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await instancer.RemoveExpiredAsync();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error while removing expired containers");
            }

            await Task.Delay(TimeSpan.FromSeconds(60), stoppingToken);
        }
    }
}