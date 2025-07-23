namespace backend.Models;

public class Challenge
{
    [Key]
    public int Id { get; set; }
    [MaxLength(30)]
    public required string Name { get; set; }
    public required string Description { get; set; }
    [MaxLength(80)]
    public required string Flag { get; set; }
    [MaxLength(80)]
    public string? DockerImage { get; set; }
    public int Points { get; set; }
    public bool Archived { get; set; } = false;
    public bool Public { get; set; } = true;
    public DateTime CreatedAt { get; set; }

    public User? Author { get; set; }
    public required Category Category { get; set; }
    public List<Tag>? Tags { get; set; }
    public List<ChallengeReview>? Reviews { get; set; }
    public List<ChallengeSubmission>? Submissions { get; set; }
}