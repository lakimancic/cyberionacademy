namespace backend.Models;

public class ApplicationDbContext : DbContext
{
    public DbSet<User> Users { get; set; }
    public DbSet<Lesson> Lessons { get; set; }
    public DbSet<Challenge> Challenges { get; set; }
    public DbSet<Course> Courses { get; set; }
    public DbSet<Conversation> Conversations { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Tag> Tags { get; set; }
    public DbSet<RoleRequest> RoleRequests { get; set; }
    public DbSet<ChallengeSubmission> ChallengeSubmissions { get; set; }
    public DbSet<QuizResult> QuizResults { get; set; }
    public DbSet<Badge> Badges { get; set; }
    public DbSet<Message> Messages { get; set; }
    public DbSet<ChallengeReview> ChallengeReviews { get; set; }
    public DbSet<LessonReview> LessonReviews { get; set; }

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
    }
}