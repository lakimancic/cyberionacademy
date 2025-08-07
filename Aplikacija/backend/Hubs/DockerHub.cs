using System.Security.Claims;
using backend.Services.ChallengeService;
using Microsoft.AspNetCore.SignalR;

namespace backend.Hubs;

[Authorize(Roles = "Moderator,Admin")]
public class DockerHub(IChallengeService challengeService, ApplicationDbContext context, IConfiguration configuration) : Hub
{
    public async Task AcceptLogging(int challengeId)
    {
        if (Context.User == null)
            return;
        var userId = int.Parse(Context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");

        User? user = await context.Users.FindAsync(userId);
        Challenge? challenge = await context.Challenges.FindAsync(challengeId);
        if (user == null || challenge == null)
            return;

        challengeService.UpdateBuiling(userId, challengeId, Context.ConnectionId);
    }

    public async Task BuildImage(int challengeId)
    {
        if (Context.User == null)
            return;
        var userId = int.Parse(Context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");

        User? user = await context.Users.FindAsync(userId);
        Challenge? challenge = await context.Challenges.FindAsync(challengeId);
        if (user == null || challenge == null)
            return;

        if (user.Role == UserRole.Moderator && challenge.AuthorId != user.Id)
            return;

        if (challenge.DockerImage != null)
            return;

        var rootPath = configuration.GetValue<string>("AppSettings:Storage")!;
        var chalPath = Path.Combine(rootPath, "challenges", challenge.Id.ToString(), "docker");

        try
        {
            var imageId = await challengeService.BuildImage(userId, challengeId, chalPath, Context.ConnectionId, async log =>
            {
                var receiver = challengeService.BuildingConnectionId(userId, challengeId);
                if (receiver != null)
                    await Clients.Client(receiver).SendAsync("LogMessage", log);
            });

            challenge.DockerImage = imageId;
            await context.SaveChangesAsync();

            await Clients.Client(Context.ConnectionId).SendAsync("Finish");
        }
        catch (Exception) { }
    }

    public async Task DestroyImage(int challengeId)
    {
        if (Context.User == null)
            return;
        var userId = int.Parse(Context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "-1");

        User? user = await context.Users.FindAsync(userId);
        Challenge? challenge = await context.Challenges.FindAsync(challengeId);
        if (user == null || challenge == null)
            return;

        if (user.Role == UserRole.Moderator && challenge.AuthorId != user.Id)
            return;

        if (challenge.DockerImage == null)
            return;

        try
        {
            await challengeService.DestroyImage(challenge.DockerImage, challengeId);

            challenge.DockerImage = null;
            await context.SaveChangesAsync();

            await Clients.Client(Context.ConnectionId).SendAsync("Finish");
        }
        catch (Exception) { }
    }
}