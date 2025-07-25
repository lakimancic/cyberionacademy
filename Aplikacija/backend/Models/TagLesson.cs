namespace backend.Models;

[PrimaryKey(nameof(TagId), nameof(LessonId))]
public class TagLesson
{
    public int TagId { get; set; }
    public required Tag Tag { get; set; }
    public int LessonId { get; set; }
    public required Lesson Lesson { get; set; }
}