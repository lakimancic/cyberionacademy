namespace backend.DTOs;

public class CoursesDto
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string? Description { get; set; }
   
    public string? AutorName { get; set; }

    public int? AutorId { get; set; }

    public double AverageRating { get; set; }
   
    public int Difficulty { get; set; }
}