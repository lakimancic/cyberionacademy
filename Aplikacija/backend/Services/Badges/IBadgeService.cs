namespace backend.Services.Badges;

public interface IBadgeService
{
    Task CheckBadgeChallenge(Challenge challenge, User user);
    Task CheckBadgeQuiz(QuizResult quizResult, User user);
}