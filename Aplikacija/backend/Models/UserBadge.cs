namespace backend.Models;

[PrimaryKey(nameof(UserId), nameof(BadgeId))]
public class UserBadge
{
    public int UserId { get; set; }
    public required User User { get; set; }
    public int BadgeId { get; set; }
    public required Badge Badge { get; set; }
}