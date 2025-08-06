namespace backend.Models;

public class Lesson
{
    [Key]
    public int Id { get; set; }
    [MaxLength(30)]
    public required string Title { get; set; }
    public required string Description { get; set; }
    public int Difficulty { get; set; }
    public bool Public { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public string? Content { get; set; }

    public Quiz? Quiz { get; set; }
    public int CategoryId { get; set; }
    public required Category Category { get; set; }
    public int? AuthorId { get; set; }
    public User? Author { get; set; }
    public List<LessonReview>? Reviews { get; set; }
}