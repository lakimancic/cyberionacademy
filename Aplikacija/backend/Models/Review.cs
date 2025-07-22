namespace backend.Models;

public abstract class Review
{
    public int Stars { get; set; }
    public int Difficulty { get; set; }
    public string? Text { get; set; }

    public required User User { get; set; }
}

public class LessonReview : Review
{
    public required Lesson Lesson { get; set; }
}

public class ChallengeReview : Review
{
    public required Challenge Challenge { get; set; }
}