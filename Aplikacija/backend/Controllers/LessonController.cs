using System.Security.Claims;
using backend.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class LessonController : ControllerBase
    {
        public ApplicationDbContext Context { get; set; }

        public LessonController(ApplicationDbContext context)
        {
            Context = context;
        }

        [HttpGet("GetLessons")]
        public async Task<ActionResult<object>> GetLessons(
            int page = 1,
            int pageSize = 8,
            string? sortKey = "Title",
            string? sortDirection = "asc",
            string? category = null,
            string? search = null,
            bool? isPublic = null,
            int? difficulty = null)
        {
            var query = Context.Lessons
                .Include(l => l.Category)
                .Include(l => l.Author)
                .Include(l => l.Reviews)
                .AsQueryable();

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
                QuizId = l.QuizId,
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
        
        [HttpGet("GetLessonDetails/{id}")]
        public async Task<ActionResult<LessonDto>> GetLessonDetails(int id)
        {
            var lesson = await Context.Lessons
            .Include(l => l.Category)
            .Include(l => l.Author)
            .Include(l => l.Tags!)
            .ThenInclude(t => t.Tag)
            .Include(l => l.Reviews!)
            .ThenInclude(r => r.User)
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
            QuizId = lesson.QuizId,
            AverageRating = lesson.Reviews?.Count > 0 ? lesson.Reviews.Average(r => r.Stars) : 0.0,
            ReviewCount = lesson.Reviews?.Count ?? 0,
            Tags = lesson.Tags?.Select(t => t.Tag.Name).ToList() ?? new List<string>()
         };

    return Ok(dto);
}




}
}
    