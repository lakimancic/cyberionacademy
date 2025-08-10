namespace backend.Models.Recommendations;

public class UserProfile
{
    public int UserId { get; set; }
    public int TotalSolved { get; set; }
    public HashSet<int> SolvedChallengeIds { get; set; } = [];
    public Dictionary<int, int> SolvedByCategory { get; set; } = [];
    public Dictionary<int, int> FailedChallengesByCategory { get; set; } = [];
    public HashSet<int> CompletedLessonIds { get; set; } = [];
    public Dictionary<int, double> AvgQuizScoreByCategory { get; set; } = [];
    public int WeakestCategory { get; set; }
    public int PreferredDifficulty { get; set; }
}
