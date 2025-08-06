using System.Security.Claims;
using backend.DTOs.Account;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class AccountController(ApplicationDbContext context, IConfiguration configuration) : ControllerBase
{
    [HttpGet("GetInfo")]
    public async Task<ActionResult<AccountInfoDto>> GetInfo()
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest("UserId in token is malformed");

        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return BadRequest("User for account not found");

        return Ok(new AccountInfoDto
        {
            Username = user.Username,
            Email = user.Email,
            FullName = user.FullName,
            Country = user.Country,
            Bio = user.Bio
        });
    }

    [HttpPut("ChangeInfo")]
    public async Task<ActionResult> ChangeInfo(AccountInfoChangeDto request)
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest("UserId in token is malformed");

        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return BadRequest("User for account not found");

        if (request.Username != null)
            user.Username = request.Username;
        if (request.Email != null)
            user.Email = request.Email;
        if (request.FullName != null)
            user.FullName = request.FullName;
        user.Country = request.Country;
        user.Bio = request.Bio;

        await context.SaveChangesAsync();

        return Ok();
    }

    [HttpPut("ChangePassword")]
    public async Task<ActionResult> ChangePassword(PassowrdChangeDto request)
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest("UserId in token is malformed");

        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return BadRequest("User for account not found");

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            return BadRequest("Incorrect current password");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await context.SaveChangesAsync();

        return Ok();
    }

    [HttpPost("ProfilePicture")]
    [RequestSizeLimit(2_097_152)]
    public async Task<IActionResult> UploadProfilePicture(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded");

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

        if (!allowedExtensions.Contains(extension))
            return BadRequest("Only .jpg, .jpeg, and .png files are allowed");

        if (!file.ContentType.StartsWith("image/"))
            return BadRequest("Invalid file content type");

        var rootPath = configuration.GetValue<string>("AppSettings:Storage")!;
        var userIdStr = HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (userIdStr == null)
            return BadRequest("Malformed JWT Token");

        var savePath = Path.Combine(rootPath, "users", userIdStr);
        Directory.CreateDirectory(savePath);

        var filePath = Path.Combine(savePath, "profile" + extension);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        int userId = int.Parse(userIdStr);
        User? user = await context.Users.FindAsync(userId);

        if (user == null)
            return BadRequest("User for account not found");

        user.Avatar = Path.Combine("users", userIdStr, "profile" + extension);
        await context.SaveChangesAsync();

        return Ok();
    }

    [HttpGet("ProfilePicture")]
    public async Task<IActionResult> GetProfilePicture()
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest("UserId in token is malformed");

        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return BadRequest("User for account not found");

        var rootPath = configuration.GetValue<string>("AppSettings:Storage")!;
        var filePath = Path.Combine(rootPath, user.Avatar ?? "0");
        if (user.Avatar == null || !System.IO.File.Exists(filePath))
            return NotFound("Profile picture not found");

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

    [HttpDelete("ProfilePicture")]
    public async Task<IActionResult> RemoveProfilePicture()
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest("UserId in token is malformed");

        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return BadRequest("User for account not found");

        var rootPath = configuration.GetValue<string>("AppSettings:Storage")!;
        var filePath = Path.Combine(rootPath, user.Avatar ?? "0");

        if (user.Avatar != null)
            System.IO.File.Delete(filePath);

        user.Avatar = null;
        await context.SaveChangesAsync();

        return Ok();
    }
}