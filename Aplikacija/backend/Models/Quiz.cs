namespace backend.Models;

public class Quiz
{
    [Key]
    public int Id { get; set; }
    public int QuestionCount { get; set; }
    public int TimeMinutes { get; set; }

    public required Lesson Lesson { get; set; }
    public List<Question>? Questions { get; set; }
}