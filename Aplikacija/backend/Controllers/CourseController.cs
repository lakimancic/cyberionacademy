using backend.DTOs;
namespace backend.Controllers;


[Route("api/[controller]")]
[ApiController]
[Authorize]
public class CourseController(ApplicationDbContext context  , IConfiguration configuration) : ControllerBase
{
    
    [HttpGet("GetCourses")]

    public async Task<ActionResult<object>> GetCourses(
    int page = 1,
    int pageSize = 8,
    string? sortKey = "Name",
    string? sortDirection = "asc",
    string? search = null,
    int? difficulty = null)
    {
        var query = context.Courses

               .Include(c => c.Author)
               .Include(c => c.Reviews)
               .AsQueryable();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(c => c.Title.ToLower().Contains(search.ToLower()));

        if (difficulty.HasValue)
            query = query.Where(c => c.Difficulty == difficulty.Value);

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        query = (sortKey?.ToLower(), sortDirection?.ToLower()) switch
        {

            ("name", "desc") => query.OrderByDescending(c => c.Title),
            ("name", _) => query.OrderBy(c => c.Title),
            _ => query.OrderBy(c => c.Title)
        };

        var courses = await query
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();

        var coursesDtos = courses.Select(c => new CoursesDto
        {
            Id = c.Id,
            AutorId = c.AuthorId,
            Title = c.Title,
            Description = c.Description,
            AverageRating = c.Reviews?.Count > 0 ? c.Reviews.Average(r => r.Stars) : 0.0,
            Difficulty = c.Difficulty
        }).ToList();

        return Ok(new
        {
            items = coursesDtos,
            totalCount,
            totalPages,
            currentPage = page
        });
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
    
    [HttpGet("{courseId}/Banner")]
    public async Task<IActionResult> GetBanner(int courseId)
    {
        Course? course = await context.Courses.FindAsync(courseId);
        if (course == null)
            return NotFound("Course not found");

        var rootPath = configuration.GetValue<string>("AppSettings:Storage")!;
        var filePath = Path.Combine(rootPath, course.Banner ?? "0");
        if (course.Banner == null || !System.IO.File.Exists(filePath))
            return NotFound("Banner not found");

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

}