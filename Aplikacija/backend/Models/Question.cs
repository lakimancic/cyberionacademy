namespace backend.Models;

public enum QuestionType
{
    SingleAnswer,
    MultiAnswer,
    Connect,
    Text,
}

public abstract class Question
{
    [Key]
    public int Id { get; set; }
    public required string Text { get; set; }
    public int Points { get; set; }

    public QuestionType Type { get; set; }

    public List<AnswerOption>? Options { get; set; }
}

public class SingleAnswerQuestion : Question { }
public class MultiAnswerQuestion : Question { }

public class ConnectQuestion : Question
{
    public List<AnswerOption>? Pairs { get; set; }
}

public class TextQuestion : Question { }