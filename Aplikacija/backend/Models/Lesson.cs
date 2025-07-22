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

    public Quiz? Quiz { get; set; }
    public required Category Category { get; set; }
    public required User Author { get; set; }
    public List<Tag> Tags { get; set; } = [];
}