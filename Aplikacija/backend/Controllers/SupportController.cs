using System.Security.Claims;
using backend.DTOs.Support;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class SupportController(ApplicationDbContext context) : ControllerBase
{
    int msgPageSize = 30;
    int pageSize = 10;

    [HttpPost("CreateConversation")]
    public async Task<ActionResult> CreateConversation(ConversationDto request)
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest("UserId in token is malformed");

        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return BadRequest("User for account not found");

        Challenge? challenge = await context.Challenges.FindAsync(request.ChallengeId);
        Lesson? lesson = await context.Lessons.FindAsync(request.LessonId);

        if (challenge != null == (lesson != null))
            return BadRequest("Conversation can be created either for Challenge or Lesson");

        if (request.ChallengeId != null && challenge == null)
            return NotFound("Challenge is not found");

        if (request.LessonId != null && lesson == null)
            return NotFound("Lesson is not found");

        Conversation conversation;
        if (challenge != null)
            conversation = new ChallengeConversation
            {
                StartedBy = user,
                Challenge = challenge
            };
        else
            conversation = new LessonConversation
            {
                StartedBy = user,
                Lesson = lesson
            };

        await context.Conversations.AddAsync(conversation);
        await context.Messages.AddAsync(new Message
        {
            Content = request.Message,
            Sender = user,
            SentAt = DateTime.Now,
            Conversation = conversation
        });

        await context.SaveChangesAsync();
        return Ok(new
        {
            ConversationId = conversation.Id
        });
    }

    [HttpPut("CloseConversation")]
    public async Task<ActionResult> CloseConversation(CloseConversationDto request)
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest("UserId in token is malformed");

        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return BadRequest("User for account not found");

        Conversation? conversation = await context.Conversations.FindAsync(request.ConversationId);
        if (conversation == null)
            return NotFound("Conversation is not found");

        if (user.Role == UserRole.User && conversation.StartedById != userId)
            return Forbid("You are not allowed to close conversation");

        conversation.Closed = true;
        context.Conversations.Update(conversation);
        await context.SaveChangesAsync();

        return Ok();
    }

    [HttpGet("Messages")]
    public async Task<ActionResult> GetMessages(int conversationId, int page = 1)
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest("UserId in token is malformed");

        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return BadRequest("User for account not found");

        Conversation? conversation = await context.Conversations.FindAsync(conversationId);
        if (conversation == null)
            return NotFound("Conversation is not found");

        if (user.Role == UserRole.User && conversation.StartedById != userId)
            return Forbid("You are not allowed to close conversation");

        var messages = context.Messages
            .Include(m => m.Sender)
            .Where(m => m.ConversationId == conversationId)
            .OrderByDescending(m => m.SentAt)
            .AsQueryable();

        var totalCount = await messages.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var result = await messages
            .Skip((page - 1) * msgPageSize)
            .Take(msgPageSize)
            .Select(m => new
            {
                SenderUsername = m.Sender!.Username,
                SenderId = m.Sender!.Id,
                SenderRole = m.Sender!.Role.ToString(),
                m.Content,
                m.SentAt
            })
            .ToListAsync();

        return Ok(new
        {
            Messages = result,
            TotalPages = totalPages
        });
    }

    [HttpGet("Conversations")]
    public async Task<ActionResult> GetConversations(int page = 1, bool closed = false, bool forUser = true)
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest("UserId in token is malformed");

        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return BadRequest("User for account not found");

        if (!forUser && user.Role == UserRole.User)
            return Forbid("You cannot get all conversations");

        var challConvs = context.Conversations
            .Where(c => c.StartedById == userId && c is ChallengeConversation && c.Closed == closed)
            .AsQueryable();

        var lessConvs = context.Conversations
            .Where(c => c.StartedById == userId && c is LessonConversation && c.Closed == closed)
            .AsQueryable();

        if (forUser)
        {
            challConvs = challConvs.Where(c => c.StartedById == userId);
            lessConvs = lessConvs.Where(c => c.StartedById == user.Id);
        }

        var cc = challConvs
            .Select(c => new
            {
                c.Id,
                Title = (c as ChallengeConversation)!.Challenge!.Name,
                Type = "Challenge",
                ObjId = (c as ChallengeConversation)!.ChallengeId,
                (c as ChallengeConversation)!.Challenge!.Category,
                LastMessage = c.Messages!
                    .OrderByDescending(m => m.SentAt)
                    .Select(m => m.Content)
                    .FirstOrDefault(),
                LastSender = c.Messages!
                    .OrderByDescending(m => m.SentAt)
                    .Select(m => m.Sender!.Username)
                    .FirstOrDefault()
            });

        var lc = lessConvs
            .Select(c => new
            {
                c.Id,
                (c as LessonConversation)!.Lesson!.Title,
                Type = "Lesson",
                ObjId = (c as LessonConversation)!.LessonId,
                (c as LessonConversation)!.Lesson!.Category,
                LastMessage = c.Messages!
                    .OrderByDescending(m => m.SentAt)
                    .Select(m => m.Content)
                    .FirstOrDefault(),
                LastSender = c.Messages!
                    .OrderByDescending(m => m.SentAt)
                    .Select(m => m.Sender!.Username)
                    .FirstOrDefault()
            });

        var query = cc
            .Union(lc)
            .AsQueryable();

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var result = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new
        {
            Conversations = result,
            TotalPages = totalPages
        });
    }
}