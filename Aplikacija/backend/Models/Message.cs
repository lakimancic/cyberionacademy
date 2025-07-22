namespace backend.Models;

public class Message
{
    public int Id { get; set; }
    public required string Content { get; set; }
    public DateTime SentAt { get; set; }

    public required User Sender { get; set; }
    public required Conversation Conversation { get; set; }
}