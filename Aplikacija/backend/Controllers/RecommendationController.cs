using System.Security.Claims;
using backend.Services.Recommendations;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class RecommendationController(UserProfileService userProfileService, RecommendationEngine engine) : ControllerBase
{
    [HttpGet("userprofile/{userId}")]
    public async Task<ActionResult> GetUserProfile(int userId)
    {
        var profile = await userProfileService.BuildUserProfileAsync(userId);
        return Ok(profile);
    }

    [HttpGet("{userId}/")]
    public async Task<ActionResult> GetUserRecommendations(int userId)
    {
        // int userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");
        // if (userId == -1)
        //     return BadRequest("UserId in token is malformed");

        // User? user = await context.Users.FindAsync(userId);
        // if (user == null)
        //     return NotFound("User for account not found");

        var profile = await userProfileService.BuildUserProfileAsync(userId);
        var result = await engine.GetRecommendationsAsync(profile);

        return Ok(result);
    }

    [HttpGet("pools")]
    public async Task<ActionResult> GetPools()
    {
        var challengePools = await engine.GetGlobalChallengePoolsAsync();
        var lessonPools = await engine.GetGlobalLessonPoolsAsync();

        return Ok(new
        {
            challenges = challengePools,
            lessons = lessonPools
        });
    }
}