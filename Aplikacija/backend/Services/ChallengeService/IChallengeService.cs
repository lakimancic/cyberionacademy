namespace backend.Services.ChallengeService;

public interface IChallengeService
{
    bool CheckPointsForDiff(int points, int difficulty);
}