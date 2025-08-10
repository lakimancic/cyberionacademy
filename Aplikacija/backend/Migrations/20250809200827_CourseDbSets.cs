using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class CourseDbSets : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CourseChallenge_Challenges_ChallengeId",
                table: "CourseChallenge");

            migrationBuilder.DropForeignKey(
                name: "FK_CourseChallenge_Courses_CourseId",
                table: "CourseChallenge");

            migrationBuilder.DropForeignKey(
                name: "FK_CourseLesson_Courses_CourseId",
                table: "CourseLesson");

            migrationBuilder.DropForeignKey(
                name: "FK_CourseLesson_Lessons_LessonId",
                table: "CourseLesson");

            migrationBuilder.DropPrimaryKey(
                name: "PK_CourseLesson",
                table: "CourseLesson");

            migrationBuilder.DropPrimaryKey(
                name: "PK_CourseChallenge",
                table: "CourseChallenge");

            migrationBuilder.RenameTable(
                name: "CourseLesson",
                newName: "CourseLessons");

            migrationBuilder.RenameTable(
                name: "CourseChallenge",
                newName: "CourseChallenges");

            migrationBuilder.RenameIndex(
                name: "IX_CourseLesson_LessonId",
                table: "CourseLessons",
                newName: "IX_CourseLessons_LessonId");

            migrationBuilder.RenameIndex(
                name: "IX_CourseChallenge_ChallengeId",
                table: "CourseChallenges",
                newName: "IX_CourseChallenges_ChallengeId");

            migrationBuilder.AlterColumn<string>(
                name: "Banner",
                table: "Courses",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20,
                oldNullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_CourseLessons",
                table: "CourseLessons",
                columns: new[] { "CourseId", "LessonId" });

            migrationBuilder.AddPrimaryKey(
                name: "PK_CourseChallenges",
                table: "CourseChallenges",
                columns: new[] { "CourseId", "ChallengeId" });

            migrationBuilder.AddForeignKey(
                name: "FK_CourseChallenges_Challenges_ChallengeId",
                table: "CourseChallenges",
                column: "ChallengeId",
                principalTable: "Challenges",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_CourseChallenges_Courses_CourseId",
                table: "CourseChallenges",
                column: "CourseId",
                principalTable: "Courses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_CourseLessons_Courses_CourseId",
                table: "CourseLessons",
                column: "CourseId",
                principalTable: "Courses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_CourseLessons_Lessons_LessonId",
                table: "CourseLessons",
                column: "LessonId",
                principalTable: "Lessons",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CourseChallenges_Challenges_ChallengeId",
                table: "CourseChallenges");

            migrationBuilder.DropForeignKey(
                name: "FK_CourseChallenges_Courses_CourseId",
                table: "CourseChallenges");

            migrationBuilder.DropForeignKey(
                name: "FK_CourseLessons_Courses_CourseId",
                table: "CourseLessons");

            migrationBuilder.DropForeignKey(
                name: "FK_CourseLessons_Lessons_LessonId",
                table: "CourseLessons");

            migrationBuilder.DropPrimaryKey(
                name: "PK_CourseLessons",
                table: "CourseLessons");

            migrationBuilder.DropPrimaryKey(
                name: "PK_CourseChallenges",
                table: "CourseChallenges");

            migrationBuilder.RenameTable(
                name: "CourseLessons",
                newName: "CourseLesson");

            migrationBuilder.RenameTable(
                name: "CourseChallenges",
                newName: "CourseChallenge");

            migrationBuilder.RenameIndex(
                name: "IX_CourseLessons_LessonId",
                table: "CourseLesson",
                newName: "IX_CourseLesson_LessonId");

            migrationBuilder.RenameIndex(
                name: "IX_CourseChallenges_ChallengeId",
                table: "CourseChallenge",
                newName: "IX_CourseChallenge_ChallengeId");

            migrationBuilder.AlterColumn<string>(
                name: "Banner",
                table: "Courses",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_CourseLesson",
                table: "CourseLesson",
                columns: new[] { "CourseId", "LessonId" });

            migrationBuilder.AddPrimaryKey(
                name: "PK_CourseChallenge",
                table: "CourseChallenge",
                columns: new[] { "CourseId", "ChallengeId" });

            migrationBuilder.AddForeignKey(
                name: "FK_CourseChallenge_Challenges_ChallengeId",
                table: "CourseChallenge",
                column: "ChallengeId",
                principalTable: "Challenges",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_CourseChallenge_Courses_CourseId",
                table: "CourseChallenge",
                column: "CourseId",
                principalTable: "Courses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_CourseLesson_Courses_CourseId",
                table: "CourseLesson",
                column: "CourseId",
                principalTable: "Courses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_CourseLesson_Lessons_LessonId",
                table: "CourseLesson",
                column: "LessonId",
                principalTable: "Lessons",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
