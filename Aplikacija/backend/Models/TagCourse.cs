namespace backend.Models;

[PrimaryKey(nameof(TagId), nameof(CourseId))]
public class TagCourse
{
    public int TagId { get; set; }
    public required Tag Tag { get; set; }
    public int CourseId { get; set; }
    public required Course Course { get; set; }
}