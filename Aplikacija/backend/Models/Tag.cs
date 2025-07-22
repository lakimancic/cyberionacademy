namespace backend.Models;

public class Tag
{
    [Key]
    public int Id { get; set; }
    [MaxLength(30)]
    public required string Name { get; set; }
}