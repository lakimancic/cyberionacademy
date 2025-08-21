namespace backend.DTOs.Lessons;

public class CreateQuizDto
{
    public int? Id { get; set; }
    [Required(ErrorMessage = "Quiz question count is required")]
    public int QuestionCount { get; set; }
    [Required(ErrorMessage = "Quiz time is required")]
    [Range(5, 120, ErrorMessage = "Time must be between 5 and 120 minutes")]
    public int TimeMinutes { get; set; }

    public List<CreateQuestionDto> Questions { get; set; } = [];
}