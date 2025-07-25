namespace backend.Models;

[PrimaryKey(nameof(CourseId), nameof(LessonId))]
public class CourseLesson
{
    public int CourseId { get; set; }
    public required Course Course { get; set; }
    public int LessonId { get; set; }
    public required Lesson Lesson { get; set; }
}