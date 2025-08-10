namespace backend.Models.Recommendations;

public class GlobalChallengePools
{
    public List<ChallengeSummary> MostSolved { get; set; } = [];
    public List<ChallengeSummary> Trending { get; set; } = [];
    public Dictionary<int, List<ChallengeSummary>> ByCategory { get; set; } = [];
    public Dictionary<int, List<ChallengeSummary>> ByDifficulty { get; set; } = [];
}