using System.Security.Claims;
using backend.DTOs;
using backend.DTOs.Lessons;
using backend.Services.QuizService;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class QuizController(ApplicationDbContext context, IQuizService quizService) : ControllerBase
{
    [Authorize(Roles = "Moderator,Admin")]
    [HttpPut("UpdateQuiz")]
    public async Task<ActionResult> UpdateQuiz(CreateQuizDto request)
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest("UserId in token is malformed");

        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return NotFound("User for account not found");

        if (!request.Id.HasValue)
            return BadRequest("QuizId is required for update");

        Quiz? quiz = await context.Quizzes
            .Where(qz => qz.Id == request.Id)
            .Include(qz => qz.Questions!)
            .ThenInclude(q => q.Options)
            .Include(qz => qz.Lesson)
            .FirstOrDefaultAsync();

        if (quiz == null)
            return NotFound("Quiz not found");

        if (user.Role == UserRole.Moderator && quiz.Lesson.AuthorId != user.Id)
            return Forbid("Not owning a lesson");

        var connectQuestions = quiz.Questions!
            .OfType<ConnectQuestion>()
            .ToList();

        await Task.WhenAll(connectQuestions.Select(cq =>
            context.Entry(cq).Collection(c => c.Pairs!).LoadAsync()
        ));

        try
        {
            quizService.UpdateQuiz(quiz, request);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }

        await context.SaveChangesAsync();
        return Ok();
    }

    [Authorize(Roles = "Moderator,Admin")]
    [HttpDelete("DeleteQuiz")]
    public async Task<ActionResult> DeleteQuiz(DeleteIdDto request)
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest("UserId in token is malformed");

        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return NotFound("User for account not found");

        Quiz? quiz = await context.Quizzes
            .Where(qz => qz.Id == request.Id)
            .Include(qz => qz.Lesson)
            .FirstOrDefaultAsync();

        if (quiz == null)
            return NotFound("Quiz is not found");

        if (user.Role == UserRole.Moderator && quiz.Lesson.AuthorId != user.Id)
            return Forbid("Not owning a lesson");

        await quizService.DeleteQuiz(quiz.Id);
        await context.SaveChangesAsync();

        return Ok();
    }

    [Authorize(Roles = "Moderator,Admin")]
    [HttpGet("ModQuiz")]
    public async Task<ActionResult> GetModQuiz(int quizId)
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest("UserId in token is malformed");

        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return NotFound("User for account not found");

        Quiz? quiz = await context.Quizzes
            .Where(qz => qz.Id == quizId)
            .Include(qz => qz.Questions!)
            .ThenInclude(q => q.Options)
            .Include(qz => qz.Lesson)
            .FirstOrDefaultAsync();

        if (quiz == null)
            return NotFound("Quiz not found");

        if (user.Role == UserRole.Moderator && quiz.Lesson.AuthorId != user.Id)
            return Forbid("Not owning a quiz");

        var connectQuestions = quiz.Questions!
            .OfType<ConnectQuestion>()
            .ToList();

        await Task.WhenAll(connectQuestions.Select(cq =>
            context.Entry(cq).Collection(c => c.Pairs!).LoadAsync()
        ));

        var questions = quiz.Questions!
            .Select(q => new
            {
                q.Type,
                q.Id,
                q.Points,
                q.Text,
                Answers = q.Options?.Select(o => new
                {
                    o.Id,
                    o.Text,
                    o.IsCorrect
                }),
                Pairs = (q as ConnectQuestion)?.Pairs?.Select(p => new
                {
                    p.Id,
                    p.Left,
                    p.Right
                })
            })
            .ToList();

        return Ok(new
        {
            quiz.Id,
            quiz.TimeMinutes,
            quiz.QuestionCount,
            Questions = questions
        });
    }

    [HttpGet("QuizDetails")]
    public async Task<ActionResult> GetQuizDetails(int id)
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest("UserId in token is malformed");

        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return NotFound("User for account not found");

        Quiz? quiz = await context.Quizzes
            .Include(q => q.Lesson)
            .ThenInclude(l => l.Author)
            .Include(q => q.Lesson)
            .ThenInclude(l => l.Category)
            .Where(q => q.Id == id)
            .FirstOrDefaultAsync();

        if (quiz == null)
            return NotFound("Quiz not found");

        var results = await context.QuizResults
            .Where(qr => qr.QuizId == id && qr.UserId == userId)
            .OrderByDescending(qr => qr.StartedAt)
            .ToListAsync();

        var latest = results.FirstOrDefault();
        int? cooldown = (latest != null && latest.StartedAt.AddDays(30) >= DateTime.Now)
            ? (int)Math.Ceiling((latest.StartedAt.AddDays(30) - DateTime.Now).TotalDays) : null;
        bool doingNow = latest != null && !latest.FinishedAt.HasValue;

        return Ok(new
        {
            quiz.Id,
            LessonId = quiz.Lesson.Id,
            quiz.Lesson.Title,
            quiz.Lesson.Category,
            quiz.Lesson.Difficulty,
            quiz.Lesson.CreatedAt,
            AuthorId = quiz.Lesson.Author?.Id,
            AuthorName = quiz.Lesson.Author?.Username,
            AuthorRole = quiz.Lesson.Author?.Role.ToString(),
            quiz.TotalPoints,
            quiz.QuestionCount,
            Time = quiz.TimeMinutes * 60,
            Cooldown = cooldown,
            DoingNow = doingNow,
            Results = results.Select(qr => new
            {
                qr.Points,
                qr.StartedAt,
                qr.FinishedAt
            })
        });
    }

    [HttpGet("Continue")]
    public async Task<ActionResult> ContinueQuiz(int id)
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest("UserId in token is malformed");

        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return NotFound("User for account not found");

        Quiz? quiz = await context.Quizzes
            .Where(qz => qz.Id == id)
            .Include(qz => qz.Questions!)
            .ThenInclude(q => q.Options)
            .Include(qz => qz.Lesson)
            .FirstOrDefaultAsync();

        if (quiz == null)
            return NotFound("Quiz not found");

        var connectQuestions = quiz.Questions!
            .OfType<ConnectQuestion>()
            .ToList();

        await Task.WhenAll(connectQuestions.Select(cq =>
            context.Entry(cq).Collection(c => c.Pairs!).LoadAsync()
        ));

        QuizResult? latest = await context.QuizResults
            .Where(qr => qr.QuizId == id && qr.UserId == userId && !qr.FinishedAt.HasValue)
            .FirstOrDefaultAsync();

        if (latest == null)
            return BadRequest("No quiz to continue");

        var random = new Random((int)(new DateTimeOffset(latest.StartedAt).ToUnixTimeSeconds() % int.MaxValue));

        var questions = quiz.Questions!
            .OrderBy(q => random.Next())
            .Take(quiz.QuestionCount)
            .Select(q => new
            {
                q.Id,
                q.Type,
                q.Points,
                q.Text,
                Options = q.Type < QuestionType.Text ? q.Options!.Select(o => new
                {
                    o.Id,
                    o.Text
                }).OrderBy(_ => Guid.NewGuid()) : null,
                LeftPairs = q.Type == QuestionType.Connect ? ((ConnectQuestion)q).Pairs!.Select(p => new
                {
                    p.Id,
                    p.Left,
                }) : null,
                RightPairs = q.Type == QuestionType.Connect ? ((ConnectQuestion)q).Pairs!.Select(p => new
                {
                    p.Right,
                }).OrderBy(_ => Guid.NewGuid()) : null
            })
            .ToList();

        return Ok(new
        {
            Time = (int)(latest.StartedAt.AddMinutes(quiz.TimeMinutes) - DateTime.Now).TotalSeconds,
            Questions = questions
        });
    }

    [HttpPost("Start")]
    public async Task<ActionResult> StartQuiz(SubmitQuizDto request)
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest("UserId in token is malformed");

        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return NotFound("User for account not found");

        Quiz? quiz = await context.Quizzes
            .Where(qz => qz.Id == request.Id)
            .Include(qz => qz.Questions!)
            .ThenInclude(q => q.Options)
            .Include(qz => qz.Lesson)
            .FirstOrDefaultAsync();

        if (quiz == null)
            return NotFound("Quiz not found");

        var connectQuestions = quiz.Questions!
            .OfType<ConnectQuestion>()
            .ToList();

        await Task.WhenAll(connectQuestions.Select(cq =>
            context.Entry(cq).Collection(c => c.Pairs!).LoadAsync()
        ));

        QuizResult? latest = await context.QuizResults
            .Where(qr => qr.QuizId == request.Id && qr.UserId == userId)
            .OrderByDescending(qr => qr.StartedAt)
            .FirstOrDefaultAsync();

        if (latest != null && DateTime.Now < latest.StartedAt.AddDays(30))
            return BadRequest("You can attempt solving quiz once a month");

        var now = DateTime.Now;
        var random = new Random((int)(new DateTimeOffset(now).ToUnixTimeSeconds() % int.MaxValue));

        var questions = quiz.Questions!
            .OrderBy(q => random.Next())
            .Take(quiz.QuestionCount)
            .Select(q => new
            {
                q.Id,
                q.Type,
                q.Points,
                q.Text,
                Options = q.Type < QuestionType.Text ? q.Options!.Select(o => new
                {
                    o.Id,
                    o.Text
                }).OrderBy(_ => Guid.NewGuid()) : null,
                LeftPairs = q.Type == QuestionType.Connect ? ((ConnectQuestion)q).Pairs!.Select(p => new
                {
                    p.Id,
                    p.Left,
                }) : null,
                RightPairs = q.Type == QuestionType.Connect ? ((ConnectQuestion)q).Pairs!.Select(p => new
                {
                    p.Right,
                }).OrderBy(_ => Guid.NewGuid()) : null
            })
            .ToList();

        QuizResult quizResult = new()
        {
            Points = 0,
            StartedAt = now,
            User = user,
            Quiz = quiz
        };

        await context.QuizResults.AddAsync(quizResult);
        await context.SaveChangesAsync();

        return Ok(questions);
    }

    [HttpPut("Submit")]
    public async Task<ActionResult> SubmitQuiz(SubmitQuizDto request)
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest("UserId in token is malformed");

        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return NotFound("User for account not found");

        Quiz? quiz = await context.Quizzes
            .Where(qz => qz.Id == request.Id)
            .Include(qz => qz.Questions!)
            .ThenInclude(q => q.Options)
            .Include(qz => qz.Lesson)
            .FirstOrDefaultAsync();

        if (quiz == null)
            return NotFound("Quiz not found");

        var connectQuestions = quiz.Questions!
            .OfType<ConnectQuestion>()
            .ToList();

        await Task.WhenAll(connectQuestions.Select(cq =>
            context.Entry(cq).Collection(c => c.Pairs!).LoadAsync()
        ));

        QuizResult? quizResult = await context.QuizResults
            .Where(qr => qr.UserId == user.Id && qr.QuizId == quiz.Id && !qr.FinishedAt.HasValue)
            .FirstOrDefaultAsync();

        if (quizResult == null)
            return NotFound("User didn't started quiz or already finished");

        if (request.Questions.Count > quiz.QuestionCount)
            return BadRequest("Too many questions' answers provided");

        int points = quizService.CheckQuiz(quiz, request);
        quizResult.Points = points;
        quizResult.FinishedAt = DateTime.Now;

        int prevBest = await context.QuizResults
            .Where(qr => qr.UserId == user.Id && qr.QuizId == quiz.Id && qr.FinishedAt.HasValue)
            .Select(qr => qr.Points)
            .OrderByDescending(p => p)
            .FirstOrDefaultAsync();

        if (points > prevBest)
            user.TotalPoints += points - prevBest;

        await context.SaveChangesAsync();
        return Ok(new
        {
            quizResult.Points,
            quiz.TotalPoints
        });
    }
}