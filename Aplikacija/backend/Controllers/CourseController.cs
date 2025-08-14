using System.Security.Claims;
using backend.DTOs;
using backend.DTOs.Courses;
using backend.Utils.Docker;
using Docker.DotNet.Models;
namespace backend.Controllers;


[Route("api/[controller]")]
[ApiController]
[Authorize]
public class CourseController(ApplicationDbContext context, IConfiguration configuration) : ControllerBase
{
    static readonly int pageSize = 8;

    [HttpGet("GetCourses")]
    public async Task<ActionResult<object>> GetCourses(
        int page = 1,
        string? sortKey = "Name",
        string? sortDirection = "asc",
        string? search = null,
        int? difficulty = null,
        bool ownCourses = false
    )
    {
        var query = context.Courses
            .Include(c => c.Author)
            .Include(c => c.Reviews)
            .Include(c => c.Challenges)
            .Include(c => c.Lessons)
            .AsQueryable();

        if (ownCourses)
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

        if (!string.IsNullOrEmpty(search))
            query = query.Where(c => c.Title.ToLower().Contains(search.ToLower()));

        if (difficulty.HasValue)
            query = query.Where(c => c.Difficulty == difficulty.Value);

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        query = (sortKey?.ToLower(), sortDirection?.ToLower()) switch
        {
            ("name", "desc") => query.OrderByDescending(c => c.Title),
            ("rating", "desc") => query.OrderByDescending(c =>
                c.Reviews!.Count > 0 ? c.Reviews.Average(r => r.Stars) : 0.0),
            ("rating", _) => query.OrderBy(c =>
                c.Reviews!.Count > 0 ? c.Reviews.Average(r => r.Stars) : 0.0),
            ("name", _) => query.OrderBy(c => c.Title),

            _ => query.OrderBy(c => c.Title)
        };

        var courses = await query
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();

        var coursesDtos = courses.Select(c => new
        {
            c.Id,
            c.AuthorId,
            AuthorName = c.Author?.Username,
            c.Title,
            c.Description,
            AverageRating = c.Reviews?.Count > 0 ? c.Reviews.Average(r => r.Stars) : 0.0,
            c.Difficulty,
            HasBanner = c.Banner != null,
            LessonCount = c.Lessons!.Count,
            ChallengeCount = c.Challenges!.Count
        }).ToList();

        return Ok(new
        {
            items = coursesDtos,
            totalCount,
            totalPages,
            currentPage = page
        });
    }

    [HttpGet("{courseId}/Banner")]
    public async Task<IActionResult> GetBanner(int courseId)
    {
        Course? course = await context.Courses.FindAsync(courseId);
        if (course == null)
            return NotFound("Course not found");

        var rootPath = configuration.GetValue<string>("AppSettings:Storage")!;
        var filePath = Path.Combine(rootPath, "courses", course.Id.ToString(), course.Banner ?? "0");
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

    [HttpGet("CourseDetails/{id}")]
    public async Task<IActionResult> GetCourseDetails(int id)
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest("UserId in token is malformed");

        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return NotFound("User for account not found");

        var course = await context.Courses
            .Where(c => c.Id == id)
            .Include(c => c.Challenges!)
            .ThenInclude(cc => cc.Challenge)
            .ThenInclude(c => c.Category)
            .Include(c => c.Lessons!)
            .ThenInclude(cl => cl.Lesson)
            .ThenInclude(l => l.Category)
            .Include(l => l.Author)
            .Include(c => c.Reviews)
            .FirstOrDefaultAsync();

        if (course == null)
            return NotFound("Course not found");

        var challengeItems = course.Challenges!
            .Select(cc => new
            {
                cc.Challenge.Id,
                cc.Challenge.Name,
                CategoryName = cc.Challenge.Category.Name,
                CategoryShort = cc.Challenge.Category.ShortForm,
                cc.Challenge.Difficulty,
                cc.Order,
                Type = CourseItemType.Challenge
            });

        var challengeCount = challengeItems.Count();

        var lessonItems = course.Lessons!
            .Select(lc => new
            {
                lc.Lesson.Id,
                Name = lc.Lesson.Title,
                CategoryName = lc.Lesson.Category.Name,
                CategoryShort = lc.Lesson.Category.ShortForm,
                lc.Lesson.Difficulty,
                lc.Order,
                Type = CourseItemType.Lesson
            });

        var lessonCount = lessonItems.Count();

        var review = await context.CourseReviews
            .Where(cr => cr.CourseId == course.Id && cr.UserId == user.Id)
            .Select(cr => new
            {
                cr.Text,
                cr.Stars,
                cr.Difficulty
            }).FirstOrDefaultAsync();

        var items = challengeItems
            .Union(lessonItems)
            .OrderBy(i => i.Order)
            .ToList();

        double? averageReviewDifficuly = course.Reviews?.Count > 0
            ? course.Reviews.Average(r => r.Difficulty)
            : null;

        var difficultyCounts = Enumerable.Range(0, 10)
            .Select(d => new
            {
                Difficulty = d,
                Count = course.Reviews?.Count(r => r.Difficulty == d) ?? 0
            })
            .ToList();

        return Ok(new
        {
            course.Id,
            course.Title,
            course.Description,
            course.Difficulty,
            course.AuthorId,
            AuthorName = course.Author?.Username,
            AuthorRole = course.Author?.Role.ToString(),
            HasBanner = course.Banner != null,
            Items = items,
            lessonCount,
            challengeCount,
            review,
            AverageRating = course.Reviews?.Count > 0 ? course.Reviews.Average(r => r.Stars) : 0.0,
            AverageReviewDifficulty = averageReviewDifficuly,
            difficultyCounts,
            ReviewCount = course.Reviews?.Count ?? 0
        });
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

        var course = await context.Courses.FindAsync(request.Id);
        if (course == null)
            return NotFound("Course not found");

        var review = await context.CourseReviews
            .Where(cr => cr.CourseId == course.Id && cr.UserId == userId)
            .FirstOrDefaultAsync();
        if (review != null)
            return BadRequest("You have already reviewed this course");

        CourseReview newReview = new()
        {
            Course = course,
            User = user,
            Text = request.Text,
            Stars = request.Stars,
            Difficulty = request.Difficulty
        };

        await context.CourseReviews.AddAsync(newReview);
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

        var course = await context.Courses.FindAsync(request.Id);
        if (course == null)
            return NotFound("Course not found");

        var review = await context.CourseReviews
            .Where(cr => cr.CourseId == course.Id && cr.UserId == userId)
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

    [Authorize(Roles = "Moderator,Admin")]
    [HttpPost("CreateCourse")]
    public async Task<IActionResult> CreateCourse(CreateCourseDto request)
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest("UserId in token is malformed");

        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return NotFound("User for account not found");

        Course course = new()
        {
            Title = request.Title,
            Description = request.Description,
            Difficulty = request.Difficulty,
            Author = user
        };

        var rootPath = configuration.GetValue<string>("AppSettings:Storage")!;
        var coursePath = Path.Combine(rootPath, "courses", $"tmp{new Random().Next()}");
        while (Directory.Exists(coursePath))
            coursePath = Path.Combine(rootPath, "courses", $"tmp{new Random().Next()}");
        Directory.CreateDirectory(coursePath);

        if (request.Banner != null && request.Banner.Length > 0)
        {
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };
            var extension = Path.GetExtension(request.Banner.FileName).ToLowerInvariant();

            if (!allowedExtensions.Contains(extension))
            {
                BuildHelper.ForceDeleteDirectory(coursePath);
                return BadRequest("Only .jpg, .jpeg, and .png files are allowed");
            }

            if (!request.Banner.ContentType.StartsWith("image/"))
            {
                BuildHelper.ForceDeleteDirectory(coursePath);
                return BadRequest("Invalid file content type");
            }

            var imagePath = Path.Combine(coursePath, "banner" + extension);

            using var stream = new FileStream(imagePath, FileMode.Create);
            await request.Banner.CopyToAsync(stream);
            course.Banner = "banner" + extension;
        }

        var challengeItems = request.Items
            .Select((item, index) => new { item, index })
            .Where(x => x.item.Type == CourseItemType.Challenge)
            .ToList();

        var lessonItems = request.Items
            .Select((item, index) => new { item, index })
            .Where(x => x.item.Type == CourseItemType.Lesson)
            .ToList();

        var validChallenges = await context.Challenges
            .Where(c => challengeItems.Select(ci => ci.item.Id).Contains(c.Id))
            .ToDictionaryAsync(c => c.Id);

        if (challengeItems.Count != validChallenges.Count)
        {
            BuildHelper.ForceDeleteDirectory(coursePath);
            return BadRequest("Invalid challenge in Course");
        }

        var validLessons = await context.Lessons
            .Where(c => lessonItems.Select(ci => ci.item.Id).Contains(c.Id))
            .ToDictionaryAsync(l => l.Id);

        if (lessonItems.Count != validLessons.Count)
        {
            BuildHelper.ForceDeleteDirectory(coursePath);
            return BadRequest("Invalid lesson in Course");
        }

        var challenges = challengeItems
            .Select(ci => new CourseChallenge
            {
                Challenge = validChallenges[ci.item.Id],
                Order = ci.index,
                Course = course
            });

        var lessons = lessonItems
            .Select(li => new CourseLesson
            {
                Lesson = validLessons[li.item.Id],
                Order = li.index,
                Course = course
            });

        await context.Courses.AddAsync(course);
        await context.CourseChallenges.AddRangeAsync(challenges);
        await context.CourseLessons.AddRangeAsync(lessons);
        await context.SaveChangesAsync();

        var realCoursePath = Path.Combine(rootPath, "courses", course.Id.ToString());
        Directory.Move(coursePath, realCoursePath);

        return Ok(course.Id);
    }

    [Authorize(Roles = "Moderator,Admin")]
    [HttpPut("UpdateCourse")]
    public async Task<IActionResult> UpdateCourse(CreateCourseDto request)
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest("UserId in token is malformed");

        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return NotFound("User for account not found");

        Course? course = await context.Courses
            .Where(c => c.Id == request.Id)
            .Include(c => c.Lessons)
            .Include(c => c.Challenges)
            .FirstOrDefaultAsync();

        if (course == null)
            return NotFound("Course not found");

        if (user.Role == UserRole.Moderator && course.AuthorId != user.Id)
            return Forbid("Not owning a course");

        if (course.Title != request.Title)
            course.Title = request.Title;
        if (course.Description != request.Description)
            course.Description = request.Description;
        if (course.Difficulty != request.Difficulty)
            course.Difficulty = request.Difficulty;

        var rootPath = configuration.GetValue<string>("AppSettings:Storage")!;
        var coursePath = Path.Combine(rootPath, "courses", course.Id.ToString());

        if (request.Banner != null && request.Banner.Length > 0)
        {
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };
            var extension = Path.GetExtension(request.Banner.FileName).ToLowerInvariant();

            if (!allowedExtensions.Contains(extension))
                return BadRequest("Only .jpg, .jpeg, and .png files are allowed");

            if (!request.Banner.ContentType.StartsWith("image/"))
                return BadRequest("Invalid file content type");

            var imagePath = Path.Combine(coursePath, "banner" + extension);

            using var stream = new FileStream(imagePath, FileMode.Create);
            await request.Banner.CopyToAsync(stream);
            course.Banner = "banner" + extension;
        }
        else if (request.DeleteBanner && course.Banner != null)
        {
            var filePath = Path.Combine(rootPath, course.Banner);
            System.IO.File.Delete(filePath);
            course.Banner = null;
        }

        var challengeItems = request.Items
            .Select((item, index) => new { item, index })
            .Where(x => x.item.Type == CourseItemType.Challenge)
            .ToList();

        var lessonItems = request.Items
            .Select((item, index) => new { item, index })
            .Where(x => x.item.Type == CourseItemType.Lesson)
            .ToList();

        var validChallenges = await context.Challenges
            .Where(c => challengeItems.Select(ci => ci.item.Id).Contains(c.Id))
            .ToDictionaryAsync(c => c.Id);

        if (challengeItems.Count != validChallenges.Count)
            return BadRequest("Invalid challenge in Course");

        var validLessons = await context.Lessons
            .Where(c => lessonItems.Select(ci => ci.item.Id).Contains(c.Id))
            .ToDictionaryAsync(l => l.Id);

        if (lessonItems.Count != validLessons.Count)
            return BadRequest("Invalid lesson in Course");

        var validChallengeIds = validChallenges.Keys.ToList();
        var validLessonIds = validLessons.Keys.ToList();

        var forDeleteChallenges = await context.CourseChallenges
            .Where(cc => cc.CourseId == course.Id && !validChallengeIds.Contains(cc.ChallengeId))
            .ToListAsync();

        var forDeleteLessons = await context.CourseLessons
            .Where(cl => cl.CourseId == course.Id && !validLessonIds.Contains(cl.LessonId))
            .ToListAsync();

        context.CourseChallenges.RemoveRange(forDeleteChallenges);
        context.CourseLessons.RemoveRange(forDeleteLessons);

        var existingChallengeIds = course.Challenges!.Select(cc => cc.ChallengeId).ToHashSet();
        foreach (var ci in challengeItems)
        {
            var existingChallenge = course.Challenges!.FirstOrDefault(cc => cc.ChallengeId == ci.item.Id);
            if (existingChallenge != null)
            {
                if (existingChallenge.Order != ci.index)
                    existingChallenge.Order = ci.index;
            }
            else
            {
                var newChallenge = new CourseChallenge
                {
                    Challenge = validChallenges[ci.item.Id],
                    Order = ci.index,
                    Course = course
                };
                context.CourseChallenges.Add(newChallenge);
            }
        }

        var existingLessonIds = course.Lessons!.Select(cl => cl.LessonId).ToHashSet();
        foreach (var li in lessonItems)
        {
            var existingLesson = course.Lessons!.FirstOrDefault(cl => cl.LessonId == li.item.Id);
            if (existingLesson != null)
            {
                if (existingLesson.Order != li.index)
                    existingLesson.Order = li.index;
            }
            else
            {
                var newLesson = new CourseLesson
                {
                    Lesson = validLessons[li.item.Id],
                    Order = li.index,
                    Course = course
                };
                context.CourseLessons.Add(newLesson);
            }
        }
        await context.SaveChangesAsync();

        return Ok();
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("DeleteCourse")]
    public async Task<ActionResult> DeleteLesson(DeleteIdDto request)
    {
        Course? course = await context.Courses
            .Where(c => c.Id == request.Id)
            .Include(c => c.Challenges)
            .Include(c => c.Lessons)
            .FirstOrDefaultAsync();

        if (course == null)
            return NotFound("Course not found");

        var rootPath = configuration.GetValue<string>("AppSettings:Storage")!;
        var coursePath = Path.Combine(rootPath, "courses", course.Id.ToString());
        BuildHelper.ForceDeleteDirectory(coursePath);

        context.Courses.Remove(course);
        await context.SaveChangesAsync();

        return Ok();
    }
    
    [HttpGet("Search")]
    public async Task<ActionResult> SearchCourse(
        string? search,
        int limit = 10,
        bool searchDescription = false
    )
    {
        var query = context.Courses
            .Include(l => l.Author)
            .Include(l => l.Reviews)
            .Include(l => l.Challenges)
            .Include(l => l.Lessons)
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(c =>
                c.Title.ToLower().Contains(search.ToLower()) ||
                (searchDescription && c.Description != null && c.Description.ToLower().Contains(search.ToLower())));

        var courses = await query.Take(Math.Min(limit, 10)).ToListAsync();

        return Ok(courses.Select(l => new
        {
            l.Id,
            l.Title,
            l.Description,
            AverageRating = l.Reviews?.Count > 0 ? l.Reviews.Average(r => r.Stars) : 0.0,
            l.Difficulty,
            AuthorName = l.Author?.Username,
            l.AuthorId,
            LessonCount = l.Lessons!.Count,
            ChallengeCount = l.Challenges!.Count,
            HasBanner = l.Banner != null
        }));
    }
}