namespace backend.Models.Recommendations;

public class UserRecommendations
{
    public Dictionary<string, List<ChallengeSummary>> ChallengeRecs { get; set; } = [];
    public Dictionary<string, List<LessonSummary>> LessonRecs { get; set; } = [];
}