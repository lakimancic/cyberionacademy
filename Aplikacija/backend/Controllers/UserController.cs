using backend.DTOs;
using backend.DTOs.User;
using backend.Services.UserServices;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class UserController(ApplicationDbContext context, IConfiguration configuration, IUserService service) : ControllerBase
{
    [HttpGet("{userId}/Info")]
    public async Task<ActionResult> GetUserInfo(int userId)
    {
        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return NotFound("User not found");

        return Ok(new
        {
            user.Id,
            user.Username,
            user.FullName,
            user.Country,
            user.Bio,
            Role = user.Role.ToString()
        });
    }

    [HttpGet("{userId}/ChallengesInfo")]
    public async Task<ActionResult<List<CategoryStatsDto>>> GetChallengesInfo(int userId)
    {
        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return NotFound("User not found");

        var result = await context.Challenges
            .Where(c => c.Public)
            .GroupBy(c => c.Category)
            .Select(g => new CategoryStatsDto
            {
                Name = g.Key.Name,
                Max = g.Count(),
                Num = g.SelectMany(c => c.Submissions!.Where(s => s.UserId == userId && s.Correct))
                    .Select(s => s.ChallengeId)
                    .Distinct()
                    .Count()
            }).ToListAsync();

        return result;
    }

    [HttpGet("{userId}/LessonsInfo")]
    public async Task<ActionResult<List<CategoryStatsDto>>> GetLessonsInfo(int userId)
    {
        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return NotFound("User not found");

        var result = await context.Lessons
            .Where(l => l.QuizId != null && l.Public)
            .Select(l => new
            {
                l.Category.Name,
                LessonId = l.Id,
                QuizTotal = l.Quiz!.TotalPoints,
                Passed = l.Quiz!.Results!
                    .Where(r => r.UserId == userId)
                    .Any(r => r.Points > l.Quiz.TotalPoints / 2.0)
            })
            .GroupBy(x => x.Name)
            .Select(g => new CategoryStatsDto
            {
                Name = g.Key,
                Max = g.Count(),
                Num = g.Count(x => x.Passed)
            })
            .ToListAsync();

        return result;
    }

    [HttpGet("{userId}/ProfilePicture")]
    public async Task<IActionResult> GetProfilePicture(int userId)
    {
        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return NotFound("User not found");

        var rootPath = configuration.GetValue<string>("AppSettings:Storage")!;
        var filePath = Path.Combine(rootPath, user.Avatar ?? "0");
        if (user.Avatar == null || !System.IO.File.Exists(filePath))
            NotFound("Profile picture not found");

        var extension = Path.GetExtension(filePath).ToLowerInvariant();
        var contentType = extension switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            _ => "application/octet-stream"
        };

        var fileBytes = System.IO.File.ReadAllBytes(filePath);
        return File(fileBytes, contentType);
    }

    [HttpGet("{userId}/Stats")]
    public async Task<ActionResult> GetUserStats(int userId)
    {
        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return NotFound("User not found");

        int totalRankedUsers = await context.Users.CountAsync(u => u.TotalPoints > 0);
        int userRank = await context.Users.CountAsync(u => u.TotalPoints > user.TotalPoints) + 1;

        return Ok(new
        {
            Points = user.TotalPoints,
            RankName = service.GetRank(user.TotalPoints, userRank, totalRankedUsers),
            RankNum = userRank
        });
    }
}