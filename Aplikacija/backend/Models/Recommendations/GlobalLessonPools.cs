namespace backend.Models.Recommendations;

public class GlobalLessonPools
{
    public Dictionary<int, List<LessonSummary>> ByCategory { get; set; } = [];
    public List<LessonSummary> MostPopular { get; set; } = [];
}