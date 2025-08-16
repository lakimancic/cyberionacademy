namespace backend.Models.Recommendations;

public class LessonSummary
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public int Difficulty { get; set; }
    public int CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public string? CategoryShort { get; set; }
    public double AvgRating { get; set; }
}