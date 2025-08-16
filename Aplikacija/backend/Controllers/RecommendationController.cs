using System.Security.Claims;
using backend.Services.Recommendations;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class RecommendationController(UserProfileService userProfileService, RecommendationEngine engine, ApplicationDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult> GetUserRecommendations()
    {
        int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        if (userId == -1)
            return BadRequest("UserId in token is malformed");

        User? user = await context.Users.FindAsync(userId);
        if (user == null)
            return NotFound("User for account not found");

        var profile = await userProfileService.BuildUserProfileAsync(userId);
        var result = await engine.GetRecommendationsAsync(profile);

        return Ok(result);
    }
}