namespace backend.DTOs.Roles;

public class RoleRequestDto
{
    [MaxLength(300, ErrorMessage = "Request letter must be at most 300 characters")]
    public required string Text { get; set; }
    [RegularExpression("^(User|Helper|Moderator|Admin)$", ErrorMessage = "Invalid requested role")]
    public required string Role { get; set; }
}