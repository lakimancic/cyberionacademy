namespace backend.Models;

public enum ConversationType
{
    Lesson,
    Challenge
}

public abstract class Conversation
{
    [Key]
    public int Id { get; set; }
    public bool Closed { get; set; } = false;

    public int? StartedById { get; set; }
    public User? StartedBy { get; set; }
    public List<Message>? Messages { get; set; }
}

public class ChallengeConversation : Conversation
{
    public int? ChallengeId { get; set; }
    public Challenge? Challenge { get; set; }
}

public class LessonConversation : Conversation
{
    public int? LessonId { get; set; }
    public Lesson? Lesson { get; set; }
}