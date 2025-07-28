namespace backend.DTOs.Auth;

public class RegisterDto
{
    [Required(ErrorMessage = "Email is required")]
    [MaxLength(50, ErrorMessage = "Username must be at most 50 characters")]
    [EmailAddress]
    public string Email { get; set; } = null!;

    [Required(ErrorMessage = "Password is required")]
    [MinLength(8, ErrorMessage = "Password must be at least 8 characters")]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).+$",
        ErrorMessage = "Password must include upper, lower, number, and special character.")]
    public string Password { get; set; } = null!;

    [Required(ErrorMessage = "Username is required")]
    [RegularExpression(@"^[a-zA-Z0-9_]+$", ErrorMessage = "In Username only letters, numbers, and underscores allowed")]
    [MinLength(3, ErrorMessage = "Username must be at least 3 characters")]
    [MaxLength(50, ErrorMessage = "Username must be at most 50 characters")]
    public string Username { get; set; } = null!;

    [Required(ErrorMessage = "Full name is required")]
    [RegularExpression(@"^[a-zA-Z]+(?: [a-zA-Z]+)*$", ErrorMessage = "In Full name only letters and single spaces allowed")]
    [MinLength(3, ErrorMessage = "Full name must be at least 3 characters")]
    [MaxLength(80, ErrorMessage = "Full name must be at most 80 characters")]
    public string FullName { get; set; } = null!;

    [Length(2, 2, ErrorMessage = "Country code length must be 2 characters")]
    public string? Country { get; set; } = null!;
}