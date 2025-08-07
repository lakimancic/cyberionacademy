using backend.Models.Docker;
using backend.Utils.Docker;

namespace backend.Services.ChallengeService;

struct PointValue(int start, int step)
{
    public int Start { get; set; } = start;
    public int Step { get; set; } = step;
}

public class ChallengeService(IDockerInstancer instancer) : IChallengeService
{
    private static readonly PointValue[] pointValues =
    [
        new PointValue(50, 10),
        new PointValue(100, 10),
        new PointValue(150, 10),
        new PointValue(200, 20),
        new PointValue(300, 20),
        new PointValue(400, 20),
        new PointValue(500, 20),
        new PointValue(600, 50),
        new PointValue(850, 50),
        new PointValue(1100, 100)
    ];

    public bool CheckPointsForDiff(int points, int difficulty)
    {
        if (difficulty < 0 || difficulty >= pointValues.Length)
            return false;

        var pValue = pointValues[difficulty];
        if (points < pValue.Start || points > pValue.Start + pValue.Step * 4)
            return false;

        return (points - pValue.Start) % pValue.Step == 0;
    }

    public async Task<string?> StartContainer(int userId, int challengeId, string imageId)
    {
        if (instancing.Contains(Tuple.Create(userId, challengeId)))
            return "Already starting container";

        string? res = null;
        instancing.Add(Tuple.Create(userId, challengeId));
        try
        {
            await instancer.CreateAndStartContainerAsync(userId, challengeId, imageId);
        }
        catch (Exception ex)
        {
            res = ex.Message;
        }
        finally
        {
            instancing.Remove(Tuple.Create(userId, challengeId));
        }
        return res;
    }

    public bool IsInstancing(int userId, int challengeId)
    {
        return instancing.Contains(Tuple.Create(userId, challengeId));
    }

    public async Task RemoveImage(string imageId, int challengeId)
    {
        await instancer.RemoveImageAsync(imageId, challengeId);
    }

    public Instance? GetInstance(int userId, int challengeId)
    {
        return instancer.GetInstance(userId, challengeId);
    }

    public async Task<string?> StopContainer(int userId, int challengeId)
    {
        try
        {
            await instancer.StopAndDeleteContainerAsync(userId, challengeId);
            return null;
        }
        catch (Exception ex)
        {
            return ex.Message;
        }
    }

    public DateTime ExtendContainer(int userId, int challengeId)
    {
        return instancer.ExtendContainer(userId, challengeId);
    }

    public async Task<string?> BuildImage(int userId, int challengeId, string directory, string connectionId, Action<string>? action)
    {
        if (building.ContainsKey(Tuple.Create(userId, challengeId)))
            throw new Exception("Already building image");

        building.Add(Tuple.Create(userId, challengeId), connectionId);
        string? imageId = await instancer.BuildImageAsync(directory, action);
        building.Remove(Tuple.Create(userId, challengeId));
        return imageId;
    }

    public void UpdateBuiling(int userId, int challengeId, string connectionId)
    {
        if (building.ContainsKey(Tuple.Create(userId, challengeId)))
            building.Add(Tuple.Create(userId, challengeId), connectionId);
    }

    public string? BuildingConnectionId(int userId, int challengeId)
    {
        return building.GetValueOrDefault(Tuple.Create(userId, challengeId));
    }

    public async Task DestroyImage(string imageId, int challengeId)
    {
        await instancer.RemoveImageAsync(imageId, challengeId);
    }

    private readonly HashSet<Tuple<int, int>> instancing = [];
    private readonly Dictionary<Tuple<int, int>, string> building = [];
}