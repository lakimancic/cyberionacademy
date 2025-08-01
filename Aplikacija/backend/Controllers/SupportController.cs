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

        var messages = await context.Messages
            .Include(m => m.Sender)
            .Where(m => m.ConversationId == conversationId)
            .OrderByDescending(m => m.SentAt)
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

        object? convObj = null;
        if (conversation is ChallengeConversation)
            convObj = await context.Conversations
                .Where(c => c.Id == conversationId)
                .Include(c => (c as ChallengeConversation)!.Challenge)
                .Select(c => new
                {
                    Title = (c as ChallengeConversation)!.Challenge!.Name,
                    ObjId = (c as ChallengeConversation)!.Challenge!.Id,
                    (c as ChallengeConversation)!.Challenge!.Category,
                    (c as ChallengeConversation)!.Challenge!.Difficulty,
                    Type = "Challenge"
                })
                .FirstOrDefaultAsync();
        else if (conversation is LessonConversation)
            convObj = await context.Conversations
                .Where(c => c.Id == conversationId)
                .Include(c => (c as ChallengeConversation)!.Challenge)
                .Select(c => new
                {
                    (c as LessonConversation)!.Lesson!.Title,
                    ObjId = (c as LessonConversation)!.Lesson!.Id,
                    (c as LessonConversation)!.Lesson!.Category,
                    (c as LessonConversation)!.Lesson!.Difficulty,
                    Type = "Lesson"
                })
                .FirstOrDefaultAsync();

        return Ok(new
        {
            Info = convObj,
            Messages = messages
        });
    }

    [HttpGet("MyConversations")]
    public async Task<ActionResult> GetMyConversations(int page = 1, bool closed = false)
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest("UserId in token is malformed");

        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return BadRequest("User for account not found");

        var challConvs = context.Conversations
            .Where(c => c.StartedById == userId && c is ChallengeConversation && c.Closed == closed)
            .Select(c => new
            {
                c.Id,
                Title = (c as ChallengeConversation)!.Challenge!.Name,
                Type = "Challenge",
                ObjId = (c as ChallengeConversation)!.ChallengeId,
                (c as ChallengeConversation)!.Challenge!.Category
            })
            .AsQueryable();

        var lessConvs = context.Conversations
            .Where(c => c.StartedById == userId && c is LessonConversation && c.Closed == closed)
            .Select(c => new
            {
                c.Id,
                (c as LessonConversation)!.Lesson!.Title,
                Type = "Lesson",
                ObjId = (c as LessonConversation)!.LessonId,
                (c as LessonConversation)!.Lesson!.Category
            })
            .AsQueryable();

        var allConvs = await challConvs
            .Union(lessConvs)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(allConvs);
    }

    [HttpGet("Conversations")]
    [Authorize(Roles = "Helper,Moderator,Admin")]
    public async Task<ActionResult> GetConversations(int page = 1, bool closed = false)
    {
        var challConvs = context.Conversations
            .Where(c => c is ChallengeConversation && c.Closed == closed)
            .Select(c => new
            {
                c.Id,
                c.StartedBy!.Username,
                Title = (c as ChallengeConversation)!.Challenge!.Name,
                Type = "Challenge",
                ObjId = (c as ChallengeConversation)!.ChallengeId
            })
            .AsQueryable();

        var lessConvs = context.Conversations
            .Where(c => c is LessonConversation && c.Closed == closed)
            .Select(c => new
            {
                c.Id,
                c.StartedBy!.Username,
                (c as LessonConversation)!.Lesson!.Title,
                Type = "Lesson",
                ObjId = (c as LessonConversation)!.LessonId
            })
            .AsQueryable();

        var allConvs = await challConvs
            .Union(lessConvs)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(allConvs);
    }
}