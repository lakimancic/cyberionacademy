namespace backend.Models;

public enum UserRole
{
    Admin,
    Moderator,
    Helper,
    User
}

[Index(nameof(Email), IsUnique = true), Index(nameof(Username), IsUnique = true)]
public class User
{
    [Key]
    public int Id { get; set; }
    [MaxLength(50)]
    public required string Email { get; set; }
    [MaxLength(100)]
    public required string PasswordHash { get; set; }
    [MaxLength(50)]
    public required string Username { get; set; }
    [MaxLength(80)]
    public required string FullName { get; set; }
    [MaxLength(3)]
    public string? Country { get; set; }
    [MaxLength(50)]
    public string? Avatar { get; set; }
    [MaxLength(200)]
    public string? Bio { get; set; }
    public UserRole Role { get; set; } = UserRole.User;

    public List<ChallengeSubmission>? Submissions { get; set; }
    public List<Challenge>? Challenges { get; set; }
    public List<Lesson>? Lessons { get; set; }
    public List<Course>? Courses { get; set; }
    public List<Badge>? Badges { get; set; }
    public List<QuizResult>? QuizResults { get; set; }
    public List<Conversation>? Conversations { get; set; }
}