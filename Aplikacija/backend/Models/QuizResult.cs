namespace backend.Models;

public class QuizResult
{
    [Key]
    public int Id { get; set; }
    public int Points { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? FinishedAt { get; set; }

    public int? UserId { get; set; }
    public User? User { get; set; }
    public int QuizId { get; set; }
    public required Quiz Quiz { get; set; }
}