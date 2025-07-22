namespace backend.Models;

public enum UserRole
{
    Admin,
    Moderator,
    Helper,
    User
}

public class User
{
    [Key]
    public int Id { get; set; }
    public required string Email { get; set; }
    public required string Password { get; set; }
    public required string Username { get; set; }
    public required string FullName { get; set; }
    public string? Country { get; set; }
    public string? Avatar { get; set; }
    public string? Description { get; set; }
    public UserRole Role { get; set; } = UserRole.User;

    public List<ChallengeSubmission> Submissions { get; set; } = [];
    public List<Challenge> Challenges { get; set; } = [];
    public List<Lesson> Lessons { get; set; } = [];
}