namespace backend.Models;

public class Quiz
{
    [Key]
    public int Id { get; set; }
    public int QuestionCount { get; set; }
    public int TimeMinutes { get; set; }
    public int TotalPoints { get; set; }

    public int LessonId { get; set; }
    public required Lesson Lesson { get; set; }
    public List<Question>? Questions { get; set; }
    public List<QuizResult>? Results { get; set; }
}