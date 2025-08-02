using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;

namespace backend.Hubs;

[Authorize]
public class ChatHub(ApplicationDbContext context) : Hub
{
    public async Task JoinConversation(int conversationId)
    {
        if (Context.User == null) return;

        var userId = int.Parse(Context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        User? user = await context.Users.FindAsync(userId);
        if (user == null) return;

        Conversation? conversation = await context.Conversations.FindAsync(conversationId);
        if (conversation == null) return;

        if (user.Role == UserRole.User && conversation.StartedById != userId) return;

        await Groups.AddToGroupAsync(Context.ConnectionId, $"conversation-{conversationId}");
    }

    public async Task SendMessage(int conversationId, string message)
    {
        if (Context.User == null) return;

        var userId = int.Parse(Context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        User? user = await context.Users.FindAsync(userId);
        if (user == null) return;

        Conversation? conversation = await context.Conversations.FindAsync(conversationId);
        if (conversation == null || conversation.Closed) return;

        if (user.Role == UserRole.User && conversation.StartedById != userId) return;

        var messageObj = new Message
        {
            Content = message,
            SenderId = user.Id,
            Conversation = conversation,
            SentAt = DateTime.Now
        };

        await context.Messages.AddAsync(messageObj);
        await context.SaveChangesAsync();

        await Clients.Group($"conversation-${conversationId}")
            .SendAsync("ReceiveMessage", new
            {
                SenderId = userId,
                SenderName = user.Username,
                SenderRole = user.Role.ToString(),
                Content = message,
                messageObj.SentAt
            });
    }
}