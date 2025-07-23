namespace backend.Models;

public enum RoleRequestStatus
{
    Pending,
    Accepted,
    Rejected
}

public class RoleRequest
{
    [Key]
    public int Id { get; set; }
    public DateTime RequestedAt { get; set; }
    public RoleRequestStatus Status { get; set; }
    public UserRole Role { get; set; }
    [MaxLength(300)]
    public required string Text { get; set; }

    public required User RequestedBy { get; set; }
}
