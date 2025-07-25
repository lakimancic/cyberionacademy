namespace backend.Models;

[PrimaryKey(nameof(TagId), nameof(ChallengeId))]
public class TagChallenge
{
    public int TagId { get; set; }
    public required Tag Tag { get; set; }
    public int ChallengeId { get; set; }
    public required Challenge Challenge { get; set; }
}