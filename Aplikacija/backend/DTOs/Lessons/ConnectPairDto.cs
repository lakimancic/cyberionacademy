namespace backend.DTOs.Lessons;

public class ConnectPairDto
{
    public int? Id { get; set; }
    [Required(ErrorMessage = "Pair Text is required")]
    [MaxLength(30, ErrorMessage = "Pair Text must be at most 30 characters")]
    public required string Left { get; set; }
    [Required(ErrorMessage = "Pair Text is required")]
    [MaxLength(30, ErrorMessage = "Pair Text must be at most 30 characters")]
    public required string Right { get; set; }
}