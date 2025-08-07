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
            return Forbid("Not owning a lesson");

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
}