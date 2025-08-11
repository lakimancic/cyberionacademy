namespace backend.DTOs;

public class ReviewDto
{
    public int Id { get; set; }
    [Required(ErrorMessage = "Stars are required")]
    [Range(1, 5, ErrorMessage = "Stars must be between 1 and 5")]
    public int Stars { get; set; }
    [Required(ErrorMessage = "Difficulty is required")]
    [Range(0, 9, ErrorMessage = "Difficulty must be between 0 and 9")]
    public int Difficulty { get; set; }
    public string? Text { get; set; }
}
