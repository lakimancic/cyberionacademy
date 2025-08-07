using backend.Utils.Docker;

namespace backend.Services.ChallengeService;

struct PointValue(int start, int step)
{
    public int Start { get; set; } = start;
    public int Step { get; set; } = step;
}

public class ChallengeService : IChallengeService
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
}