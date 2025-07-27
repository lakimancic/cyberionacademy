using System.Security.Claims;
using backend.DTOs.Account;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class AccountController(ApplicationDbContext context) : ControllerBase
{
    [HttpGet("GetInfo")]
    public async Task<ActionResult<AccountInfoDto>> GetInfo()
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest(new { Error = "UserId in token is malformed" });

        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return BadRequest(new { Error = "User for account not found" });

        return Ok(new AccountInfoDto
        {
            Username = user.Username,
            Email = user.Email,
            FullName = user.FullName,
            Country = user.Country
        });
    }

    [HttpPut("ChangeInfo")]
    public async Task<ActionResult> ChangeInfo(AccountInfoChangeDto request)
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest(new { Error = "UserId in token is malformed" });

        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return BadRequest(new { Error = "User for account not found" });

        Console.WriteLine(request.Username);
        if (request.Username != null)
            user.Username = request.Username;
        if (request.Email != null)
            user.Email = request.Email;
        if (request.FullName != null)
            user.FullName = request.FullName;
        user.Country = request.Country;

        context.Users.Update(user);
        await context.SaveChangesAsync();

        return Ok();
    }

    [HttpPut("ChangePassword")]
    public async Task<ActionResult> ChangePassword(PassowrdChangeDto request)
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest(new { Error = "UserId in token is malformed" });

        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return BadRequest(new { Error = "User for account not found" });

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            return BadRequest(new { Error = "Incorrect current password" });

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        context.Users.Update(user);
        await context.SaveChangesAsync();

        return Ok();
    }
}