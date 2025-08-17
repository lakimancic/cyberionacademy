namespace backend.Models;

public class ApplicationDbContext : DbContext
{
    public DbSet<User> Users { get; set; }
    public DbSet<Lesson> Lessons { get; set; }
    public DbSet<Challenge> Challenges { get; set; }
    public DbSet<Course> Courses { get; set; }
    public DbSet<Conversation> Conversations { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<RoleRequest> RoleRequests { get; set; }
    public DbSet<ChallengeSubmission> ChallengeSubmissions { get; set; }
    public DbSet<QuizResult> QuizResults { get; set; }
    public DbSet<Badge> Badges { get; set; }
    public DbSet<UserBadge> UserBadges { get; set; }
    public DbSet<Message> Messages { get; set; }
    public DbSet<ChallengeReview> ChallengeReviews { get; set; }
    public DbSet<LessonReview> LessonReviews { get; set; }
    public DbSet<CourseReview> CourseReviews { get; set; }
    public DbSet<Quiz> Quizzes { get; set; }
    public DbSet<Question> Questions { get; set; }
    public DbSet<AnswerOption> AnswerOptions { get; set; }
    public DbSet<ConnectPair> ConnectPairs { get; set; }
    public DbSet<CourseChallenge> CourseChallenges { get; set; }
    public DbSet<CourseLesson> CourseLessons { get; set; }

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Question>()
            .HasDiscriminator<QuestionType>("Type")
            .HasValue<SingleAnswerQuestion>(QuestionType.SingleAnswer)
            .HasValue<MultiAnswerQuestion>(QuestionType.MultiAnswer)
            .HasValue<ConnectQuestion>(QuestionType.Connect)
            .HasValue<TextQuestion>(QuestionType.Text);

        modelBuilder.Entity<LessonReview>().UseTpcMappingStrategy();
        modelBuilder.Entity<ChallengeReview>().UseTpcMappingStrategy();
        modelBuilder.Entity<CourseReview>().UseTpcMappingStrategy();

        modelBuilder.Entity<LessonReview>()
            .HasKey(lr => new { lr.UserId, lr.LessonId });

        modelBuilder.Entity<ChallengeReview>()
            .HasKey(cr => new { cr.UserId, cr.ChallengeId });

        modelBuilder.Entity<CourseReview>()
            .HasKey(cr => new { cr.UserId, cr.CourseId });

        modelBuilder.Entity<Lesson>()
            .HasOne(l => l.Quiz)
            .WithOne(q => q.Lesson)
            .HasForeignKey<Quiz>(q => q.LessonId);

        modelBuilder.Entity<Conversation>()
            .HasDiscriminator<ConversationType>("ConversationType")
            .HasValue<LessonConversation>(ConversationType.Lesson)
            .HasValue<ChallengeConversation>(ConversationType.Challenge);

        modelBuilder.Entity<Category>().HasData(
            new Category { Id = 1, Name = "Web Exploitation", ShortForm = "web" },
            new Category { Id = 2, Name = "Reverse Engineering", ShortForm = "rev" },
            new Category { Id = 3, Name = "Binary Exploitation", ShortForm = "pwn" },
            new Category { Id = 4, Name = "Cryptography", ShortForm = "cry" },
            new Category { Id = 5, Name = "Digital Forensics", ShortForm = "for" },
            new Category { Id = 6, Name = "Miscellaneous", ShortForm = "misc" },
            new Category { Id = 7, Name = "Hardware Hacking", ShortForm = "hw" },
            new Category { Id = 8, Name = "Network Security", ShortForm = "net" },
            new Category { Id = 9, Name = "Open Source Intelligence", ShortForm = "osint" },
            new Category { Id = 10, Name = "Game Hacking", ShortForm = "game" }
        );

        modelBuilder.Entity<Badge>().HasData(
            new Badge { Id = 1, Name = "First Blood", Short = "bld1" },
            new Badge { Id = 2, Name = "First Blood x10", Short = "bld10" },
            new Badge { Id = 3, Name = "First Blood x100", Short = "bld100" },

            new Badge { Id = 4, Name = "Web Exploitation", Short = "web" },
            new Badge { Id = 5, Name = "Reverse Engineering", Short = "rev" },
            new Badge { Id = 6, Name = "Binary Exploitation", Short = "pwn" },
            new Badge { Id = 7, Name = "Cryptography", Short = "cry" },
            new Badge { Id = 8, Name = "Digital Forensics", Short = "for" },
            new Badge { Id = 9, Name = "Miscellaneous", Short = "misc" },
            new Badge { Id = 10, Name = "Hardware Hacking", Short = "hw" },
            new Badge { Id = 11, Name = "Network Security", Short = "net" },
            new Badge { Id = 12, Name = "Open Source Intelligence", Short = "osint" },
            new Badge { Id = 13, Name = "Game Hacking", Short = "game" },

            new Badge { Id = 14, Name = "Quiz Flash", Short = "flash1" },
            new Badge { Id = 15, Name = "Quiz Flash", Short = "flash10" },
            new Badge { Id = 16, Name = "Quiz Flash", Short = "flash100" },

            new Badge { Id = 17, Name = "Jack of all Trades", Short = "joat" }
        );
    }
}