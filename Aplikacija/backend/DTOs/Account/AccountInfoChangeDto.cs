namespace backend.DTOs.Account;

public class AccountInfoChangeDto
{
    [Required(ErrorMessage = "Username is required")]
    [RegularExpression(@"^[a-zA-Z0-9_]+$", ErrorMessage = "In Username only letters, numbers, and underscores allowed")]
    [MinLength(3, ErrorMessage = "Username must be at least 3 characters")]
    [MaxLength(50, ErrorMessage = "Username must be at most 50 characters")]
    public string? Username { get; set; }
    [Required(ErrorMessage = "Email is required")]
    [MaxLength(50, ErrorMessage = "Username must be at most 50 characters")]
    [EmailAddress]
    public string? Email { get; set; }
    [Required(ErrorMessage = "Full name is required")]
    [RegularExpression(@"^[a-zA-Z]+(?: [a-zA-Z]+)*$", ErrorMessage = "In Full name only letters and single spaces allowed")]
    [MinLength(3, ErrorMessage = "Full name must be at least 3 characters")]
    [MaxLength(80, ErrorMessage = "Full name must be at most 80 characters")]
    public string? FullName { get; set; }
    [Length(2, 2, ErrorMessage = "Country code length must be 2 characters")]
    public string? Country { get; set; }
    [MaxLength(200, ErrorMessage = "Bio must be at most 200 characters")]
    public string? Bio { get; set; }
}