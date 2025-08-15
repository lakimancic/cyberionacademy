using backend.Models.Recommendations;
using Microsoft.Extensions.Caching.Memory;

namespace backend.Services.Recommendations;

public class RecommendationEngine(IMemoryCache cache, ApplicationDbContext context)
{
    private const string ChallengePoolsKey = "GlobalChallengePools";
    private const string LessonPoolsKey = "GlobalLessonPools";

    public async Task<GlobalChallengePools?> GetGlobalChallengePoolsAsync()
    {
        return await cache.GetOrCreateAsync(ChallengePoolsKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(24);
            var pools = new GlobalChallengePools();
            await PopulateGlobalChallengePoolsAsync(pools);
            return pools;
        });
    }

    public async Task<GlobalLessonPools?> GetGlobalLessonPoolsAsync()
    {
        return await cache.GetOrCreateAsync(LessonPoolsKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(24);
            var pools = new GlobalLessonPools();
            await PopulateGlobalLessonPoolsAsync(pools);
            return pools;
        });
    }

    private async Task PopulateGlobalChallengePoolsAsync(GlobalChallengePools pools)
    {
        var challenges = await context.Challenges
            .Where(c => c.Public)
            .Include(c => c.Reviews)
            .Include(c => c.Submissions)
            .ToListAsync();

        pools.MostSolved = [.. challenges
            .OrderByDescending(c => c.Submissions?.Count(cs => cs.Correct) ?? 0)
            .Take(50)
            .Select(c => new ChallengeSummary
            {
                Id = c.Id,
                Name = c.Name,
                Points = c.Points,
                Difficulty = c.Difficulty,
                CategoryId = c.CategoryId,
                SolvesCount = c.Submissions?.Count(cs => cs.Correct) ?? 0,
                AvgRating = c.Reviews?.Count != 0 ? c.Reviews!.Average(r => r.Stars) : 0
            })];

        pools.Trending = challenges
            .OrderByDescending(c => c.Reviews?.Average(r => (double?)r.Stars) ?? 0)
            .Take(50)
            .Select(c => new ChallengeSummary
            {
                Id = c.Id,
                Name = c.Name,
                Points = c.Points,
                Difficulty = c.Difficulty,
                CategoryId = c.CategoryId,
                SolvesCount = c.Submissions?.Count(cs => cs.Correct) ?? 0,
                AvgRating = c.Reviews?.Count != 0 ? c.Reviews!.Average(r => r.Stars) : 0
            }).ToList();

        pools.ByCategory = challenges
            .GroupBy(c => c.CategoryId)
            .ToDictionary(
                g => g.Key,
                g => g.Select(c => new ChallengeSummary
                {
                    Id = c.Id,
                    Name = c.Name,
                    Points = c.Points,
                    Difficulty = c.Difficulty,
                    CategoryId = c.CategoryId,
                    SolvesCount = c.Submissions?.Count(cs => cs.Correct)  ?? 0,
                    AvgRating = c.Reviews?.Count != 0 ? c.Reviews!.Average(r => r.Stars) : 0
                }).ToList()
            );

        pools.ByDifficulty = challenges
            .GroupBy(c => c.Difficulty)
            .ToDictionary(
                g => g.Key,
                g => g.Select(c => new ChallengeSummary
                {
                    Id = c.Id,
                    Name = c.Name,
                    Points = c.Points,
                    Difficulty = c.Difficulty,
                    CategoryId = c.CategoryId,
                    SolvesCount = c.Submissions?.Count(cs => cs.Correct)  ?? 0,
                    AvgRating = c.Reviews?.Count != 0 ? c.Reviews!.Average(r => r.Stars) : 0
                }).ToList()
            );
    }

    private async Task PopulateGlobalLessonPoolsAsync(GlobalLessonPools pools)
    {
        var lessons = await context.Lessons
            .Where(l => l.Public)
            .Include(l => l.Reviews)
            .ToListAsync();

        pools.MostPopular = [.. lessons
            .OrderByDescending(l => l.Reviews?.Average(r => (double?)r.Stars) ?? 0)
            .Take(50)
            .Select(l => new LessonSummary
            {
                Id = l.Id,
                Title = l.Title,
                Difficulty = l.Difficulty,
                CategoryId = l.CategoryId,
                AvgRating = l.Reviews?.Count != 0 ? l.Reviews!.Average(r => r.Stars) : 0
            })];

        pools.ByCategory = lessons
            .GroupBy(l => l.CategoryId)
            .ToDictionary(
                g => g.Key,
                g => g.Select(l => new LessonSummary
                {
                    Id = l.Id,
                    Title = l.Title,
                    Difficulty = l.Difficulty,
                    CategoryId = l.CategoryId,
                    AvgRating = l.Reviews?.Count != 0 ? l.Reviews!.Average(r => r.Stars) : 0,
                }).ToList()
            );
    }

    public async Task<UserRecommendations> GetRecommendationsAsync(UserProfile profile)
    {
        var result = new UserRecommendations();

        var challengePools = await GetGlobalChallengePoolsAsync();
        var lessonPools = await GetGlobalLessonPoolsAsync();

        // -------------------------
        // Newbie logic
        // -------------------------
        var newbieChallenges = profile.PreferredDifficulty == 0 ? challengePools?.MostSolved
            .Take(5)
            .Where(c => !profile.SolvedChallengeIds.Contains(c.Id))
            .ToList() : [];

        var newbieLessons = profile.PreferredDifficulty == 0 ? lessonPools?.MostPopular
            .Take(5)
            .Where(l => !profile.CompletedLessonIds.Contains(l.Id))
            .ToList() : [];


        // -------------------------
        // ContinueGrind logic
        // -------------------------
        var preferredCategory = profile.SolvedByCategory.OrderByDescending(c => c.Value).FirstOrDefault();
        var continueGrindChallenges = preferredCategory.Value > 5 && profile.PreferredDifficulty > 0 ?
            challengePools?.ByCategory[preferredCategory.Key]
            .Where(c => !profile.SolvedChallengeIds.Contains(c.Id))
            .Where(c => c.Difficulty == profile.PreferredDifficulty)
            .Take(5)
            .ToList() : [];


        // -------------------------
        // TrySomethingNew logic
        // -------------------------
        var lessEngagedCategories = profile.SolvedByCategory
            .OrderBy(c => c.Value)
            .Select(c => c.Key)
            .Take(3);

        var trySomethingNewChallenges = new List<ChallengeSummary>();

        foreach (var categoryId in lessEngagedCategories)
        {
            var challenges = challengePools?.ByCategory[categoryId]
                .Where(c => !profile.SolvedChallengeIds.Contains(c.Id))
                .Where(c => c.Difficulty <= profile.PreferredDifficulty)
                .Take(3);
            
            trySomethingNewChallenges.AddRange(challenges ?? []);
        }
        trySomethingNewChallenges = [.. trySomethingNewChallenges
            .OrderBy(_ => Guid.NewGuid())
            .Take(5)];
        

        // -------------------------
        // LevelUp logic
        // -------------------------
        var strongCategories = profile.SolvedByCategory
            .Where(c => c.Value >= 5)
            .Select(c => c.Key);

        var levelUpChallenges = new List<ChallengeSummary>();

        foreach (var categoryId in strongCategories)
        {
            var challenges = challengePools?.ByCategory[categoryId]
                .Where(c => !profile.SolvedChallengeIds.Contains(c.Id))
                .Where(c => c.Difficulty > profile.PreferredDifficulty)
                .OrderBy(c => c.Difficulty)
                .Take(3);

            levelUpChallenges.AddRange(challenges ?? []);
        }
        levelUpChallenges = [.. levelUpChallenges
            .OrderBy(_ => Guid.NewGuid())
            .Take(5)];


        // -------------------------
        // Trending logic
        // -------------------------
        var trendingChallenges = challengePools?.Trending
            .Where(c => !profile.SolvedChallengeIds.Contains(c.Id))
            .Take(5)
            .ToList();

        var trendingLessons = lessonPools?.MostPopular
            .Where(l => !profile.CompletedLessonIds.Contains(l.Id))
            .Take(5)
            .ToList();


        // -------------------------
        // HiddenGems logic
        // -------------------------
        var hiddenGemChallenges = challengePools?.ByCategory
            .SelectMany(c => c.Value)
            .Where(c => !profile.SolvedChallengeIds.Contains(c.Id))
            .OrderByDescending(c => c.AvgRating / (1 + c.SolvesCount))
            .Take(5)
            .ToList();


        result.ChallengeRecs[RecLabels.Newbie] = newbieChallenges ?? [];
        result.ChallengeRecs[RecLabels.ContinueGrind] = continueGrindChallenges ?? [];
        result.ChallengeRecs[RecLabels.TrySomethingNew] = trySomethingNewChallenges;
        result.ChallengeRecs[RecLabels.LevelUp] = levelUpChallenges;
        result.ChallengeRecs[RecLabels.TrendingNow] = trendingChallenges ?? [];
        result.ChallengeRecs[RecLabels.HiddenGems] = hiddenGemChallenges ?? [];
        result.LessonRecs[RecLabels.Newbie] = newbieLessons ?? [];
        result.LessonRecs[RecLabels.TrendingNow] = trendingLessons ?? [];

        return result;
    }
}