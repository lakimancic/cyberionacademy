namespace backend.DTOs.Lessons;

public class CreateLessonDto
{
    public int? Id { get; set; }
    [Required(ErrorMessage = "Title is required")]
    [MinLength(3, ErrorMessage = "Title must be at least 3 characters")]
    [MaxLength(50, ErrorMessage = "Title must be at most 30 characters")]
    public string Title { get; set; } = null!;
    [Required(ErrorMessage = "Description is required")]
    [MinLength(10, ErrorMessage = "Description must be at least 10 characters")]
    public string Description { get; set; } = null!;
    [Required(ErrorMessage = "Difficulty is required")]
    [Range(0, 9, ErrorMessage = "Difficulty must be between 0 and 9")]
    public int Difficulty { get; set; }
    [Required(ErrorMessage = "Visibility is required")]
    public bool Public { get; set; }
    public string? Content { get; set; }
    [Required(ErrorMessage = "Category is required")]
    public int CategoryId { get; set; }
    public CreateQuizDto? Quiz { get; set; }
}