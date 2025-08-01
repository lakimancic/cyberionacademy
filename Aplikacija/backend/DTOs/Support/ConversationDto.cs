namespace backend.DTOs.Support;

public class ConversationDto
{
    public int? LessonId { get; set; } = null;
    public int? ChallengeId { get; set; } = null;
    public required string Message { get; set; }
}