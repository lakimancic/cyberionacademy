namespace backend.Models;

public class AnswerOption
{
    [Key]
    public int Id { get; set; }
    [MaxLength(30)]
    public required string Text { get; set; }
    public bool IsCorrect { get; set; }

    public required Question Question { get; set; }
}