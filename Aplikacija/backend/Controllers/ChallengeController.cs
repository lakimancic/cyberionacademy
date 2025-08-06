using backend.DTOs;
using System.Security.Claims;
namespace backend.Controllers;


[Route("api/[controller]")]
[ApiController]
[Authorize]
public class ChallengeController : ControllerBase
{
    public ApplicationDbContext Context { get; set; }

    public ChallengeController(ApplicationDbContext context)
    {
        Context = context;
    }

    [HttpGet("GetChallenges")]
    public async Task<ActionResult<object>> GetChallenges(
    int page = 1,
    int pageSize = 8,
    string? sortKey = "Name",
    string? sortDirection = "asc",
    string? category = null,
    string? search = null,
    bool? archived = null,
    int? difficulty = null,
    bool ownChalls = false)
    {
        var query = Context.Challenges
            .Include(c => c.Category)
            .Include(c => c.Author)
            .Include(c => c.Reviews)
            .Include(c => c.Submissions)
            .AsQueryable();

        if (ownChalls)
        {
            int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
            if (userId == -1)
                return BadRequest("UserId in token is malformed");

            User? user = await Context.Users.FindAsync(userId);
            if (user == null)
                return BadRequest("User for account not found");

            if (user.Role == UserRole.Moderator)
                query = query.Where(c => c.AuthorId == userId);
        }
        else
            query = query.Where(c => c.Public);

        if (archived.HasValue)
            query = query.Where(c => c.Archived == archived.Value);

        if (!string.IsNullOrEmpty(category) && category != "all")
            query = query.Where(c => c.Category.Name == category);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(c => c.Name.ToLower().Contains(search.ToLower()));

        if (difficulty.HasValue)
            query = query.Where(c => c.Difficulty == difficulty.Value);

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        query = (sortKey?.ToLower(), sortDirection?.ToLower()) switch
        {
            ("points", "desc") => query.OrderByDescending(c => c.Points),
            ("points", _) => query.OrderBy(c => c.Points),
            ("name", "desc") => query.OrderByDescending(c => c.Name),
            ("name", _) => query.OrderBy(c => c.Name),
            ("categoryname", "desc") => query.OrderByDescending(c => c.Category.Name),
            ("categoryname", _) => query.OrderBy(c => c.Category.Name),
            _ => query.OrderBy(c => c.Name)
        };

        var challenges = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var challengeDtos = challenges.Select(c => new ChallengeDto
        {
            Id = c.Id,
            Name = c.Name,
            Description = c.Description,
            IsArchived = c.Archived,
            IsPublic = c.Public,
            Points = c.Points,
            CategoryName = c.Category.Name,
            AverageRating = c.Reviews?.Count > 0 ? c.Reviews.Average(r => r.Stars) : 0.0,
            SolvedCount = c.Submissions?.Count(s => s.Correct) ?? 0,
            Difficulty = c.Difficulty
        }).ToList();
        Console.WriteLine($"Queried with difficulty={difficulty}");
        return Ok(new
        {
            items = challengeDtos,
            totalCount,
            totalPages,
            currentPage = page
        });
    }

    [HttpGet("GetChallengeDetails/{id}")]
    public async Task<ActionResult<ChallengeDto>> GetChallengeById(int id)
    {
        var challengeEntity = await Context.Challenges
           .Include(c => c.Category)
           .Include(c => c.Author)
           .Include(c => c.Reviews)
           .Include(c => c.Submissions)
           .FirstOrDefaultAsync(c => c.Id == id);

        if (challengeEntity == null)
            return NotFound();

        var challenge = new ChallengeDto
        {
            Id = challengeEntity.Id,
            Name = challengeEntity.Name,
            Description = challengeEntity.Description,
            CategoryName = challengeEntity.Category.Name,
            Points = challengeEntity.Points,
            SolvedCount = challengeEntity.Submissions?.Count(s => s.Correct) ?? 0,
            Difficulty = (int)challengeEntity.Difficulty,
            AutorId = challengeEntity.Author?.Id ?? 0,
            AutorRole = challengeEntity.Author?.Role.ToString() ?? "Unknown",
            AutorCountry = challengeEntity.Author?.Country ?? "Unknown",
            dockerImage = challengeEntity.DockerImage,
            CreatedAt = challengeEntity.CreatedAt,
            AutorName = challengeEntity.Author?.Username ?? "Unknown",
            IsArchived = challengeEntity.Archived,
            IsPublic = challengeEntity.Public,
            ReviewCount = challengeEntity.Reviews?.Count ?? 0,
            AverageRating = challengeEntity.Reviews?.Count > 0 ? challengeEntity.Reviews.Average(r => r.Stars) : 0.0,
            AverageReviewDifficulty = challengeEntity.Reviews?.Count > 0
            ? challengeEntity.Reviews.Average(r => (int)r.Difficulty)
            : null
        };

        return Ok(challenge);
    }


    [HttpGet("GetCategories")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<string>>> GetCategories()
    {
        var categories = await Context.Categories
            .Select(c => c.Name)
            .Distinct()
            .ToListAsync();

        return Ok(categories);
    }

    [HttpGet("GetDifficulties")]
    [AllowAnonymous]
    public ActionResult<IEnumerable<object>> GetDifficulties()
    {
        var difficulties = new[]
        {
        new { value = 0, label = "Very Easy" },
        new { value = 1, label = "Easy" },
        new { value = 2, label = "Medium" },
        new { value = 3, label = "Hard" },
        new { value = 4, label = "Very Hard" }
    };

        return Ok(difficulties);
    }
    [HttpPost("SubmitFlag")]
    public async Task<IActionResult> SubmitSubmission([FromBody] SubmissionDto dto)
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest("UserId in token is malformed");

        User? user = await Context.Users.FindAsync(userId);
        if (user == null)
            return BadRequest("User for account not found");

        var challenge = await Context.Challenges
            .FirstOrDefaultAsync(c => c.Id == dto.ChallengeId);

        if (challenge == null)
            return NotFound("Challenge not found.");

        var isCorrect = challenge.Flag.Trim() == dto.Flag.Trim();

        var submission = new ChallengeSubmission
        {
            Flag = dto.Flag,
            Challenge = challenge,
            Correct = isCorrect,
            SubmittedAt = DateTime.UtcNow,
            ChallengeId = dto.ChallengeId,
            UserId = userId
        };

        Context.ChallengeSubmissions.Add(submission);
        await Context.SaveChangesAsync();

        return Ok(new { correct = isCorrect });
    }
    [Authorize]
    [HttpGet("HasSolved")]
    public async Task<IActionResult> HasUserSolved(int challengeId)
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest("UserId in token is malformed");

        User? user = await Context.Users.FindAsync(userId);
        if (user == null)
            return BadRequest("User for account not found");

        var hasSolved = await Context.ChallengeSubmissions
            .AnyAsync(s => s.UserId == userId && s.ChallengeId == challengeId && s.Correct);

        return Ok(hasSolved);
    }

    [HttpPost("SubmitChallengeReview")]/////ispravi
    public async Task<IActionResult> SubmitReview([FromBody] ChallengeReviewDto dto)
    {

        if (!ModelState.IsValid) return BadRequest(ModelState);
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest("UserId in token is malformed");

        User? user = await Context.Users.FindAsync(userId);
        if (user == null)
            return BadRequest("User for account not found");
        var challenge = await Context.Challenges.FindAsync(dto.ChallengeId);
        if (challenge == null)
            return NotFound("Challenge not found");
        var existingReview = await Context.ChallengeReviews
.FirstOrDefaultAsync(r => r.UserId == userId && r.ChallengeId == dto.ChallengeId);
        var review = new ChallengeReview
        {
            ChallengeId = dto.ChallengeId,
            Challenge = challenge,
            Stars = dto.Stars,
            Difficulty = dto.Difficulty,
            Text = dto.Text,
            UserId = userId,
        };

        Context.ChallengeReviews.Add(review);
        await Context.SaveChangesAsync();

        return Ok();
    }
    [HttpGet("HasReviewed")]
    public async Task<IActionResult> HasUserReviewed(int challengeId)
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest("UserId in token is malformed");

        var hasReviewed = await Context.ChallengeReviews
            .AnyAsync(r => r.UserId == userId && r.ChallengeId == challengeId);

        return Ok(hasReviewed);
    }
[HttpGet("GetUserReview")]
public async Task<IActionResult> GetUserReview(int challengeId)
{
    int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
    if (userId == -1)
        return BadRequest("UserId in token is malformed");

    var review = await Context.ChallengeReviews
        .FirstOrDefaultAsync(r => r.ChallengeId == challengeId && r.UserId == userId);

    if (review == null)
        return NotFound();

    return Ok(new
    {
        Stars = review.Stars,
        Difficulty = (int)review.Difficulty,
        Text = review.Text
    });
}
[HttpPut("UpdateReview")]
public async Task<IActionResult> UpdateReview([FromBody] ChallengeReviewDto dto)
{
    if (!ModelState.IsValid) return BadRequest(ModelState);

    int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
    if (userId == -1)
        return BadRequest("UserId in token is malformed");

    var review = await Context.ChallengeReviews
        .FirstOrDefaultAsync(r => r.ChallengeId == dto.ChallengeId && r.UserId == userId);

    if (review == null)
        return NotFound("Review not found");

    review.Stars = dto.Stars;
    review.Difficulty = dto.Difficulty;
    review.Text = dto.Text;

    await Context.SaveChangesAsync();
    return Ok();
}


}