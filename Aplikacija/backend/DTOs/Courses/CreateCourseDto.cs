namespace backend.DTOs.Courses;

public class CreateCourseDto
{
    public int? Id { get; set; }
    [Required(ErrorMessage = "Title is required")]
    [MinLength(3, ErrorMessage = "Title must be at least 3 characters")]
    [MaxLength(30, ErrorMessage = "Title must be at most 30 characters")]
    public string Title { get; set; } = null!;
    [Required(ErrorMessage = "Description is required")]
    [MinLength(10, ErrorMessage = "Description must be at least 10 characters")]
    [MaxLength(300, ErrorMessage = "Description must be at most 300 characters")]
    public string Description { get; set; } = null!;
    public int Difficulty { get; set; }
    public bool DeleteBanner { get; set; }

    public List<CourseItemDto> Items { get; set; } = [];
    public IFormFile? Banner { get; set; }
}