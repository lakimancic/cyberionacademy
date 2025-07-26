namespace backend.DTOs;

public class ChallengeDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public string CategoryName { get; set; }
    public bool IsArchived { get; set; }
    public bool IsPublic { get; set; }
    public int Points { get; set; }
    public string AutorName { get; set; }
    public DateTime CreatedAt { get; set; }
    public string AvatarUrl { get; set; }
}