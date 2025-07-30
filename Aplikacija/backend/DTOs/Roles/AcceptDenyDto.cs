namespace backend.DTOs.Roles;

public class AcceptDenyDto
{
    public required int RequestId { get; set; }
    public bool Accept { get; set; }
}