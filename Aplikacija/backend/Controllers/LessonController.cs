namespace backend.Controllers;

using System.Security.Claims;
using backend.DTOs;
using backend.DTOs.Lessons;
using backend.Services.QuizService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class LessonController(ApplicationDbContext context, IQuizService quizService) : ControllerBase
{
    [HttpGet("GetLessons")]
    public async Task<ActionResult<object>> GetLessons(
        int page = 1,
        int pageSize = 8,
        string? sortKey = "Title",
        string? sortDirection = "asc",
        string? category = null,
        string? search = null,
        bool? isPublic = null,
        int? difficulty = null,
        bool ownChalls = false)
    {
        var query = context.Lessons
            .Include(l => l.Category)
            .Include(l => l.Author)
            .Include(l => l.Reviews)
            .Include(l => l.Quiz)
            .AsQueryable();

        if (ownChalls)
        {
            int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
            if (userId == -1)
                return BadRequest("UserId in token is malformed");

            User? user = await context.Users.FindAsync(userId);
            if (user == null)
                return BadRequest("User for account not found");

            if (user.Role == UserRole.Moderator)
                query = query.Where(c => c.AuthorId == userId);
        }
        else
            query = query.Where(c => c.Public);

        if (isPublic.HasValue)
            query = query.Where(l => l.Public == isPublic.Value);

        if (!string.IsNullOrEmpty(category) && category != "all")
            query = query.Where(l => l.Category.Name == category);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(l => l.Title.ToLower().Contains(search.ToLower()));

        if (difficulty.HasValue)
            query = query.Where(l => l.Difficulty == difficulty.Value);

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        query = (sortKey?.ToLower(), sortDirection?.ToLower()) switch
        {
            ("title", "desc") => query.OrderByDescending(l => l.Title),
            ("title", _) => query.OrderBy(l => l.Title),
            ("categoryname", "desc") => query.OrderByDescending(l => l.Category.Name),
            ("categoryname", _) => query.OrderBy(l => l.Category.Name),
            _ => query.OrderBy(l => l.Title)
        };

        var lessons = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var lessonDtos = lessons.Select(l => new LessonDto
        {
            Id = l.Id,
            Title = l.Title,
            Description = l.Description,
            Difficulty = l.Difficulty,
            IsPublic = l.Public,
            CategoryId = l.CategoryId,
            AuthorId = (int)l.AuthorId,
            QuizId = l.Quiz?.Id,
            CategoryName = l.Category.Name,
            AverageRating = l.Reviews != null && l.Reviews.Count > 0 ? l.Reviews.Average(r => r.Stars) : 0.0
        }).ToList();

        return Ok(new
        {
            items = lessonDtos,
            totalCount,
            totalPages,
            currentPage = page
        });
    }

    [HttpGet("GetCategories")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<string>>> GetCategories()
    {
        var categories = await context.Categories
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

    [HttpGet("GetLessonDetails/{id}")]
    public async Task<ActionResult<LessonDto>> GetLessonDetails(int id)
    {
        var lesson = await context.Lessons
        .Include(l => l.Category)
        .Include(l => l.Author)
        .Include(l => l.Reviews!)
        .ThenInclude(r => r.User)
        .Include(l => l.Quiz)
        .FirstOrDefaultAsync(l => l.Id == id);

        if (lesson == null)
            return NotFound("Lesson not found");

        var dto = new LessonDto
        {
            Id = lesson.Id,
            Title = lesson.Title,
            Description = lesson.Description,
            Difficulty = lesson.Difficulty,
            CategoryId = lesson.CategoryId,
            CategoryName = lesson.Category?.Name ?? "Unknown",
            AuthorId = lesson.Author?.Id ?? 0,
            AuthorName = lesson.Author?.Username ?? "Unknown",
            AuthorRole = lesson.Author?.Role.ToString() ?? "Unknown",
            AuthorCountry = lesson.Author?.Country ?? "Unknown",
            IsPublic = lesson.Public,
            QuizId = lesson.Quiz?.Id,
           AverageRating = lesson.Reviews != null && lesson.Reviews.Count > 0 
                ? lesson.Reviews.Average(r => r.Stars) 
                : 0,

            ReviewCount = lesson.Reviews != null ? lesson.Reviews.Count : 0
        };

        return Ok(dto);
    }

    
    [HttpPost("SubmitReview")]
public async Task<IActionResult> SubmitReview([FromBody] LessonReviewDto reviewDto)
{
    var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    if (userIdClaim == null)
        return Unauthorized();

    int userId = int.Parse(userIdClaim);

    var lesson = await context.Lessons.FindAsync(reviewDto.LessonId);
    if (lesson == null)
        return NotFound("Lesson not found.");

    var existingReview = await context.LessonReviews
        .FirstOrDefaultAsync(r => r.LessonId == reviewDto.LessonId && r.UserId == userId);

    if (existingReview != null)
        return BadRequest("You have already reviewed this lesson.");

    var review = new LessonReview
    {
        LessonId = reviewDto.LessonId,
        Lesson = lesson,
        Stars = reviewDto.Stars,
        Difficulty = reviewDto.Difficulty,
        Text = reviewDto.Text,
        UserId = userId
    };

    context.LessonReviews.Add(review);

    await context.SaveChangesAsync(); 

    return Ok();
}



    [Authorize(Roles = "Moderator,Admin")]
    [HttpPost("CreateLesson")]
    public async Task<ActionResult> CreateLesson(CreateLessonDto request)
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest("UserId in token is malformed");

        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return NotFound("User for account not found");

        Category? category = await context.Categories.FindAsync(request.CategoryId);
        if (category == null)
            return NotFound("Category not found");

        Lesson lesson = new()
        {
            Title = request.Title,
            Description = request.Description,
            Difficulty = request.Difficulty,
            Public = request.Public,
            Category = category,
            Content = request.Content,
            CreatedAt = DateTime.Now,
            Author = user
        };

        if (request.Quiz != null)
        {
            try
            {
                quizService.CreateQuiz(request.Quiz, lesson);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        await context.Lessons.AddAsync(lesson);
        await context.SaveChangesAsync();
        
        return Ok(lesson.Id);
    }

    [Authorize(Roles = "Moderator,Admin")]
    [HttpPut("UpdateLesson")]
    public async Task<ActionResult> UpdateLesson(CreateLessonDto request)
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest("UserId in token is malformed");

        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return NotFound("User for account not found");

        Lesson? lesson = await context.Lessons.FindAsync(request.Id);
        if (lesson == null)
            return NotFound("Lesson not found");

        if (user.Role == UserRole.Moderator && lesson.AuthorId != user.Id)
            return Forbid("Not owning a lesson");

        if (lesson.Title != request.Title)
            lesson.Title = request.Title;
        if (lesson.Description != request.Description)
            lesson.Description = request.Description;
        if (lesson.Difficulty != request.Difficulty)
            lesson.Difficulty = request.Difficulty;
        if (lesson.Public != request.Public)
            lesson.Public = request.Public;
        if (lesson.CategoryId != request.CategoryId)
        {
            Category? category = await context.Categories.FindAsync(request.CategoryId);
            if (category == null)
                return NotFound("Category not found");
            lesson.Category = category;
        }
        if (lesson.Content != request.Content)
            lesson.Content = request.Content;

        if (lesson.Quiz == null && request.Quiz != null)
        {
            try
            {
                quizService.CreateQuiz(request.Quiz, lesson);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        await context.SaveChangesAsync();

        return Ok(lesson.Quiz?.Id);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("DeleteLesson")]
    public async Task<ActionResult> DeleteLesson(DeleteIdDto request)
    {
        Lesson? lesson = await context.Lessons
            .Where(l => l.Id == request.Id)
            .Include(l => l.Quiz)
            .FirstOrDefaultAsync();
        
        if (lesson == null)
            return NotFound("Lesson not found");

        if (lesson.Quiz != null)
            await quizService.DeleteQuiz(lesson.Quiz.Id);

        context.Lessons.Remove(lesson);
        await context.SaveChangesAsync();
        
        return Ok();
    }
}
