namespace backend.Models;

public class Category
{
    [Key]
    public int Id { get; set; }
    [MaxLength(30)]
    public required string Name { get; set; }
    [MaxLength(5)]
    public required string ShortForm { get; set; }
}