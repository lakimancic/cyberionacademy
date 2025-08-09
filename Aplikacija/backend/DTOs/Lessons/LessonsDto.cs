namespace backend.DTOs
{
    public class LessonDto
    {
        public int Id { get; set; }
        public required string Title { get; set; }
        public string? Description { get; set; }
        public int Difficulty { get; set; }
        public bool IsPublic { get; set; }
        public int CategoryId { get; set; }
        public int? AuthorId { get; set; }
        public int? QuizId { get; set; }
        public string? CategoryName { get; set; }
        public double AverageRating { get; set; }
        public int ReviewCount { get; set; }
        public string? AuthorName { get; set; }
        public string? AuthorRole { get; set; }
        public string? AuthorCountry { get; set; }
    }
}
