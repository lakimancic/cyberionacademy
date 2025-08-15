using Microsoft.Extensions.Caching.Memory;

namespace backend.Services.Recommendations;

public class DailyGlobalPoolsUpdater(IServiceProvider services) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            using var scope = services.CreateScope();
            var engine = scope.ServiceProvider.GetRequiredService<RecommendationEngine>();

            await engine.GetGlobalChallengePoolsAsync();
            await engine.GetGlobalLessonPoolsAsync();

            await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
        }
    }
}