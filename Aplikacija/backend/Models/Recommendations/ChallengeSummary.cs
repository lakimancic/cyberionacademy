namespace backend.Models.Recommendations;

public class ChallengeSummary
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Difficulty { get; set; }
    public int CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public string? CategoryShort { get; set; }
    public bool Archived { get; set; }
    public int Points { get; set; }
    public int SolvesCount { get; set; }
    public double AvgRating { get; set; }
}