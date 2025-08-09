namespace backend.Models;

[PrimaryKey(nameof(CourseId), nameof(ChallengeId))]
public class CourseChallenge
{
    public int CourseId { get; set; }
    public required Course Course { get; set; }
    public int ChallengeId { get; set; }
    public required Challenge Challenge { get; set; }
    public int Order { get; set; }
}