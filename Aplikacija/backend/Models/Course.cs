namespace backend.Models;

public class Course
{
    [Key]
    public int Id { get; set; }
    [MaxLength(30)]
    public required string Title { get; set; }
    public string? Description { get; set; }
    [MaxLength(20)]
    public string? Banner { get; set; }

    public required User Author { get; set; }
    public List<Lesson> Lessons { get; set; } = [];
    public List<Challenge> Challenges { get; set; } = [];
}