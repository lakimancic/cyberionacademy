using System.Runtime.CompilerServices;
using backend.Services.UserServices;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class ScoreboardController(ApplicationDbContext context, IUserService service) : ControllerBase
{
    const int pageSize = 10;

    [HttpGet]
    public async Task<ActionResult> GetScoreboard(int page = 1, string? country = null)
    {
        var query = context.Users
            .Where(u => u.TotalPoints > 0)
            .AsQueryable();

        int totalSum = 0;
        if (!string.IsNullOrEmpty(country))
        {
            query = query.Where(u => u.Country == country);
            totalSum = await query.SumAsync(u => u.TotalPoints);
        }

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var users = await query
            .OrderBy(u => u.TotalPoints)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new
            {
                u.Id,
                u.Username,
                u.TotalPoints,
                u.Country
            })
            .ToListAsync();

        if (users.Count == 0)
            return Ok(new
            {
                Users = users,
                TotalPages = totalPages
            });

        var rankedUsers = new List<object>();
        int rank = 0;
        if (string.IsNullOrEmpty(country))
            rank = await context.Users.CountAsync(u => u.TotalPoints > users[0].TotalPoints);
        else
            rank = await context.Users
                .Where(u => u.Country == country)
                .CountAsync(u => u.TotalPoints > users[0].TotalPoints);
        int prevPoints = 0;

        foreach (var user in users)
        {
            if (prevPoints != user.TotalPoints)
                rank++;

            rankedUsers.Add(new
            {
                RankNum = rank,
                Rank = service.GetRank(user.TotalPoints, rank, totalCount),
                user.Id,
                user.Username,
                user.Country,
                user.TotalPoints
            });
        }

        return Ok(new
        {
            Users = rankedUsers,
            TotalPages = totalPages,
            TotalSum = totalSum
        });
    }

    [HttpGet("Countries")]
    public async Task<ActionResult> GetCountriesScoreboard(int page = 1)
    {
        var query = context.Users
            .Where(u => u.Country != null)
            .GroupBy(u => u.Country)
            .Select(g => new
            {
                Country = g.Key,
                Points = g.Sum(u => u.TotalPoints),
                Users = g.Count()
            })
            .AsQueryable();

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var countries = await query
            .OrderBy(g => g.Points)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        if (countries.Count == 0)
            return Ok(new
            {
                Countries = countries,
                TotalPages = totalPages
            });

        var rankedCountries = new List<object>();
        int rank = await query.CountAsync(g => g.Points > countries[0].Points);
        int prevPoints = 0;

        foreach (var country in countries)
        {
            if (prevPoints != country.Points)
                rank++;

            rankedCountries.Add(new
            {
                RankNum = rank,
                country.Country,
                country.Users
            });
        }

        return Ok(new
        {
            Users = rankedCountries,
            TotalPages = totalPages,
        });
    }
}