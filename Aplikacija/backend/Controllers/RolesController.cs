using System.Security.Claims;
using backend.DTOs.Roles;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class RolesController(ApplicationDbContext context) : ControllerBase
{
    const int pageSize = 10;

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

    [HttpPut("AcceptRejectRole")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> AcceptRejectRole(AcceptDenyDto request)
    {
        RoleRequest? roleRequest = await context.RoleRequests
            .Include(r => r.RequestedBy)
            .FirstOrDefaultAsync(r => r.Id == request.RequestId);

        if (roleRequest == null)
            return NotFound("Role Request is not found");

        if (roleRequest.Status != RoleRequestStatus.Pending)
            return BadRequest("Role Request already resolved");

        roleRequest.Status = request.Accept ? RoleRequestStatus.Accepted : RoleRequestStatus.Rejected;
        roleRequest.RequestedBy.Role = roleRequest.Role;

        await context.SaveChangesAsync();

        return Ok();
    }

    [HttpPut("ChangeUserRole")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> ChangeUserRole(ChangeRoleDto request)
    {
        User? user = await context.Users.FindAsync(request.UserId);

        if (user == null)
            return NotFound("User is not found");

        UserRole newRole = Enum.Parse<UserRole>(request.NewRole);

        if (user.Role != newRole)
        {
            user.Role = newRole;
            await context.SaveChangesAsync();
        }

        return Ok();
    }

    [HttpGet("RoleRequests")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> GetRoleRequests(
        int page = 1,
        bool pending = true
    )
    {
        var query = context.RoleRequests
            .Include(rr => rr.RequestedBy)
            .Where(rr => pending ^ (rr.Status != RoleRequestStatus.Pending))
            .AsQueryable();

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var result = await query
            .OrderBy(rr => rr.RequestedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(rr => new
            {
                rr.Id,
                rr.RequestedAt,
                rr.RequestedBy.Username,
                Role = rr.Role.ToString(),
                UserId = rr.RequestedById,
                rr.Text,
                Status = rr.Status.ToString()
            })
            .ToListAsync();

        return Ok(new
        {
            TotalPages = totalPages,
            Requests = result
        });
    }

    [HttpGet("UserList")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> GetUserList(
        int page = 1,
        string? sortKey = "username",
        string? sortDir = "asc",
        string? search = null,
        string? role = null
    )
    {
        var query = context.Users.AsQueryable();

        if (Enum.TryParse(role, out UserRole realRole))
            query = query.Where(u => u.Role == realRole);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(
                u => u.Username.ToLower().Contains(search.ToLower()) ||
                    u.FullName.ToLower().Contains(search.ToLower()) ||
                    u.Email.ToLower().Contains(search.ToLower()));

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        query = (sortKey, sortDir) switch
        {
            ("username", "desc") => query.OrderByDescending(u => u.Username),
            ("username", _) => query.OrderBy(u => u.Username),
            ("email", "desc") => query.OrderByDescending(u => u.Email),
            ("email", _) => query.OrderBy(u => u.Email),
            ("fullName", "desc") => query.OrderByDescending(u => u.FullName),
            ("fullName", _) => query.OrderBy(u => u.FullName),
            _ => query.OrderBy(u => u.Username)
        };

        var users = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new
            {
                UserId = u.Id,
                u.Username,
                u.Email,
                u.FullName,
                Role = u.Role.ToString(),
            })
            .ToListAsync();

        return Ok(new
        {
            Users = users,
            TotalPages = totalPages
        });
    }
}