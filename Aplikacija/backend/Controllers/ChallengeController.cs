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
    bool ownChalls = false)
    {
        var query = context.Challenges
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

            User? user = await context.Users.FindAsync(userId);
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

        double? averageReviewDifficuly = challengeEntity.Reviews?.Count > 0
            ? challengeEntity.Reviews.Average(r => (int)r.Difficulty)
            : null;

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

        var challenge = new
        {
            challengeEntity.Id,
            challengeEntity.Name,
            challengeEntity.Description,
            CategoryName = challengeEntity.Category.Name,
            challengeEntity.Points,
            SolvedCount = challengeEntity.Submissions?.Count(s => s.Correct) ?? 0,
            challengeEntity.Difficulty,
            AutorId = challengeEntity.Author?.Id ?? 0,
            AutorRole = challengeEntity.Author?.Role.ToString() ?? "Unknown",
            AutorCountry = challengeEntity.Author?.Country ?? "Unknown",
            dockerImage = challengeEntity.DockerImage,
            challengeEntity.CreatedAt,
            AutorName = challengeEntity.Author?.Username ?? "Unknown",
            IsArchived = challengeEntity.Archived,
            IsPublic = challengeEntity.Public,
            ReviewCount = challengeEntity.Reviews?.Count ?? 0,
            AverageRating = challengeEntity.Reviews?.Count > 0 ? challengeEntity.Reviews.Average(r => r.Stars) : 0.0,
            AverageReviewDifficulty = averageReviewDifficuly,
            DownloadFile = downloadFile,
            Instance = instanceRet
        };

        return Ok(challenge);
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

        context.ChallengeSubmissions.Add(submission);
        await context.SaveChangesAsync();

        return Ok(new { correct = isCorrect });
    }

    [HttpGet("HasSolved")]
    public async Task<IActionResult> HasUserSolved(int challengeId)
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest("UserId in token is malformed");

        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return BadRequest("User for account not found");

        var hasSolved = await context.ChallengeSubmissions
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

        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return BadRequest("User for account not found");
        var challenge = await context.Challenges.FindAsync(dto.ChallengeId);
        if (challenge == null)
            return NotFound("Challenge not found");
        var existingReview = await context.ChallengeReviews
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

        context.ChallengeReviews.Add(review);
        await context.SaveChangesAsync();

        return Ok();
    }
    [HttpGet("HasReviewed")]
    public async Task<IActionResult> HasUserReviewed(int challengeId)
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest("UserId in token is malformed");

        var hasReviewed = await context.ChallengeReviews
            .AnyAsync(r => r.UserId == userId && r.ChallengeId == challengeId);

        return Ok(hasReviewed);
    }

    [HttpGet("GetUserReview")]
    public async Task<IActionResult> GetUserReview(int challengeId)
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest("UserId in token is malformed");

        var review = await context.ChallengeReviews
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

        var review = await context.ChallengeReviews
            .FirstOrDefaultAsync(r => r.ChallengeId == dto.ChallengeId && r.UserId == userId);

        if (review == null)
            return NotFound("Review not found");

        review.Stars = dto.Stars;
        review.Difficulty = dto.Difficulty;
        review.Text = dto.Text;

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
                BuildHelper.ForceDeleteDirectory(publicPath);
                return BadRequest(ex.Message);
            }
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