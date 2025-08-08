namespace backend.DTOs.Lessons;

public class SubmitQuestionDto
{
    public int Id { get; set; }
    public string? Answer { get; set; }

    public List<AnswerOptionDto>? Answers { get; set; }
    public List<ConnectPairDto>? Pairs { get; set; }
}