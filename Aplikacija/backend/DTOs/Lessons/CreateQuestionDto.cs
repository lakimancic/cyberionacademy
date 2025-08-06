namespace backend.DTOs.Lessons;

public class CreateQuestionDto
{
    public int? Id { get; set; } 
    public QuestionType Type { get; set; }
    public required string Text { get; set; }
    public int Points { get; set; }

    public List<AnswerOptionDto>? Answers { get; set; }
    public List<ConnectPairDto>? Pairs { get; set; }
}