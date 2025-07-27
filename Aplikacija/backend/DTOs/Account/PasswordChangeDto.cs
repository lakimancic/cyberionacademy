namespace backend.DTOs.Account;

public class PassowrdChangeDto
{
    public required string CurrentPassword { get; set; }
    [Required(ErrorMessage = "New password is required")]
    [MinLength(8, ErrorMessage = "Password must be at least 8 characters")]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).+$",
        ErrorMessage = "Password must include upper, lower, number, and special character.")]
    public required string NewPassword { get; set; }
}