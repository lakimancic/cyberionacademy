using System.Security.Claims;
using backend.DTOs.Roles;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class RolesController(ApplicationDbContext context) : ControllerBase
{
    [HttpPost("SubmitRoleRequest")]
    public async Task<ActionResult> SubmitRoleRequest(RoleRequestDto request)
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest("UserId in token is malformed");

        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return BadRequest("User with account not found");

        string roleStr = HttpContext.User.FindFirst(ClaimTypes.Role)?.Value ?? "User";
        UserRole role = Enum.Parse<UserRole>(roleStr);
        UserRole reqRole = Enum.Parse<UserRole>(request.Role);

        if (role <= reqRole)
            return BadRequest("You are already this role or higher");

        await context.RoleRequests.AddAsync(new RoleRequest
        {
            RequestedAt = DateTime.Now,
            Role = reqRole,
            Text = request.Text,
            RequestedBy = user
        });
        await context.SaveChangesAsync();

        return Ok();
    }

    [HttpGet("GetRoleRequests")]
    public async Task<ActionResult> GetRoleRequests()
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest("UserId in token is malformed");

        var result = await context.RoleRequests
            .Where(rr => rr.RequestedById == userId)
            .OrderBy(rr => rr.RequestedAt)
            .Select(rr => new
            {
                rr.RequestedAt,
                Role = rr.Role.ToString(),
                Status = rr.Status.ToString()
            })
            .ToListAsync();

        return Ok(new
        {
            Requests = result,
            CanSubmit = result.Count == 0 || result.Last().RequestedAt.AddMonths(1) < DateTime.Now
        });
    }
}