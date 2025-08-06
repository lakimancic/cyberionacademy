namespace backend.DTOs.Lessons;

public class CreateQuestionDto
{
    public int? Id { get; set; } 
    [Range((int)QuestionType.SingleAnswer, (int)QuestionType.Text, ErrorMessage = "Invalid Question Type")]
    public QuestionType Type { get; set; }
    [Required(ErrorMessage = "Question Text is required")]
    [MinLength(10, ErrorMessage = "Question Text must be at least 10 characters")]
    [MaxLength(300, ErrorMessage = "Question Text must be at most 300 characters")]
    public required string Text { get; set; }
    [Range(5, 30, ErrorMessage = "Question Points must be from 5 to 30")]
    public int Points { get; set; }

    public List<AnswerOptionDto>? Answers { get; set; }
    public List<ConnectPairDto>? Pairs { get; set; }
}