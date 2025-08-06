namespace backend.Controllers;


[Route("api/[controller]")]
[ApiController]
[Authorize]
public class CategoriesController(ApplicationDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<string>>> GetCategories()
    {
        var categories = await context.Categories
            .ToListAsync();

        return Ok(categories);
    }
}