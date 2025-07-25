namespace backend.Models;

public class ConnectPair
{
    [Key]
    public int Id { get; set; }
    [MaxLength(30)]
    public required string Left { get; set; }
    [MaxLength(30)]
    public required string Right { get; set; }

    public int QuestionId { get; set; }
    public required ConnectQuestion Question { get; set; }
}