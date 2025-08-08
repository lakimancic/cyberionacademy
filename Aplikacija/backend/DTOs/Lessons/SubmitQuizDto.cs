namespace backend.DTOs.Lessons;

public class SubmitQuizDto
{
    public int Id { get; set; }
    
    public List<SubmitQuestionDto> Questions { get; set; } = [];
}