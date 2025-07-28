namespace backend.DTOs.User;

public class CategoryStatsDto
{
    public required string Name { get; set; }
    public int Max { get; set; }
    public int Num { get; set; }
}