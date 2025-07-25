namespace backend.Models;

public class Message
{
    public int Id { get; set; }
    public required string Content { get; set; }
    public DateTime SentAt { get; set; }

    public int? SenderId { get; set; }
    public User? Sender { get; set; }
    public int ConversationId { get; set; }
    public required Conversation Conversation { get; set; }
}