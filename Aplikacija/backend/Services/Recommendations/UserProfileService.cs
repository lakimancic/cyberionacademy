using backend.Models.Recommendations;

namespace backend.Services.Recommendations;

public class UserProfileService(ApplicationDbContext context)
{
    public async Task<UserProfile> BuildUserProfileAsync(int userId)
    {
        var profile = new UserProfile { UserId = userId };

        var solvedChallenges = await context.ChallengeSubmissions
            .Where(s => s.UserId == userId && s.Correct)
            .Include(s => s.Challenge)
            .ToListAsync();

        profile.TotalSolved = solvedChallenges.Count;
        profile.SolvedChallengeIds = [.. solvedChallenges.Select(s => s.ChallengeId)];

        profile.SolvedByCategory = solvedChallenges
            .GroupBy(s => s.Challenge.CategoryId)
            .ToDictionary(g => g.Key, g => g.Count());

        var failedChallenges = await context.ChallengeSubmissions
            .Where(s => s.UserId == userId && !s.Correct)
            .Include(s => s.Challenge)
            .ToListAsync();

        profile.FailedChallengesByCategory = failedChallenges
            .GroupBy(s => s.Challenge.CategoryId)
            .ToDictionary(g => g.Key, g => g.Count());

        profile.CompletedLessonIds = await context.QuizResults
            .Include(c => c.Quiz)
            .Where(c => c.UserId == userId && c.Points * 10 >= c.Quiz.TotalPoints * 6)
            .Select(c => c.Quiz.LessonId)
            .ToHashSetAsync();

        var quizResults = await context.QuizResults
            .Where(r => r.UserId == userId && r.FinishedAt != null)
            .Include(r => r.Quiz)
                .ThenInclude(q => q.Lesson)
            .ToListAsync();

        profile.AvgQuizScoreByCategory = quizResults
            .GroupBy(r => r.Quiz.Lesson.CategoryId)
            .ToDictionary(
                g => g.Key,
                g => g.Average(r => (double)r.Points / r.Quiz.TotalPoints * 100)
            );

        profile.WeakestCategory = profile.AvgQuizScoreByCategory
            .OrderBy(kv => kv.Value)
            .Select(kv => kv.Key)
            .FirstOrDefault();

        profile.PreferredDifficulty = (int)solvedChallenges
            .Select(s => s.Challenge.Difficulty)
            .DefaultIfEmpty(1)
            .Average();

        return profile;
    }
}