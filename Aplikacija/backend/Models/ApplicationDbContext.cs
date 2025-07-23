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

        modelBuilder.Entity<LessonReview>()
            .HasKey(lr => new { lr.UserId, lr.LessonId });

        modelBuilder.Entity<ChallengeReview>()
            .HasKey(cr => new { cr.UserId, cr.ChallengeId });
    }
}