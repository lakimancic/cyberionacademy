namespace backend.DTOs.Lessons;

public class AnswerOptionDto
{
    public int? Id { get; set; }
    [Required(ErrorMessage = "Answer Text is required")]
    [MaxLength(30, ErrorMessage = "Answer Text must be at most 30 characters")]
    public required string Text { get; set; }
    public bool IsCorrect { get; set; }
}