namespace backend.DTOs.Roles;

public class ChangeRoleDto
{
    public int UserId { get; set; }
    [RegularExpression("^(User|Helper|Moderator|Admin)$", ErrorMessage = "Invalid requested role")]
    public required string NewRole { get; set; }
}