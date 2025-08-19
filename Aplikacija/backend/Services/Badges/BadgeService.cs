
using System.Drawing;
using System.Threading.Tasks;

namespace backend.Services.Badges;

public class BadgeService(ApplicationDbContext context) : IBadgeService
{
    public async Task CheckBadgeChallenge(Challenge challenge, User user)
    {
        await CheckFirstBloods(challenge, user);
        await CheckCategoryMaster(challenge, user);
        await CheckJackOfAllTrades(challenge, user);
    }

    public async Task CheckBadgeQuiz(QuizResult quizResult, User user)
    {
        await CheckQuizFlash(quizResult, user);
    }

    private async Task CheckFirstBloods(Challenge challenge, User user)
    {
        var challengeSolved = await context.ChallengeSubmissions
            .Where(s => s.ChallengeId == challenge.Id)
            .CountAsync();
        if (challengeSolved != 0)
            return;

        var firstBloodCount = await context.Challenges
            .Where(c => c.Submissions!.Any(s => s.Correct))
            .Select(c => c.Submissions!
                .Where(s => s.Correct)
                .OrderBy(s => s.SubmittedAt)
                .FirstOrDefault())
            .Where(submission => submission != null && submission.UserId == user.Id)
            .CountAsync();

        Badge? badge = await context.Badges
            .Where(b => b.Short == $"bld{firstBloodCount + 1}")
            .FirstOrDefaultAsync();

        if (badge != null)
        {
            await context.UserBadges.AddAsync(new UserBadge
            {
                User = user,
                Badge = badge
            });
        }
    }

    private async Task CheckCategoryMaster(Challenge challenge, User user)
    {
        var categoryDiffs = await context.ChallengeSubmissions
            .Include(s => s.Challenge)
            .Where(s => s.UserId == user.Id && s.Correct && s.Challenge.CategoryId == challenge.CategoryId)
            .Select(s => s.Challenge.Difficulty)
            .Distinct()
            .ToListAsync();

        if (categoryDiffs.Count == 9 && !categoryDiffs.Contains(challenge.Difficulty))
        {
            var badge = await context.Categories
                .Where(c => c.Id == challenge.CategoryId)
                .Join(
                    context.Badges,
                    c => c.ShortForm,
                    b => b.Short,
                    (c, b) => b
                )
                .FirstOrDefaultAsync();

            if (badge != null)
                await context.UserBadges.AddAsync(new UserBadge
                {
                    Badge = badge,
                    User = user
                });
        }
    }

    private async Task CheckQuizFlash(QuizResult quizResult, User user)
    {
        if (quizResult.FinishedAt == null)
            return;

        if ((quizResult.FinishedAt.Value - quizResult.StartedAt).TotalSeconds > quizResult.Quiz.TimeMinutes * 6)
            return;

        var quizFlashes = await context.QuizResults
            .Include(qr => qr.Quiz)
            .Where(qr => qr.UserId == user.Id &&
                qr.FinishedAt != null &&
                (quizResult.FinishedAt.Value - quizResult.StartedAt).TotalSeconds <= qr.Quiz.TimeMinutes * 6)
            .CountAsync();

        Badge? badge = await context.Badges
            .Where(b => b.Short == $"flash{quizFlashes + 1}")
            .FirstOrDefaultAsync();

        if (badge != null)
        {
            await context.UserBadges.AddAsync(new UserBadge
            {
                User = user,
                Badge = badge
            });
        }
    }

    private async Task CheckJackOfAllTrades(Challenge challenge, User user)
    {
        var allSubmissions = await context.ChallengeSubmissions
            .Include(s => s.Challenge)
            .Where(s => s.Correct)
            .Select(s => new
            {
                s.Challenge.CategoryId,
                s.Challenge.Difficulty
            })
            .Distinct()
            .ToListAsync();

        var categoryCount = await context.Categories.CountAsync();

        if (allSubmissions.Count + 1 == categoryCount * 10 &&
            !allSubmissions.Any(s => s.CategoryId == challenge.CategoryId && s.Difficulty == challenge.Difficulty))
        {
            var badge = await context.Badges
                .Where(b => b.Short == "joat")
                .FirstOrDefaultAsync();

            if (badge != null)
                await context.UserBadges.AddAsync(new UserBadge
                {
                    Badge = badge,
                    User = user
                });
        }
    }
}