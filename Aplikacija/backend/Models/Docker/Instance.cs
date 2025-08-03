namespace backend.Models.Docker;

public class Instance
{
    public required string ContainerId { get; set; }
    public required string ImageId { get; set; }
    public int ChallengeId { get; set; }
    public DateTime End { get; set; }
    public List<Service> Services { get; set; } = [];
}