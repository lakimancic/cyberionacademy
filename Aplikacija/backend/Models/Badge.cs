namespace backend.Models;

public class Badge
{
    [Key]
    public int Id { get; set; }
    public int Points { get; set; }
    [MaxLength(50)]
    public required string Name { get; set; }
    [MaxLength(10)]
    public required string Short { get; set; }
}