using System.Threading.Tasks;
using backend.DTOs.Lessons;

namespace backend.Services.QuizService;

public class QuizService(ApplicationDbContext context) : IQuizService
{
    public void CreateQuiz(CreateQuizDto request, Lesson lesson)
    {
        lesson.Quiz = new()
        {
            TimeMinutes = request.TimeMinutes,
            QuestionCount = request.QuestionCount,
            Lesson = lesson,
            Questions = []
        };

        CreateQuestions(lesson.Quiz, request.Questions);
    }

    public void UpdateQuiz(Quiz quiz, CreateQuizDto request)
    {
        if (quiz.QuestionCount != request.QuestionCount)
            quiz.QuestionCount = request.QuestionCount;
        if (quiz.TimeMinutes != request.TimeMinutes)
            quiz.TimeMinutes = request.TimeMinutes;

        var forUpdate = request.Questions.Where(q => q.Id.HasValue);
        var forCreate = request.Questions.Where(q => !q.Id.HasValue);

        var incomindIds = forUpdate.Select(q => q.Id!.Value);
        var forDelete = quiz.Questions?.Where(q => !incomindIds.Contains(q.Id));

        context.Questions.RemoveRange(forDelete ?? []);
        CreateQuestions(quiz, forCreate);

        foreach (var question in forUpdate)
        {
            Question? question1 = quiz.Questions!.FirstOrDefault(q => q.Id == question.Id)
                ?? throw new Exception("Question for update not found");
            UpdateQuestion(question1, question);
            quiz.TotalPoints += question.Points;
        }
    }

    public void CreateQuestions(Quiz quiz, IEnumerable<CreateQuestionDto> questions)
    {
        int totalPoints = 0;
        foreach (var question in questions)
        {
            totalPoints += question.Points;
            switch (question.Type)
            {
                case QuestionType.SingleAnswer:
                    var qobj1 = new SingleAnswerQuestion
                    {
                        Text = question.Text,
                        Points = question.Points,
                        Options = []
                    };

                    if (question.Answers == null || question.Answers.Count < 2)
                        throw new Exception("Single Answer questions need at least 2 answers");
                    if (question.Answers.Count(qa => qa.IsCorrect) > 1)
                        throw new Exception("Single Answer question must have only 1 correct answer");

                    foreach (var answer in question.Answers)
                        qobj1.Options.Add(new AnswerOption
                        {
                            Text = answer.Text,
                            IsCorrect = answer.IsCorrect,
                            Question = qobj1,
                        });

                    quiz.Questions?.Add(qobj1);
                    break;

                case QuestionType.MultiAnswer:
                    var qobj2 = new MultiAnswerQuestion
                    {
                        Text = question.Text,
                        Points = question.Points,
                        Options = []
                    };

                    if (question.Answers == null || question.Answers.Count < 2)
                        throw new Exception("Multi-Answer questions need at least 2 answers");
                    if (!question.Answers.Any(qa => qa.IsCorrect))
                        throw new Exception("Multi-Answer question must have at least 1 correct answer");

                    foreach (var answer in question.Answers)
                        qobj2.Options?.Add(new AnswerOption
                        {
                            Text = answer.Text,
                            IsCorrect = answer.IsCorrect,
                            Question = qobj2
                        });

                    quiz.Questions?.Add(qobj2);
                    break;

                case QuestionType.Connect:
                    var qobj3 = new ConnectQuestion
                    {
                        Text = question.Text,
                        Points = question.Points,
                        Pairs = []
                    };

                    if (question.Pairs == null || question.Pairs.Count < 2)
                        throw new Exception("Connect questions need at least 2 pairs");

                    foreach (var pair in question.Pairs)
                        qobj3.Pairs?.Add(new ConnectPair
                        {
                            Left = pair.Left,
                            Right = pair.Right,
                            Question = qobj3
                        });

                    quiz.Questions?.Add(qobj3);
                    break;

                case QuestionType.Text:
                    var qobj4 = new TextQuestion
                    {
                        Text = question.Text,
                        Points = question.Points,
                        Options = []
                    };

                    if (question.Answers == null || question.Answers.Count != 1)
                        throw new Exception("Text questions must have an answer");

                    qobj4.Options?.Add(new AnswerOption
                    {
                        Text = question.Answers[0].Text,
                        IsCorrect = true,
                        Question = qobj4
                    });

                    quiz.Questions?.Add(qobj4);
                    break;
            }
        }
        quiz.TotalPoints = totalPoints;
    }

    public void UpdateQuestion(Question? question, CreateQuestionDto request)
    {
        if (question == null)
            throw new Exception("Question not found");

        if (question.Type != request.Type)
            throw new Exception("Question Type cannot be changed");

        if (question.Text != request.Text)
            question.Text = request.Text;
        if (question.Points != request.Points)
            question.Points = request.Points;

        switch (question.Type)
            {
                case QuestionType.SingleAnswer:
                    if (request.Answers == null || request.Answers.Count < 2)
                        throw new Exception("Single Answer questions need at least 2 answers");
                    if (request.Answers.Count(qa => qa.IsCorrect) > 1)
                        throw new Exception("Single Answer question must have only 1 correct answer");

                    SingleAnswerQuestion saq = (question as SingleAnswerQuestion)!;
                    var forUpdate1 = request.Answers.Where(a => a.Id.HasValue);
                    var forCreate1 = request.Answers.Where(a => !a.Id.HasValue);

                    var incomindIds1 = forUpdate1.Select(a => a.Id!.Value);
                    var forDelete1 = saq.Options!.Where(ao => !incomindIds1.Contains(ao.Id));

                    context.AnswerOptions.RemoveRange(forDelete1);
                    foreach (var answer in forCreate1)
                        saq.Options!.Add(new AnswerOption
                        {
                            Text = answer.Text,
                            IsCorrect = answer.IsCorrect,
                            Question = saq
                        });

                    foreach (var answer in forUpdate1)
                    {
                        AnswerOption? answer1 = saq.Options!.FirstOrDefault(ao => ao.Id == answer.Id)
                            ?? throw new Exception("Answer for update not found");
                        if (answer1.IsCorrect != answer.IsCorrect)
                            answer1.IsCorrect = answer.IsCorrect;
                        if (answer1.Text != answer.Text)
                            answer1.Text = answer.Text;
                    }
                    break;

                case QuestionType.MultiAnswer:
                    if (request.Answers == null || request.Answers.Count < 2)
                        throw new Exception("Multi-Answer questions need at least 2 answers");
                    if (!request.Answers.Any(qa => qa.IsCorrect))
                        throw new Exception("Multi-Answer question must have at least 1 correct answer");

                    MultiAnswerQuestion maq = (question as MultiAnswerQuestion)!;
                    var forUpdate2 = request.Answers.Where(a => a.Id.HasValue);
                    var forCreate2 = request.Answers.Where(a => !a.Id.HasValue);

                    var incomindIds2 = forUpdate2.Select(a => a.Id!.Value);
                    var forDelete2 = maq.Options!.Where(ao => !incomindIds2.Contains(ao.Id));

                    context.AnswerOptions.RemoveRange(forDelete2);
                    foreach (var answer in forCreate2)
                        maq.Options!.Add(new AnswerOption
                        {
                            Text = answer.Text,
                            IsCorrect = answer.IsCorrect,
                            Question = maq
                        });

                    foreach (var answer in forUpdate2)
                    {
                        AnswerOption? answer1 = maq.Options!.FirstOrDefault(ao => ao.Id == answer.Id)
                            ?? throw new Exception("Answer for update not found");
                        if (answer1.IsCorrect != answer.IsCorrect)
                            answer1.IsCorrect = answer.IsCorrect;
                        if (answer1.Text != answer.Text)
                            answer1.Text = answer.Text;
                    }
                    break;

                case QuestionType.Connect:
                    if (request.Pairs == null || request.Pairs.Count < 2)
                        throw new Exception("Connect questions need at least 2 pairs");

                    ConnectQuestion cq = (question as ConnectQuestion)!;
                    var forUpdate3 = request.Pairs.Where(a => a.Id.HasValue);
                    var forCreate3 = request.Pairs.Where(a => !a.Id.HasValue);

                    var incomindIds3 = forUpdate3.Select(a => a.Id!.Value);
                    var forDelete3 = cq.Pairs!.Where(ao => !incomindIds3.Contains(ao.Id));

                    context.ConnectPairs.RemoveRange(forDelete3);
                    foreach (var answer in forCreate3)
                        cq.Pairs!.Add(new ConnectPair
                        {
                            Left = answer.Left,
                            Right = answer.Right,
                            Question = cq
                        });

                    foreach (var answer in forUpdate3)
                    {
                        ConnectPair? answer1 = cq.Pairs!.FirstOrDefault(ao => ao.Id == answer.Id)
                            ?? throw new Exception("Connect Pair for update not found");
                        if (answer1.Left != answer.Left)
                            answer1.Left = answer.Left;
                        if (answer1.Right != answer.Right)
                            answer1.Right = answer.Right;
                    }
                    break;

                case QuestionType.Text:
                    if (request.Answers == null || request.Answers.Count != 1)
                        throw new Exception("Text questions must have an answer");

                    TextQuestion tq = (question as TextQuestion)!;
                    AnswerOption answer2 = tq.Options![0];
                    AnswerOptionDto answerDto = request.Answers[0];

                    if (answer2.Text != answerDto.Text)
                        answer2.Text = answerDto.Text;
                    break;

            }
    }

    public async Task DeleteQuiz(int quizId)
    {
        Quiz? quiz = await context.Quizzes
            .Where(qz => qz.Id == quizId)
            .Include(qz => qz.Questions!)
            .FirstOrDefaultAsync() ?? throw new Exception("Quiz not found");

        foreach (var question in quiz.Questions!)
            context.Questions.Remove(question);

        context.Quizzes.Remove(quiz);
    }
}