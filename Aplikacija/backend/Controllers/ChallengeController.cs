using backend.DTOs;
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
    int? difficulty = null)
    {
        var query = Context.Challenges
            .Include(c => c.Category)
            .Include(c => c.Author)
            .Include(c => c.Reviews)
            .Include(c => c.Submissions)
            .AsQueryable();

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
            AvatarUrl = c.Author?.Avatar ?? "",
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
        var challenge = await Context.Challenges
            .Where(c => c.Id == id)
            .Select(c => new ChallengeDto
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                CategoryName = c.Category.Name,
                Points = c.Points,
                //AverageRating = c.AverageRating,
                //SolvedCount = c.SolvedCount,
                Difficulty = (int)c.Difficulty,
                IsArchived = c.Archived,
                IsPublic = c.Public
            })
            .FirstOrDefaultAsync();

        if (challenge == null)
            return NotFound();

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
}