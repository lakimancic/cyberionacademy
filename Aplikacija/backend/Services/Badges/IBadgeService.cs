namespace backend.Services.Badges;

public interface IBadgeService
{
    void CheckBadgeChallenge(Challenge challenge, User user);
    void CheckBadgeLesson(Lesson lesson, User user);
}