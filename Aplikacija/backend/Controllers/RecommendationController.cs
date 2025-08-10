using backend.Services.Recommendations;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class RecommendationController(UserProfileService userProfileService) : ControllerBase
{
    [HttpGet("userprofile/{userId}")]
    public async Task<ActionResult> GetUserProfile(int userId)
    {
        var profile = await userProfileService.BuildUserProfileAsync(userId);
        return Ok(profile);
    }
}