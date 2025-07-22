namespace backend.Models;

public class Conversation
{
    [Key]
    public int Id { get; set; }
    public bool Closed { get; set; } = false;

    public List<Message> Messages { get; set; } = [];
}

public class ChallengeConversation
{
    public Challenge? Challenge { get; set; }
}

public class LessonConversation
{
    public Lesson? Lesson { get; set; }
}