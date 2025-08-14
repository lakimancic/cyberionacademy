
namespace backend.Services.QuizService;

public class QuizCleanupService(IServiceProvider serviceProvider, ILogger<QuizCleanupService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = serviceProvider.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                var now = DateTime.Now;
                var expiredQuizzes = await context.QuizResults
                    .Include(qr => qr.Quiz)
                    .Where(qr => !qr.FinishedAt.HasValue &&
                        qr.StartedAt.AddMinutes(qr.Quiz.TimeMinutes + 1) < now)
                    .ToListAsync(cancellationToken: stoppingToken);

                foreach (var result in expiredQuizzes)
                {
                    result.FinishedAt = result.StartedAt.AddMinutes(result.Quiz.TimeMinutes);
                }

                if (expiredQuizzes.Count > 0)
                    await context.SaveChangesAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error while removing expired containers");
            }

            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }
}