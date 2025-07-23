namespace backend.Models;

public class ChallengeSubmission
{
    [Key]
    public int Id { get; set; }
    [MaxLength(80)]
    public required string Flag { get; set; }
    public required bool Correct { get; set; }
    public DateTime SubmittedAt { get; set; }

    public required Challenge Challenge { get; set; }
    public required User? User { get; set; }
}