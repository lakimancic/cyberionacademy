namespace backend.Models;

public abstract class Review
{
    public int Stars { get; set; }
    public int Difficulty { get; set; }
    public string? Text { get; set; }

    public int UserId { get; set; }
    public User? User { get; set; }
}

public class LessonReview : Review
{
    public int LessonId { get; set; }
    public required Lesson Lesson { get; set; }
}

public class ChallengeReview : Review
{
    public int ChallengeId { get; set; }
    public required Challenge Challenge { get; set; }
}