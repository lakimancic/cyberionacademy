using System.Diagnostics;
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
                    quiz.Questions?.Add(CreateSingleAnswerQuestion(question));
                    break;

                case QuestionType.MultiAnswer:
                    quiz.Questions?.Add(CreateMultiAnswerQuestion(question));
                    break;

                case QuestionType.Connect:
                    quiz.Questions?.Add(CreateConnectQuestion(question));
                    break;

                case QuestionType.Text:
                    quiz.Questions?.Add(CreateTextQuestion(question));
                    break;
            }
        }
        quiz.TotalPoints = totalPoints;
    }

    public SingleAnswerQuestion CreateSingleAnswerQuestion(CreateQuestionDto question)
    {
        var obj = new SingleAnswerQuestion
        {
            Text = question.Text,
            Points = question.Points,
            Options = []
        };

        if (question.Answers == null || question.Answers.Count < 2)
            throw new Exception("Single Answer questions need at least 2 answers");
        if (question.Answers.Count(qa => qa.IsCorrect) > 1)
            throw new Exception("Single Answer question must have only 1 correct answer");
        if (question.Answers.Count > 8)
            throw new Exception("Single Answer question have 8 options at maximum");

        foreach (var answer in question.Answers)
            obj.Options.Add(new AnswerOption
            {
                Text = answer.Text,
                IsCorrect = answer.IsCorrect,
                Question = obj,
            });
        return obj;
    }

    public MultiAnswerQuestion CreateMultiAnswerQuestion(CreateQuestionDto question)
    {
        var obj = new MultiAnswerQuestion
        {
            Text = question.Text,
            Points = question.Points,
            Options = []
        };

        if (question.Answers == null || question.Answers.Count < 2)
            throw new Exception("Multi-Answer questions need at least 2 answers");
        if (!question.Answers.Any(qa => qa.IsCorrect))
            throw new Exception("Multi-Answer question must have at least 1 correct answer");
        if (question.Answers.Count > 8)
            throw new Exception("Multi-Answer question have 8 options at maximum");

        foreach (var answer in question.Answers)
            obj.Options?.Add(new AnswerOption
            {
                Text = answer.Text,
                IsCorrect = answer.IsCorrect,
                Question = obj
            });
        return obj;
    }

    public ConnectQuestion CreateConnectQuestion(CreateQuestionDto question)
    {
        var obj = new ConnectQuestion
        {
            Text = question.Text,
            Points = question.Points,
            Pairs = []
        };

        if (question.Pairs == null || question.Pairs.Count < 2)
            throw new Exception("Connect questions need at least 2 pairs");
        if (question.Pairs.Count > 8)
            throw new Exception("Connect question have 8 pairs at maximum");

        foreach (var pair in question.Pairs)
            obj.Pairs?.Add(new ConnectPair
            {
                Left = pair.Left,
                Right = pair.Right,
                Question = obj
            });
        return obj;
    }

    public TextQuestion CreateTextQuestion(CreateQuestionDto question)
    {
        var obj = new TextQuestion
        {
            Text = question.Text,
            Points = question.Points,
            Options = []
        };

        if (question.Answers == null || question.Answers.Count != 1)
            throw new Exception("Text questions must have an answer");

        obj.Options?.Add(new AnswerOption
        {
            Text = question.Answers[0].Text,
            IsCorrect = true,
            Question = obj
        });
        return obj;
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
                UpdateSingleAnswerQuestion((SingleAnswerQuestion)question, request);
                break;

            case QuestionType.MultiAnswer:
                UpdateMultiAnswerQuestion((MultiAnswerQuestion)question, request);
                break;

            case QuestionType.Connect:
                UpdateConnectQuestion((ConnectQuestion)question, request);
                break;

            case QuestionType.Text:
                UpdateTextQuestion((TextQuestion)question, request);
                break;
        }
    }

    public void UpdateSingleAnswerQuestion(SingleAnswerQuestion question, CreateQuestionDto request)
    {
        if (request.Answers == null || request.Answers.Count < 2)
            throw new Exception("Single Answer questions need at least 2 answers");
        if (request.Answers.Count(qa => qa.IsCorrect) > 1)
            throw new Exception("Single Answer question must have only 1 correct answer");

        var forUpdate1 = request.Answers.Where(a => a.Id.HasValue);
        var forCreate1 = request.Answers.Where(a => !a.Id.HasValue);

        var incomindIds1 = forUpdate1.Select(a => a.Id!.Value);
        var forDelete1 = question.Options!.Where(ao => !incomindIds1.Contains(ao.Id));

        context.AnswerOptions.RemoveRange(forDelete1);
        foreach (var answer in forCreate1)
            question.Options!.Add(new AnswerOption
            {
                Text = answer.Text,
                IsCorrect = answer.IsCorrect,
                Question = question
            });

        if (question.Options!.Count > 8)
            throw new Exception("Single Answer question have 8 options at maximum");

        foreach (var answer in forUpdate1)
        {
            AnswerOption? answer1 = question.Options!.FirstOrDefault(ao => ao.Id == answer.Id)
                ?? throw new Exception("Answer for update not found");
            if (answer1.IsCorrect != answer.IsCorrect)
                answer1.IsCorrect = answer.IsCorrect;
            if (answer1.Text != answer.Text)
                answer1.Text = answer.Text;
        }
    }

    public void UpdateMultiAnswerQuestion(MultiAnswerQuestion question, CreateQuestionDto request)
    {
        if (request.Answers == null || request.Answers.Count < 2)
            throw new Exception("Multi-Answer questions need at least 2 answers");
        if (!request.Answers.Any(qa => qa.IsCorrect))
            throw new Exception("Multi-Answer question must have at least 1 correct answer");

        var forUpdate2 = request.Answers.Where(a => a.Id.HasValue);
        var forCreate2 = request.Answers.Where(a => !a.Id.HasValue);

        var incomindIds2 = forUpdate2.Select(a => a.Id!.Value);
        var forDelete2 = question.Options!.Where(ao => !incomindIds2.Contains(ao.Id));

        context.AnswerOptions.RemoveRange(forDelete2);
        foreach (var answer in forCreate2)
            question.Options!.Add(new AnswerOption
            {
                Text = answer.Text,
                IsCorrect = answer.IsCorrect,
                Question = question
            });

        if (question.Options!.Count > 8)
            throw new Exception("Multi-Answer question have 8 options at maximum");

        foreach (var answer in forUpdate2)
        {
            AnswerOption? answer1 = question.Options!.FirstOrDefault(ao => ao.Id == answer.Id)
                ?? throw new Exception("Answer for update not found");
            if (answer1.IsCorrect != answer.IsCorrect)
                answer1.IsCorrect = answer.IsCorrect;
            if (answer1.Text != answer.Text)
                answer1.Text = answer.Text;
        }
    }

    public void UpdateConnectQuestion(ConnectQuestion question, CreateQuestionDto request)
    {
        if (request.Pairs == null || request.Pairs.Count < 2)
            throw new Exception("Connect questions need at least 2 pairs");

        var forUpdate3 = request.Pairs.Where(a => a.Id.HasValue);
        var forCreate3 = request.Pairs.Where(a => !a.Id.HasValue);

        var incomindIds3 = forUpdate3.Select(a => a.Id!.Value);
        var forDelete3 = question.Pairs!.Where(ao => !incomindIds3.Contains(ao.Id));

        context.ConnectPairs.RemoveRange(forDelete3);
        foreach (var answer in forCreate3)
            question.Pairs!.Add(new ConnectPair
            {
                Left = answer.Left,
                Right = answer.Right,
                Question = question
            });

        if (question.Pairs!.Count > 8)
            throw new Exception("Connect question have 8 pairs at maximum");

        foreach (var answer in forUpdate3)
        {
            ConnectPair? answer1 = question.Pairs!.FirstOrDefault(ao => ao.Id == answer.Id)
                ?? throw new Exception("Connect Pair for update not found");
            if (answer1.Left != answer.Left)
                answer1.Left = answer.Left;
            if (answer1.Right != answer.Right)
                answer1.Right = answer.Right;
        }
    }

    public void UpdateTextQuestion(TextQuestion question, CreateQuestionDto request)
    {
        if (request.Answers == null || request.Answers.Count != 1)
            throw new Exception("Text questions must have an answer");

        AnswerOption answer2 = question.Options![0];
        AnswerOptionDto answerDto = request.Answers[0];

        if (answer2.Text != answerDto.Text)
            answer2.Text = answerDto.Text;
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

    public int CheckQuiz(Quiz quiz, SubmitQuizDto request)
    {
        return quiz.Questions!
            .Join(
                request.Questions.DistinctBy(q => q.Id),
                q1 => q1.Id,
                q2 => q2.Id,
                CheckQuestion
            )
            .Sum();
    }

    public int CheckQuestion(Question question, SubmitQuestionDto request)
    {
        return question.Type switch
        {
            QuestionType.SingleAnswer => CheckSingleAnswerQuestion((SingleAnswerQuestion)question, request),
            QuestionType.MultiAnswer => CheckMultiAnswerQuestion((MultiAnswerQuestion)question, request),
            QuestionType.Connect => CheckConnectPairQuestion((ConnectQuestion)question, request),
            QuestionType.Text => CheckTextAnswerQuestion((TextQuestion)question, request),
            _ => 0,
        };
    }

    public int CheckSingleAnswerQuestion(SingleAnswerQuestion question, SubmitQuestionDto request)
    {
        return question.Options!
            .Join(
                (request.Answers ?? []).DistinctBy(a => a.Id),
                a1 => a1.Id,
                a2 => a2.Id,
                (a1, a2) => a1.IsCorrect == a2.IsCorrect
            )
            .All(a => a) ? question.Points : 0;
    }

    public int CheckMultiAnswerQuestion(MultiAnswerQuestion question, SubmitQuestionDto request)
    {
        var count = question.Options!
            .Join(
                (request.Answers ?? []).DistinctBy(a => a.Id),
                a1 => a1.Id,
                a2 => a2.Id,
                (a1, a2) => a1.IsCorrect == a2.IsCorrect
            )
            .Count(a => a);
        var fullCount = question.Options!.Count;
        if (count == fullCount)
            return question.Points;
        return count >= fullCount / 2 ? (question.Points / 2) : 0;
    }

    public int CheckConnectPairQuestion(ConnectQuestion question, SubmitQuestionDto request)
    {
        var count = question.Pairs!
            .Join(
                (request.Pairs ?? []).DistinctBy(a => a.Id),
                a1 => a1.Id,
                a2 => a2.Id,
                (a1, a2) => a1.Left == a2.Left && a1.Right == a2.Right
            )
            .Count(a => a);
        var fullCount = question.Options!.Count;
        if (count == fullCount)
            return question.Points;
        return count >= fullCount / 2 ? (question.Points / 2) : 0;
    }

    public int CheckTextAnswerQuestion(TextQuestion question, SubmitQuestionDto request)
    {
        return question.Options![0].Text == request.Answer ? question.Points : 0;
    }
}