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
    static readonly int pageSize = 8;

    [HttpGet("GetLessons")]
    public async Task<ActionResult<object>> GetLessons(
        int page = 1,
        string? sortKey = "Title",
        string? sortDirection = "asc",
        string? category = null,
        string? search = null,
        int? difficulty = null,
        bool? quizOnly = null,
        bool ownLessons = false)
    {
        var query = context.Lessons
            .Include(l => l.Category)
            .Include(l => l.Author)
            .Include(l => l.Reviews)
            .Include(l => l.Quiz)
            .AsQueryable();

        if (ownLessons)
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

        if (!string.IsNullOrEmpty(category) && category != "all")
            query = query.Where(l => l.Category.Name == category);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(l => l.Title.ToLower().Contains(search.ToLower()));

        if (difficulty.HasValue)
            query = query.Where(l => l.Difficulty == difficulty.Value);

        if (quizOnly.HasValue && quizOnly.Value)
            query = query.Where(l => l.Quiz != null);

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        query = (sortKey?.ToLower(), sortDirection?.ToLower()) switch
        {
            ("title", "desc") => query.OrderByDescending(l => l.Title),
            ("title", _) => query.OrderBy(l => l.Title),
            ("categoryname", "desc") => query.OrderByDescending(l => l.Category.Name),
            ("categoryname", _) => query.OrderBy(l => l.Category.Name),
            ("difficulty", "desc") => query.OrderByDescending(l => l.Difficulty),
            ("difficulty", _) => query.OrderBy(l => l.Difficulty),
            ("rating", "desc") => query.OrderByDescending(l => l.Reviews!.Average(r => r.Stars)),
            ("rating", _) => query.OrderBy(l => l.Reviews!.Average(r => r.Stars)),
            _ => query.OrderBy(l => l.Title)
        };

        var lessons = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var lessonDtos = lessons.Select(l => new
        {
            l.Id,
            l.Title,
            l.Description,
            l.Difficulty,
            IsPublic = l.Public,
            l.AuthorId,
            QuizId = l.Quiz?.Id,
            l.CategoryId,
            CategoryName = l.Category.Name,
            CategoryShort = l.Category.ShortForm,
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

    [HttpGet("GetLessonDetails/{id}")]
    public async Task<ActionResult<LessonDto>> GetLessonDetails(int id)
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest("UserId in token is malformed");

        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return NotFound("User for account not found");
        
        var lesson = await context.Lessons
            .Include(l => l.Category)
            .Include(l => l.Author)
            .Include(l => l.Reviews!)
            .ThenInclude(r => r.User)
            .Include(l => l.Quiz)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (lesson == null)
            return NotFound("Lesson not found");

        var review = await context.LessonReviews
            .Where(cr => cr.LessonId == lesson.Id && cr.UserId == user.Id)
            .Select(cr => new
            {
                cr.Text,
                cr.Stars,
                cr.Difficulty
            }).FirstOrDefaultAsync();

        double? averageReviewDifficuly = lesson.Reviews?.Count > 0
            ? lesson.Reviews.Average(r => r.Difficulty)
            : null;

        var difficultyCounts = Enumerable.Range(0, 10)
            .Select(d => new
            {
                Difficulty = d,
                Count = lesson.Reviews?.Count(r => r.Difficulty == d) ?? 0
            })
            .ToList();

        var dto = new
        {
            lesson.Id,
            lesson.Title,
            lesson.Description,
            lesson.Difficulty,
            lesson.CategoryId,
            lesson.Content,
            CategoryName = lesson.Category?.Name ?? "Unknown",
            CategoryShort = lesson.Category?.ShortForm ?? "Unknown",
            AuthorId = lesson.Author?.Id ?? 0,
            AuthorName = lesson.Author?.Username ?? "Unknown",
            AuthorRole = lesson.Author?.Role.ToString() ?? "Unknown",
            AuthorCountry = lesson.Author?.Country ?? "Unknown",
            IsPublic = lesson.Public,
            QuizId = lesson.Quiz?.Id,
            review,
            AverageRating = lesson.Reviews != null && lesson.Reviews.Count > 0 
                ? lesson.Reviews.Average(r => r.Stars) 
                : 0,
            AverageReviewDifficulty = averageReviewDifficuly,
            difficultyCounts,
            ReviewCount = lesson.Reviews != null ? lesson.Reviews.Count : 0
        };

        return Ok(dto);
    }
    
    [HttpPost("SubmitReview")]
    public async Task<IActionResult> SubmitReview(ReviewDto request)
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest("UserId in token is malformed");

        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return NotFound("User for account not found");

        var lesson = await context.Lessons.FindAsync(request.Id);
        if (lesson == null)
            return NotFound("Lesson not found");

        var review = await context.LessonReviews
            .Where(cr => cr.LessonId == lesson.Id && cr.UserId == userId)
            .FirstOrDefaultAsync();
        if (review != null)
            return BadRequest("You have already reviewed this lesson");

        LessonReview newReview = new()
        {
            Lesson = lesson,
            User = user,
            Text = request.Text,
            Stars = request.Stars,
            Difficulty = request.Difficulty
        };

        await context.LessonReviews.AddAsync(newReview);
        await context.SaveChangesAsync();

        return Ok(new
        {
            newReview.Text,
            newReview.Stars,
            newReview.Difficulty
        });
    }

    [HttpPut("UpdateReview")]
    public async Task<IActionResult> UpdateReview(ReviewDto request)
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest("UserId in token is malformed");

        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return NotFound("User for account not found");

        var lesson = await context.Lessons.FindAsync(request.Id);
        if (lesson == null)
            return NotFound("Lesson not found");

        var review = await context.LessonReviews
            .Where(cr => cr.LessonId == lesson.Id && cr.UserId == userId)
            .FirstOrDefaultAsync();
        if (review == null)
            return NotFound("Review not found");

        if (review.Difficulty != request.Difficulty)
            review.Difficulty = request.Difficulty;
        if (review.Stars != request.Stars)
            review.Stars = request.Stars;
        if (review.Text != request.Text)
            review.Text = request.Text;

        await context.SaveChangesAsync();

        return Ok();
    }

    [HttpGet("Search")]
    public async Task<ActionResult> SearchLesson(
        string? search,
        [FromQuery(Name = "exclude[]")] int[]? exclude,
        int limit = 10,
        bool searchDescription = false
    )
    {
        var query = context.Lessons
            .Include(l => l.Category)
            .Include(l => l.Author)
            .Include(l => l.Reviews)
            .Include(l => l.Quiz)
            .Where(c => c.Public)
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(c => 
                c.Title.ToLower().Contains(search.ToLower()) ||
                (searchDescription && c.Description.ToLower().Contains(search.ToLower())));

        if (exclude != null)
            query = query.Where(c => !exclude.Contains(c.Id));

        var lessons = await query.Take(Math.Min(limit, 10)).ToListAsync();

        return Ok(lessons.Select(l => new
        {
            l.Id,
            l.Title,
            l.Description,
            l.Category,
            AverageRating = l.Reviews?.Count > 0 ? l.Reviews.Average(r => r.Stars) : 0.0,
            l.Difficulty,
            QuizId = l.Quiz?.Id
        }));
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
