using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class ManyToManyFix : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Challenges_Courses_CourseId",
                table: "Challenges");

            migrationBuilder.DropForeignKey(
                name: "FK_Lessons_Courses_CourseId",
                table: "Lessons");

            migrationBuilder.DropForeignKey(
                name: "FK_Tags_Challenges_ChallengeId",
                table: "Tags");

            migrationBuilder.DropForeignKey(
                name: "FK_Tags_Courses_CourseId",
                table: "Tags");

            migrationBuilder.DropForeignKey(
                name: "FK_Tags_Lessons_LessonId",
                table: "Tags");

            migrationBuilder.DropIndex(
                name: "IX_Tags_ChallengeId",
                table: "Tags");

            migrationBuilder.DropIndex(
                name: "IX_Tags_CourseId",
                table: "Tags");

            migrationBuilder.DropIndex(
                name: "IX_Tags_LessonId",
                table: "Tags");

            migrationBuilder.DropIndex(
                name: "IX_Lessons_CourseId",
                table: "Lessons");

            migrationBuilder.DropIndex(
                name: "IX_Challenges_CourseId",
                table: "Challenges");

            migrationBuilder.DropColumn(
                name: "ChallengeId",
                table: "Tags");

            migrationBuilder.DropColumn(
                name: "CourseId",
                table: "Tags");

            migrationBuilder.DropColumn(
                name: "LessonId",
                table: "Tags");

            migrationBuilder.DropColumn(
                name: "AuthorId",
                table: "Message");

            migrationBuilder.DropColumn(
                name: "CourseId",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "CourseId",
                table: "Challenges");

            migrationBuilder.AddColumn<int>(
                name: "ChallengeId",
                table: "Conversations",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ConversationType",
                table: "Conversations",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "LessonId",
                table: "Conversations",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CourseChallenge",
                columns: table => new
                {
                    CourseId = table.Column<int>(type: "int", nullable: false),
                    ChallengeId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CourseChallenge", x => new { x.CourseId, x.ChallengeId });
                    table.ForeignKey(
                        name: "FK_CourseChallenge_Challenges_ChallengeId",
                        column: x => x.ChallengeId,
                        principalTable: "Challenges",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CourseChallenge_Courses_CourseId",
                        column: x => x.CourseId,
                        principalTable: "Courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CourseLesson",
                columns: table => new
                {
                    CourseId = table.Column<int>(type: "int", nullable: false),
                    LessonId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CourseLesson", x => new { x.CourseId, x.LessonId });
                    table.ForeignKey(
                        name: "FK_CourseLesson_Courses_CourseId",
                        column: x => x.CourseId,
                        principalTable: "Courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CourseLesson_Lessons_LessonId",
                        column: x => x.LessonId,
                        principalTable: "Lessons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TagChallenge",
                columns: table => new
                {
                    TagId = table.Column<int>(type: "int", nullable: false),
                    ChallengeId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TagChallenge", x => new { x.TagId, x.ChallengeId });
                    table.ForeignKey(
                        name: "FK_TagChallenge_Challenges_ChallengeId",
                        column: x => x.ChallengeId,
                        principalTable: "Challenges",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TagChallenge_Tags_TagId",
                        column: x => x.TagId,
                        principalTable: "Tags",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TagCourse",
                columns: table => new
                {
                    TagId = table.Column<int>(type: "int", nullable: false),
                    CourseId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TagCourse", x => new { x.TagId, x.CourseId });
                    table.ForeignKey(
                        name: "FK_TagCourse_Courses_CourseId",
                        column: x => x.CourseId,
                        principalTable: "Courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TagCourse_Tags_TagId",
                        column: x => x.TagId,
                        principalTable: "Tags",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TagLesson",
                columns: table => new
                {
                    TagId = table.Column<int>(type: "int", nullable: false),
                    LessonId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TagLesson", x => new { x.TagId, x.LessonId });
                    table.ForeignKey(
                        name: "FK_TagLesson_Lessons_LessonId",
                        column: x => x.LessonId,
                        principalTable: "Lessons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TagLesson_Tags_TagId",
                        column: x => x.TagId,
                        principalTable: "Tags",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_ChallengeId",
                table: "Conversations",
                column: "ChallengeId");

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_LessonId",
                table: "Conversations",
                column: "LessonId");

            migrationBuilder.CreateIndex(
                name: "IX_CourseChallenge_ChallengeId",
                table: "CourseChallenge",
                column: "ChallengeId");

            migrationBuilder.CreateIndex(
                name: "IX_CourseLesson_LessonId",
                table: "CourseLesson",
                column: "LessonId");

            migrationBuilder.CreateIndex(
                name: "IX_TagChallenge_ChallengeId",
                table: "TagChallenge",
                column: "ChallengeId");

            migrationBuilder.CreateIndex(
                name: "IX_TagCourse_CourseId",
                table: "TagCourse",
                column: "CourseId");

            migrationBuilder.CreateIndex(
                name: "IX_TagLesson_LessonId",
                table: "TagLesson",
                column: "LessonId");

            migrationBuilder.AddForeignKey(
                name: "FK_Conversations_Challenges_ChallengeId",
                table: "Conversations",
                column: "ChallengeId",
                principalTable: "Challenges",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Conversations_Lessons_LessonId",
                table: "Conversations",
                column: "LessonId",
                principalTable: "Lessons",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Conversations_Challenges_ChallengeId",
                table: "Conversations");

            migrationBuilder.DropForeignKey(
                name: "FK_Conversations_Lessons_LessonId",
                table: "Conversations");

            migrationBuilder.DropTable(
                name: "CourseChallenge");

            migrationBuilder.DropTable(
                name: "CourseLesson");

            migrationBuilder.DropTable(
                name: "TagChallenge");

            migrationBuilder.DropTable(
                name: "TagCourse");

            migrationBuilder.DropTable(
                name: "TagLesson");

            migrationBuilder.DropIndex(
                name: "IX_Conversations_ChallengeId",
                table: "Conversations");

            migrationBuilder.DropIndex(
                name: "IX_Conversations_LessonId",
                table: "Conversations");

            migrationBuilder.DropColumn(
                name: "ChallengeId",
                table: "Conversations");

            migrationBuilder.DropColumn(
                name: "ConversationType",
                table: "Conversations");

            migrationBuilder.DropColumn(
                name: "LessonId",
                table: "Conversations");

            migrationBuilder.AddColumn<int>(
                name: "ChallengeId",
                table: "Tags",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CourseId",
                table: "Tags",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "LessonId",
                table: "Tags",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "AuthorId",
                table: "Message",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CourseId",
                table: "Lessons",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CourseId",
                table: "Challenges",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tags_ChallengeId",
                table: "Tags",
                column: "ChallengeId");

            migrationBuilder.CreateIndex(
                name: "IX_Tags_CourseId",
                table: "Tags",
                column: "CourseId");

            migrationBuilder.CreateIndex(
                name: "IX_Tags_LessonId",
                table: "Tags",
                column: "LessonId");

            migrationBuilder.CreateIndex(
                name: "IX_Lessons_CourseId",
                table: "Lessons",
                column: "CourseId");

            migrationBuilder.CreateIndex(
                name: "IX_Challenges_CourseId",
                table: "Challenges",
                column: "CourseId");

            migrationBuilder.AddForeignKey(
                name: "FK_Challenges_Courses_CourseId",
                table: "Challenges",
                column: "CourseId",
                principalTable: "Courses",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Lessons_Courses_CourseId",
                table: "Lessons",
                column: "CourseId",
                principalTable: "Courses",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Tags_Challenges_ChallengeId",
                table: "Tags",
                column: "ChallengeId",
                principalTable: "Challenges",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Tags_Courses_CourseId",
                table: "Tags",
                column: "CourseId",
                principalTable: "Courses",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Tags_Lessons_LessonId",
                table: "Tags",
                column: "LessonId",
                principalTable: "Lessons",
                principalColumn: "Id");
        }
    }
}
