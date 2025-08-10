namespace backend.Models.Recommendations;

public class ChallengeSummary
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Difficulty { get; set; }
    public int CategoryId { get; set; }
}