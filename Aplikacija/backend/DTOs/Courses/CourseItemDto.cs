namespace backend.DTOs.Courses;

public enum CourseItemType
{
    Challenge,
    Lesson
}

public class CourseItemDto
{
    public int Id { get; set; }
    public CourseItemType Type { get; set; }
}