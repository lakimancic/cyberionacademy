namespace backend.DTOs.Lessons;

public class ConnectPairDto
{
    public int? Id { get; set; }
    public required string Left { get; set; }
    public required string Right { get; set; }
}