using backend.DTOs;
namespace backend.Controllers;


[Route("api/[controller]")]
[ApiController]
[Authorize]
public class ChallengeController : ControllerBase
{
    public ApplicationDbContext Context { get; set; }

    public ChallengeController(ApplicationDbContext context)
    {
        Context = context;
    }

    [HttpGet("GetChallenges")]
    public async Task<ActionResult<IEnumerable<ChallengeDto>>> GetChallenges()
    {
        var challenges = await Context.Challenges
            .Include(c => c.Category)
            //.Include(c => c.User)
            .Select(c => new ChallengeDto
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                //IsArchieved = c.Archieved,
                IsPublic = c.Public,
                Points = c.Points,
                CreatedAt = c.CreatedAt,
                //AutorName = c.User.Username,
                CategoryName = c.Category.Name
            })
            .ToListAsync();

        return Ok(challenges);
    }

}