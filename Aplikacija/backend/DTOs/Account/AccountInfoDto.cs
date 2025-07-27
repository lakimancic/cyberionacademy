namespace backend.DTOs.Account;

public class AccountInfoDto
{
    public required string Username { get; set; }
    public required string Email { get; set; }
    public required string FullName { get; set; }
    public string? Country { get; set; }
}