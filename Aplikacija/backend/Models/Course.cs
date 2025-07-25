namespace backend.Models;

public class Course
{
    [Key]
    public int Id { get; set; }
    [MaxLength(30)]
    public required string Title { get; set; }
    public int Difficulty { get; set; }
    public string? Description { get; set; }
    [MaxLength(20)]
    public string? Banner { get; set; }

    public int? AuthorId { get; set; }
    public User? Author { get; set; }
    public List<CourseLesson>? Lessons { get; set; }
    public List<CourseChallenge>? Challenges { get; set; }
    public List<TagCourse>? Tags { get; set; }
}