namespace backend.DTOs.Lessons;

public class SubmitQuestionDto
{
    public int Id { get; set; }
    public string? Answer { get; set; }

    public List<SubmitOptionDto>? Options { get; set; }
    public List<SubmitPairDto>? Pairs { get; set; }
}