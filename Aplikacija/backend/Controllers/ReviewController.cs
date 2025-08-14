namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class ReviewController(ApplicationDbContext context) : ControllerBase
{
    static readonly int pageSize = 5;

    [HttpGet("{type}/{id}")]
    public async Task<ActionResult> GetReviews(
        string type,
        int id,
        [FromQuery] int page = 1,
        [FromQuery] string sortKey = "rating",
        [FromQuery] string sortDir = "asc",
        [FromQuery] int? stars = null
    )
    {
        IQueryable<Review> query;
        IQueryable<string> item;
        if (type == "challenge")
        {
            item = context.Challenges.Where(c => c.Id == id)
                .Select(c => c.Name);
            query = context.ChallengeReviews.Where(cr => cr.ChallengeId == id);
        }
        else if (type == "lesson")
        {
            item = context.Lessons.Where(c => c.Id == id)
                .Select(c => c.Title);
            query = context.LessonReviews.Where(cr => cr.LessonId == id);
        }
        else if (type == "course")
        {
            item = context.Courses.Where(c => c.Id == id)
                .Select(c => c.Title);
            query = context.CourseReviews.Where(cr => cr.CourseId == id);
        }
        else
            return BadRequest("Bad Review type");

        if (stars.HasValue)
            query = query.Where(q => q.Stars == stars.Value);

        query = (sortKey.ToLower(), sortDir.ToLower()) switch
        {
            ("rating", "desc") => query.OrderByDescending(c => c.Stars),
            ("rating", _) => query.OrderBy(c => c.Stars),
            ("difficulty", "desc") => query.OrderByDescending(c => c.Difficulty),
            ("difficulty", _) => query.OrderBy(c => c.Difficulty),
            _ => query.OrderBy(c => c.Stars)
        };

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var reviews = await query
            .Include(q => q.User)
            .Select(q => new
            {
                q.Stars,
                q.Difficulty,
                q.Text,
                AuthorName = q.User != null ? q.User.Username : null,
                AuthorId = q.UserId
            })
            .Skip(pageSize * (page - 1))
            .Take(pageSize)
            .ToListAsync();

        var itemRes = await item.FirstOrDefaultAsync();
        if (itemRes == null)
            return BadRequest($"{type} not found"); 

        return Ok(new
        {
            Reviews = reviews,
            totalPages,
            Item = itemRes
        });
    }
}