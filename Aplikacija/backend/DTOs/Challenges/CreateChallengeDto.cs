namespace backend.DTOs.Challenges;

public class CreateChallengeDto
{
    public required string Name { get; set; }
    public required string Description { get; set; }
    public int Points { get; set; }
    public int CategoryId { get; set; }
    public required string Flag { get; set; }
    public bool IsPublic { get; set; }
    public bool IsArchived { get; set; }
    public int Difficulty { get; set; }

    public IFormFile? DownloadFile { get; set; }
    public IFormFile? DockerFile { get; set; }
}