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

        var result = await context.Categories
            .Select(cat => new CategoryStatsDto
            {
                Name = cat.Name,
                Max = context.Challenges
                    .Where(c => c.Public && c.CategoryId == cat.Id)
                    .Count(),

                Num = context.Challenges
                    .Where(c => c.Public && c.CategoryId == cat.Id)
                    .SelectMany(c => c.Submissions!
                        .Where(s => s.UserId == userId && s.Correct))
                    .Select(s => s.ChallengeId)
                    .Distinct()
                    .Count()
            })
            .ToListAsync();

        return result;
    }

    [HttpGet("{userId}/LessonsInfo")]
    public async Task<ActionResult<List<CategoryStatsDto>>> GetLessonsInfo(int userId)
    {
        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return NotFound("User not found");

        var result = await context.Categories
            .Select(cat => new CategoryStatsDto
            {
                Name = cat.Name,

                Max = context.Lessons
                    .Count(l => l.Public && l.Quiz != null && l.CategoryId == cat.Id),

                Num = context.Lessons
                    .Where(l => l.Public && l.Quiz != null && l.CategoryId == cat.Id)
                    .SelectMany(l => l.Quiz!.Results!
                        .Where(r => r.UserId == userId && r.Points > l.Quiz.TotalPoints / 2.0))
                    .Select(r => r.Quiz!.Lesson!.Id)
                    .Distinct()
                    .Count()
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
            return NotFound("Profile picture not found");

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
        User? user = await context.Users
            .Include(u => u.Badges!)
            .ThenInclude(ub => ub.Badge)
            .Where(u => u.Id == userId)
            .FirstOrDefaultAsync();

        if (user == null)
            return NotFound("User not found");

        int totalRankedUsers = await context.Users.CountAsync(u => u.TotalPoints > 0);
        int userRank = await context.Users.CountAsync(u => u.TotalPoints > user.TotalPoints) + 1;

        return Ok(new
        {
            Points = user.TotalPoints,
            RankName = service.GetRank(user.TotalPoints, userRank, totalRankedUsers),
            RankNum = userRank,
            Badges = user.Badges!.Select(ub => ub.Badge)
        });
    }

    [HttpGet("{userid}/PointsPerMonth")]
    public async Task<ActionResult> GetPointsPerMonth(int userId)
    {
        User? user = await context.Users.FindAsync(userId);

        if (user == null)
            return NotFound("User not found");

        var now = DateTime.Now;
        var fromDate = new DateTime(now.Year, now.Month, 1).AddMonths(-11);
        var months = Enumerable.Range(0, 12)
            .Select(i =>
            {
                var date = new DateTime(now.Year, now.Month, 1).AddMonths(-i);
                return new { date.Year, date.Month };
            })
            .ToList();

        var challengePoints = await context.ChallengeSubmissions
            .Include(s => s.Challenge)
            .Where(s => s.UserId == userId && s.Correct && !s.Challenge.Archived && s.SubmittedAt >= fromDate)
            .Select(s => new
            {
                s.SubmittedAt.Year,
                s.SubmittedAt.Month,
                s.Challenge.Points
            }).ToListAsync();

        var bestQuizPoints = (await context.QuizResults
            .Where(qr => qr.UserId == userId && qr.FinishedAt.HasValue && qr.FinishedAt >= fromDate)
            .GroupBy(qr => qr.QuizId)
            .Select(g => g
                .OrderByDescending(qr => qr.Points)
                .ThenByDescending(qr => qr.FinishedAt)
                .First())
            .ToListAsync())
        .Select(q => new
        {
            q.FinishedAt!.Value.Year,
            q.FinishedAt.Value.Month,
            q.Points
        });

        var allPoints = challengePoints
            .Concat(bestQuizPoints)
            .GroupBy(p => new { p.Year, p.Month })
            .Select(g => new
            {
                g.Key.Year,
                g.Key.Month,
                TotalPoints = g.Sum(x => x.Points)
            })
            .OrderBy(p => p.Year)
            .ThenBy(p => p.Month);

        var result = months
            .Select(m => new
            {
                m.Year,
                m.Month,
                TotalPoints = allPoints
                    .FirstOrDefault(c => c.Year == m.Year && c.Month == m.Month)?.TotalPoints ?? 0
            })
            .OrderBy(r => r.Year)
            .ThenBy(r => r.Month)
            .ToList();

        return Ok(new
        {
            user.TotalPoints,
            MonthsData = result
        });
    }

    [HttpGet("{userid}/Activity")]
    public async Task<ActionResult> GetActivity(int userId)
    {
        User? user = await context.Users.FindAsync(userId);

        if (user == null)
            return NotFound("User not found");

        var now = DateTime.UtcNow.Date;
        var fromDate = now.AddMonths(-12);

        var challengeActivities = await context.ChallengeSubmissions
            .Where(s => s.UserId == userId && s.Correct && s.SubmittedAt >= fromDate)
            .Select(s => s.SubmittedAt.Date)
            .ToListAsync();

        var quizActivities = await context.QuizResults
            .Where(q => q.UserId == userId && q.FinishedAt != null && q.FinishedAt >= fromDate)
            .Select(q => q.FinishedAt!.Value.Date)
            .ToListAsync();

        var allActivities = challengeActivities
            .Concat(quizActivities)
            .GroupBy(date => date)
            .Select(g => new
            {
                Date = g.Key,
                Count = g.Count()
            })
            .ToList();

        var missing = new[] { now, fromDate }
            .Where(d => !allActivities.Any(a => a.Date == d))
            .Select(d => new { d.Date, Count = 0 });

        return Ok(
            allActivities
            .Concat(missing)
            .OrderBy(a => a.Date)
            .ToList()
        );
    }

    [HttpGet("Search")]
    public async Task<ActionResult> SearchUser(
        string? search,
        int limit = 10
    )
    {
        var query = context.Users
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(c =>
                c.Username.ToLower().Contains(search.ToLower()) ||
                c.FullName.ToLower().Contains(search.ToLower()));

        var users = await query.Take(Math.Min(limit, 10)).ToListAsync();

        return Ok(users.Select(l => new
        {
            l.Id,
            l.Username,
            l.TotalPoints,
            Role = l.Role.ToString()
        }));
    }
}