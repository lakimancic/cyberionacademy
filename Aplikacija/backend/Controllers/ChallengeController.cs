using backend.DTOs;
using backend.DTOs.Challenges;
using backend.Services.ChallengeService;
using backend.Utils.Docker;
using System.Security.Claims;
using System.Security.Cryptography;
namespace backend.Controllers;


[Route("api/[controller]")]
[ApiController]
[Authorize]
public class ChallengeController(ApplicationDbContext context, IChallengeService challengeService, IConfiguration configuration) : ControllerBase
{

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
    bool ownChalls = false,
    bool? unsolvedOnly = null)
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest("UserId in token is malformed");

        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return BadRequest("User for account not found");

        var query = context.Challenges
            .Include(c => c.Category)
            .Include(c => c.Author)
            .Include(c => c.Reviews)
            .Include(c => c.Submissions)
            .AsQueryable();

        if (ownChalls)
        {
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
        if (unsolvedOnly == true)
        {
            {
                query = query.Where(c =>
                    !c.Submissions!.Any(s => s.UserId == userId && s.Correct));
            }
        }

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
            ("averagerating", "desc") => query.OrderByDescending(c => c.Reviews!.Average(r => r.Stars)),
            ("averagerating", _) => query.OrderBy(c => c.Reviews!.Average(r => r.Stars)),
            ("solvedcount", "desc") => query.OrderByDescending(c => c.Submissions!.Count(s => s.Correct)),
            ("solvedcount", _) => query.OrderBy(c => c.Submissions!.Count(s => s.Correct)),
            _ => query.OrderBy(c => c.Name)
        };

        var challenges = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var challengeDtos = challenges.Select(c => new
        {
            c.Id,
            c.Name,
            c.Description,
            IsArchived = c.Archived,
            IsPublic = c.Public,
            c.Points,
            CategoryName = c.Category.Name,
            CategoryShort = c.Category.ShortForm,
            AverageRating = c.Reviews?.Count > 0 ? c.Reviews.Average(r => r.Stars) : 0.0,
            SolvedCount = c.Submissions?.Count(s => s.Correct) ?? 0,
            c.Difficulty,
            HasSolved = c.Submissions?.Any(s => s.UserId == userId && s.Correct) ?? false,
        }).ToList();

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
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest("UserId in token is malformed");

        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return BadRequest("User for account not found");

        var challengeEntity = await context.Challenges
           .Include(c => c.Category)
           .Include(c => c.Author)
           .Include(c => c.Reviews)
           .Include(c => c.Submissions)
           .FirstOrDefaultAsync(c => c.Id == id);

        if (challengeEntity == null)
            return NotFound();

        var review = await context.ChallengeReviews
            .Where(cr => cr.ChallengeId == challengeEntity.Id && cr.UserId == user.Id)
            .Select(cr => new
            {
                cr.Text,
                cr.Stars,
                cr.Difficulty
            }).FirstOrDefaultAsync();

        double? averageReviewDifficuly = challengeEntity.Reviews?.Count > 0
            ? challengeEntity.Reviews.Average(r => r.Difficulty)
            : null;

        var difficultyCounts = Enumerable.Range(0, 10)
            .Select(d => new
            {
                Difficulty = d,
                Count = challengeEntity.Reviews?.Count(r => r.Difficulty == d) ?? 0
            })
            .ToList();

        var rootPath = configuration.GetValue<string>("AppSettings:Storage")!;
        var publicPath = Path.Combine(rootPath, "challenges", challengeEntity.Id.ToString(), "public");
        string? downloadFile = null;
        if (Directory.Exists(publicPath))
        {
            downloadFile = Directory.GetFiles(publicPath).FirstOrDefault();
            if (downloadFile != null)
                downloadFile = Path.GetFileName(downloadFile);
        }

        var instance = challengeService.GetInstance(userId, challengeEntity.Id);
        var instanceRet = instance != null ? new
        {
            TimeRem = (instance.End - DateTime.Now).TotalSeconds,
            instance.Services
        } : null;

        var hasSolved = await context.ChallengeSubmissions
            .AnyAsync(s => s.UserId == userId && s.ChallengeId == challengeEntity.Id && s.Correct);

        var challenge = new
        {
            challengeEntity.Id,
            challengeEntity.Name,
            challengeEntity.Description,
            CategoryName = challengeEntity.Category.Name,
            CategoryShort = challengeEntity.Category.ShortForm,
            challengeEntity.Points,
            SolvedCount = challengeEntity.Submissions?.Count(s => s.Correct) ?? 0,
            challengeEntity.Difficulty,
            AuthorId = challengeEntity.Author?.Id ?? 0,
            AuthorRole = challengeEntity.Author?.Role.ToString() ?? "Unknown",
            AuthorCountry = challengeEntity.Author?.Country ?? "Unknown",
            dockerImage = challengeEntity.DockerImage,
            challengeEntity.CreatedAt,
            AuthorName = challengeEntity.Author?.Username ?? "Unknown",
            IsArchived = challengeEntity.Archived,
            IsPublic = challengeEntity.Public,
            ReviewCount = challengeEntity.Reviews?.Count ?? 0,
            AverageRating = challengeEntity.Reviews?.Count > 0 ? challengeEntity.Reviews.Average(r => r.Stars) : 0.0,
            AverageReviewDifficulty = averageReviewDifficuly,
            difficultyCounts,
            DownloadFile = downloadFile,
            Instance = instanceRet,
            review,
            hasSolved,
        };

        return Ok(challenge);
    }

    [HttpPost("SubmitFlag")]
    public async Task<IActionResult> SubmitSubmission([FromBody] SubmissionDto dto)
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest("UserId in token is malformed");

        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return BadRequest("User for account not found");

        var challenge = await context.Challenges
            .FirstOrDefaultAsync(c => c.Id == dto.ChallengeId);

        if (challenge == null)
            return NotFound("Challenge not found.");

        var hasSolved = await context.ChallengeSubmissions
            .AnyAsync(s => s.UserId == userId && s.ChallengeId == dto.ChallengeId && s.Correct);

        if (hasSolved)
            return BadRequest("You have already solved challenge");

        var isCorrect = challenge.Flag.Trim() == dto.Flag.Trim();
        if (isCorrect && !challenge.Archived)
        {
            user.TotalPoints += challenge.Points;
        }

        var submission = new ChallengeSubmission
        {
            Flag = dto.Flag,
            Challenge = challenge,
            Correct = isCorrect,
            SubmittedAt = DateTime.UtcNow,
            ChallengeId = dto.ChallengeId,
            UserId = userId
        };

        context.ChallengeSubmissions.Add(submission);
        await context.SaveChangesAsync();

        return Ok(new { correct = isCorrect });
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

        var challenge = await context.Challenges.FindAsync(request.Id);
        if (challenge == null)
            return NotFound("Challenge not found");

        var review = await context.ChallengeReviews
            .Where(cr => cr.ChallengeId == challenge.Id && cr.UserId == userId)
            .FirstOrDefaultAsync();
        if (review != null)
            return BadRequest("You have already reviewed this challenge");

        ChallengeReview newReview = new()
        {
            Challenge = challenge,
            User = user,
            Text = request.Text,
            Stars = request.Stars,
            Difficulty = request.Difficulty
        };

        await context.ChallengeReviews.AddAsync(newReview);
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

        var challenge = await context.Challenges.FindAsync(request.Id);
        if (challenge == null)
            return NotFound("Challenge not found");

        var review = await context.ChallengeReviews
            .Where(cr => cr.ChallengeId == challenge.Id && cr.UserId == userId)
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

    [HttpGet("DownloadFile/{id}")]
    public async Task<ActionResult> DownloadFile(int id)
    {
        var challenge = await context.Challenges.FindAsync(id);

        if (challenge == null)
            return NotFound("Challenge not found");

        var rootPath = configuration.GetValue<string>("AppSettings:Storage")!;
        var publicPath = Path.Combine(rootPath, "challenges", challenge.Id.ToString(), "public");

        if (!Directory.Exists(publicPath))
            return NotFound("Directory not found");

        var filePath = Directory.GetFiles(publicPath).FirstOrDefault();

        if (filePath == null)
            return NotFound("File nout found");

        var fileName = Path.GetFileName(filePath);
        var fileBytes = System.IO.File.ReadAllBytes(filePath);

        var provider = new Microsoft.AspNetCore.StaticFiles.FileExtensionContentTypeProvider();
        if (!provider.TryGetContentType(filePath, out var contentType))
            contentType = "application/octet-stream";

        return File(fileBytes, contentType, fileName);
    }

    [HttpGet("StartInstance/{id}")]
    public async Task<ActionResult> StartInstance(int id)
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest("UserId in token is malformed");

        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return NotFound("User for account not found");

        var challenge = await context.Challenges.FindAsync(id);
        if (challenge == null)
            return NotFound("Challenge not found");

        if (challenge.DockerImage == null)
            return BadRequest("Challenge doesn't have instance");

        var result = await challengeService.StartContainer(user.Id, challenge.Id, challenge.DockerImage);
        if (result != null)
            return BadRequest(result);

        var instance = challengeService.GetInstance(user.Id, challenge.Id);
        if (instance == null)
            return NotFound("Instance not found");

        return Ok(new
        {
            instance.Services,
            TimeRem = (instance.End - DateTime.Now).TotalSeconds
        });
    }

    [HttpDelete("StopInstance/{id}")]
    public async Task<ActionResult> StopInstance(int id)
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest("UserId in token is malformed");

        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return NotFound("User for account not found");

        var challenge = await context.Challenges.FindAsync(id);
        if (challenge == null)
            return NotFound("Challenge not found");

        if (challenge.DockerImage == null)
            return BadRequest("Challenge doesn't have instance");

        var result = await challengeService.StopContainer(user.Id, challenge.Id);
        if (result != null)
            return BadRequest(result);

        return Ok();
    }

    [HttpPut("ExtendInstance/{id}")]
    public async Task<ActionResult> ExtendInstance(int id)
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest("UserId in token is malformed");

        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return NotFound("User for account not found");

        var challenge = await context.Challenges.FindAsync(id);
        if (challenge == null)
            return NotFound("Challenge not found");

        if (challenge.DockerImage == null)
            return BadRequest("Challenge doesn't have instance");

        try
        {
            return Ok(challengeService.ExtendContainer(user.Id, challenge.Id));
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("Search")]
    public async Task<ActionResult> SearchChallenge(
        string? search,
        [FromQuery(Name = "exclude[]")] int[]? exclude,
        int limit = 10,
        bool searchDescription = false
    )
    {
        var query = context.Challenges
            .Include(c => c.Category)
            .Include(c => c.Author)
            .Include(c => c.Reviews)
            .Include(c => c.Submissions)
            .Where(c => c.Public)
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(c =>
                c.Name.ToLower().Contains(search.ToLower()) ||
                (searchDescription && c.Description.ToLower().Contains(search.ToLower())));

        if (exclude != null)
            query = query.Where(c => !exclude.Contains(c.Id));

        var challenges = await query.Take(Math.Min(limit, 10)).ToListAsync();

        return Ok(challenges.Select(c => new
        {
            c.Id,
            c.Name,
            c.Description,
            IsArchived = c.Archived,
            c.Points,
            c.Category,
            AverageRating = c.Reviews?.Count > 0 ? c.Reviews.Average(r => r.Stars) : 0.0,
            SolvedCount = c.Submissions?.Count(s => s.Correct) ?? 0,
            c.Difficulty,
        }));
    } 

    [Authorize(Roles = "Moderator,Admin")]
    [HttpPost("CreateChallenge")]
    public async Task<IActionResult> CreateChallenge([FromForm] CreateChallengeDto request)
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

        if (!challengeService.CheckPointsForDiff(request.Points, request.Difficulty))
            return BadRequest("Points are invalid for given difficulty");

        Challenge challenge = new()
        {
            Name = request.Name,
            Description = request.Description,
            Points = request.Points,
            Difficulty = request.Difficulty,
            Flag = request.Flag,
            Public = request.IsPublic,
            Archived = request.IsArchived,
            Category = category,
            CreatedAt = DateTime.Now
        };

        var rootPath = configuration.GetValue<string>("AppSettings:Storage")!;
        var chalPath = Path.Combine(rootPath, "challenges", $"tmp{new Random().Next()}");
        while (Directory.Exists(chalPath))
            chalPath = Path.Combine(rootPath, "challenges", $"tmp{new Random().Next()}");
        Directory.CreateDirectory(chalPath);

        if (request.DownloadFile != null && request.DownloadFile.Length > 0)
        {
            var publicPath = Path.Combine(chalPath, "public");
            BuildHelper.ForceDeleteDirectory(publicPath);
            Directory.CreateDirectory(publicPath);

            try
            {
                using var downloadStream = new FileStream(Path.Combine(publicPath, request.DownloadFile.FileName), FileMode.Create);
                await request.DownloadFile.CopyToAsync(downloadStream);
            }
            catch (Exception ex)
            {
                BuildHelper.ForceDeleteDirectory(chalPath);
                return BadRequest(ex.Message);
            }
        }

        if (request.DockerFile != null && request.DockerFile.Length > 0)
        {
            if (Path.GetExtension(request.DockerFile.FileName).ToLowerInvariant() != ".zip")
            {
                BuildHelper.ForceDeleteDirectory(chalPath);
                return BadRequest("Docker file must be zip");
            }

            var dockerPath = Path.Combine(chalPath, "docker");
            bool success = await BuildHelper.ExtractZipAsync(request.DockerFile.OpenReadStream(), dockerPath);

            if (!success)
            {
                BuildHelper.ForceDeleteDirectory(chalPath);
                return BadRequest("Invalid Docker Zip file");
            }
        }

        await context.Challenges.AddAsync(challenge);
        await context.SaveChangesAsync();

        var realChalPath = Path.Combine(rootPath, "challenges", challenge.Id.ToString());
        Directory.Move(chalPath, realChalPath);

        return Ok(challenge.Id);
    }

    [Authorize(Roles = "Moderator,Admin")]
    [HttpPut("UpdateChallenge")]
    public async Task<IActionResult> UpdateChallenge([FromForm] CreateChallengeDto request)
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest("UserId in token is malformed");

        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return NotFound("User for account not found");

        Challenge? challenge = await context.Challenges.FindAsync(request.Id);
        if (challenge == null)
            return NotFound("Challenge not found");

        if (user.Role == UserRole.Moderator && challenge.AuthorId != user.Id)
            return Forbid("Not owning a challenge");

        if (challenge.Name != request.Name)
            challenge.Name = request.Name;
        if (challenge.Description != request.Description)
            challenge.Description = request.Description;
        if (challenge.Difficulty != request.Difficulty)
            challenge.Difficulty = request.Difficulty;
        if (challenge.Points != request.Points)
        {
            if (!challengeService.CheckPointsForDiff(request.Points, request.Difficulty))
                return BadRequest("Points are invalid for given difficulty");

            challenge.Points = request.Points;
        }
        if (challenge.Flag != request.Flag)
            challenge.Flag = request.Flag;
        if (challenge.Public != request.IsPublic)
            challenge.Public = request.IsPublic;
        if (challenge.Archived != request.IsArchived)
            challenge.Archived = request.IsArchived;
        if (challenge.CategoryId != request.CategoryId)
        {
            Category? category = await context.Categories.FindAsync(request.CategoryId);
            if (category == null)
                return NotFound("Category not found");
            challenge.Category = category;
        }

        var rootPath = configuration.GetValue<string>("AppSettings:Storage")!;
        var chalPath = Path.Combine(rootPath, "challenges", challenge.Id.ToString());

        if (request.DownloadFile != null && request.DownloadFile.Length > 0)
        {
            var publicPath = Path.Combine(chalPath, "public");
            BuildHelper.ForceDeleteDirectory(publicPath);
            Directory.CreateDirectory(publicPath);

            try
            {
                using var downloadStream = new FileStream(Path.Combine(publicPath, request.DownloadFile.FileName), FileMode.Create);
                await request.DownloadFile.CopyToAsync(downloadStream);
            }
            catch (Exception ex)
            {
                BuildHelper.ForceDeleteDirectory(publicPath);
                return BadRequest(ex.Message);
            }
        }
        else if (request.DeleteDownloadFile)
        {
            var publicPath = Path.Combine(chalPath, "public");
            BuildHelper.ForceDeleteDirectory(publicPath);
        }

        if (request.DockerFile != null && request.DockerFile.Length > 0)
        {
            if (Path.GetExtension(request.DockerFile.FileName).ToLowerInvariant() != ".zip")
                return BadRequest("Docker file must be zip");

            var dockerPath = Path.Combine(chalPath, "docker");
            bool success = await BuildHelper.ExtractZipAsync(request.DockerFile.OpenReadStream(), dockerPath);

            if (!success)
            {
                BuildHelper.ForceDeleteDirectory(dockerPath);
                return BadRequest("Invalid Docker Zip file");
            }
        }
        else if (request.DeleteDockerFile)
        {
            if (challenge.DockerImage != null)
                return BadRequest("Cannot delete docker files while image exists");
            var dockerPath = Path.Combine(chalPath, "docker");
            BuildHelper.ForceDeleteDirectory(dockerPath);
        }

        await context.SaveChangesAsync();

        return Ok();
    }

    [Authorize(Roles = "Moderator,Admin")]
    [HttpGet("ModChallenge")]
    public async Task<ActionResult> GetModChallenge(int challengeId)
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest("UserId in token is malformed");

        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return NotFound("User for account not found");

        Challenge? challenge = await context.Challenges
            .Where(c => c.Id == challengeId)
            .Include(c => c.Category)
            .FirstOrDefaultAsync();
        if (challenge == null)
            return NotFound("Challenge not found");

        var rootPath = configuration.GetValue<string>("AppSettings:Storage")!;
        string? dockerFile = null;
        string? downloadFile = null;

        var publicPath = Path.Combine(rootPath, "challenges", challenge.Id.ToString(), "public");
        var dockerPath = Path.Combine(rootPath, "challenges", challenge.Id.ToString(), "docker");

        if (Directory.Exists(dockerPath) && System.IO.File.Exists(Path.Combine(dockerPath, "Dockerfile")))
            dockerFile = "Dockerfile exists";

        if (Directory.Exists(publicPath))
        {
            var filePath = Directory.GetFiles(publicPath).FirstOrDefault();
            downloadFile = filePath != null ? Path.GetFileName(filePath) : null;
        }

        return Ok(new
        {
            challenge.Id,
            challenge.Name,
            challenge.Description,
            challenge.Points,
            challenge.Flag,
            challenge.Difficulty,
            IsPublic = challenge.Public,
            IsArchived = challenge.Archived,
            challenge.DockerImage,
            CategoryName = challenge.Category.Name,
            DownloadFile = downloadFile,
            DockerFile = dockerFile
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("DeleteChallenge")]
    public async Task<ActionResult> DeleteChallenge(DeleteIdDto request)
    {
        Challenge? challenge = await context.Challenges.FindAsync(request.Id);

        if (challenge == null)
            return NotFound("Lesson not found");

        var rootPath = configuration.GetValue<string>("AppSettings:Storage")!;
        var chalPath = Path.Combine(rootPath, "challenges", challenge.Id.ToString());
        BuildHelper.ForceDeleteDirectory(chalPath);

        if (challenge.DockerImage != null)
            await challengeService.RemoveImage(challenge.DockerImage, challenge.Id);

        context.Challenges.Remove(challenge);
        await context.SaveChangesAsync();

        return Ok();
    }
}