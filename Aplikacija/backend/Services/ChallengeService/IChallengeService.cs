using backend.Models.Docker;

namespace backend.Services.ChallengeService;

public interface IChallengeService
{
    bool CheckPointsForDiff(int points, int difficulty);
    Task<string?> StartContainer(int userId, int challengeId, string imageId);
    Task<string?> StopContainer(int userId, int challengeId);
    DateTime ExtendContainer(int userId, int challengeId);
    bool IsInstancing(int userId, int challengeId);
    Task<string?> BuildImage(int userId, int challengeId, string directory, string connectionId, Action<string>? action);
    Task DestroyImage(string imageId, int challengeId);
    Task RemoveImage(string imageId, int challengeId);
    void UpdateBuiling(int userId, int challengeId, string connectionId);
    string? BuildingConnectionId(int userId, int challengeId);
    Instance? GetInstance(int userId, int challengeId);
}