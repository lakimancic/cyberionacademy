namespace backend.DTOs.Challenges;

public class CreateChallengeDto
{
    public int? Id { get; set; }
    [Required(ErrorMessage = "Name is required")]
    [MinLength(3, ErrorMessage = "Name must be at least 3 characters")]
    [MaxLength(30, ErrorMessage = "Name must be at most 30 characters")]
    public required string Name { get; set; }
    [Required(ErrorMessage = "Description is required")]
    [MinLength(10, ErrorMessage = "Description must be at least 10 characters")]
    [MaxLength(300, ErrorMessage = "Description must be at most 300 characters")]
    public required string Description { get; set; }
    public int Points { get; set; }
    public int CategoryId { get; set; }
    [Required(ErrorMessage = "Flag is required")]
    [MinLength(5, ErrorMessage = "Flag must be at least 5 characters")]
    [MaxLength(80, ErrorMessage = "Flag must be at most 80 characters")]
    public required string Flag { get; set; }
    [Required(ErrorMessage = "Visibility is required")]
    public bool IsPublic { get; set; }
    [Required(ErrorMessage = "Status is required")]
    public bool IsArchived { get; set; }
    [Required(ErrorMessage = "Difficulty is required")]
    [Range(0, 9, ErrorMessage = "Difficulty must be between 0 and 9")]
    public int Difficulty { get; set; }

    public bool DeleteDownloadFile { get; set; }
    public bool DeleteDockerFile { get; set; }

    public IFormFile? DownloadFile { get; set; }
    public IFormFile? DockerFile { get; set; }
}