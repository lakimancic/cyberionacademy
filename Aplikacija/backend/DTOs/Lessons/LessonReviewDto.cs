namespace backend.DTOs
{
    public class LessonReviewDto
    {
        public int LessonId { get; set; }
        public int Stars { get; set; }
        public int Difficulty { get; set; }
        public string? Text { get; set; }
    }
}
