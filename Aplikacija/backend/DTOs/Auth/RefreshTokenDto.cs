namespace backend.DTOs.Auth;

public class RefreshTokenDto
{
    public int UserId { get; set; }
    public required string RefreshToken { get; set; }
}