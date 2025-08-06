using backend.DTOs.Lessons;

namespace backend.Services.QuizService;

public interface IQuizService
{
    void CreateQuiz(CreateQuizDto request, Lesson lesson);
    void UpdateQuiz(Quiz quiz, CreateQuizDto request);
    Task DeleteQuiz(int quizId);
}