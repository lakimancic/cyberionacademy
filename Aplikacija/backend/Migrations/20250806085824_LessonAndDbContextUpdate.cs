using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class LessonAndDbContextUpdate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AnswerOption_Question_QuestionId",
                table: "AnswerOption");

            migrationBuilder.DropForeignKey(
                name: "FK_ConnectPair_Question_QuestionId",
                table: "ConnectPair");

            migrationBuilder.DropForeignKey(
                name: "FK_Question_Quiz_QuizId",
                table: "Question");

            migrationBuilder.DropForeignKey(
                name: "FK_Quiz_Lessons_LessonId",
                table: "Quiz");

            migrationBuilder.DropForeignKey(
                name: "FK_QuizResults_Quiz_QuizId",
                table: "QuizResults");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Quiz",
                table: "Quiz");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Question",
                table: "Question");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ConnectPair",
                table: "ConnectPair");

            migrationBuilder.DropPrimaryKey(
                name: "PK_AnswerOption",
                table: "AnswerOption");

            migrationBuilder.DropColumn(
                name: "QuizId",
                table: "Lessons");

            migrationBuilder.RenameTable(
                name: "Quiz",
                newName: "Quizzes");

            migrationBuilder.RenameTable(
                name: "Question",
                newName: "Questions");

            migrationBuilder.RenameTable(
                name: "ConnectPair",
                newName: "ConnectPairs");

            migrationBuilder.RenameTable(
                name: "AnswerOption",
                newName: "AnswerOptions");

            migrationBuilder.RenameIndex(
                name: "IX_Quiz_LessonId",
                table: "Quizzes",
                newName: "IX_Quizzes_LessonId");

            migrationBuilder.RenameIndex(
                name: "IX_Question_QuizId",
                table: "Questions",
                newName: "IX_Questions_QuizId");

            migrationBuilder.RenameIndex(
                name: "IX_ConnectPair_QuestionId",
                table: "ConnectPairs",
                newName: "IX_ConnectPairs_QuestionId");

            migrationBuilder.RenameIndex(
                name: "IX_AnswerOption_QuestionId",
                table: "AnswerOptions",
                newName: "IX_AnswerOptions_QuestionId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Quizzes",
                table: "Quizzes",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Questions",
                table: "Questions",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ConnectPairs",
                table: "ConnectPairs",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_AnswerOptions",
                table: "AnswerOptions",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_AnswerOptions_Questions_QuestionId",
                table: "AnswerOptions",
                column: "QuestionId",
                principalTable: "Questions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ConnectPairs_Questions_QuestionId",
                table: "ConnectPairs",
                column: "QuestionId",
                principalTable: "Questions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Questions_Quizzes_QuizId",
                table: "Questions",
                column: "QuizId",
                principalTable: "Quizzes",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_QuizResults_Quizzes_QuizId",
                table: "QuizResults",
                column: "QuizId",
                principalTable: "Quizzes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Quizzes_Lessons_LessonId",
                table: "Quizzes",
                column: "LessonId",
                principalTable: "Lessons",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AnswerOptions_Questions_QuestionId",
                table: "AnswerOptions");

            migrationBuilder.DropForeignKey(
                name: "FK_ConnectPairs_Questions_QuestionId",
                table: "ConnectPairs");

            migrationBuilder.DropForeignKey(
                name: "FK_Questions_Quizzes_QuizId",
                table: "Questions");

            migrationBuilder.DropForeignKey(
                name: "FK_QuizResults_Quizzes_QuizId",
                table: "QuizResults");

            migrationBuilder.DropForeignKey(
                name: "FK_Quizzes_Lessons_LessonId",
                table: "Quizzes");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Quizzes",
                table: "Quizzes");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Questions",
                table: "Questions");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ConnectPairs",
                table: "ConnectPairs");

            migrationBuilder.DropPrimaryKey(
                name: "PK_AnswerOptions",
                table: "AnswerOptions");

            migrationBuilder.RenameTable(
                name: "Quizzes",
                newName: "Quiz");

            migrationBuilder.RenameTable(
                name: "Questions",
                newName: "Question");

            migrationBuilder.RenameTable(
                name: "ConnectPairs",
                newName: "ConnectPair");

            migrationBuilder.RenameTable(
                name: "AnswerOptions",
                newName: "AnswerOption");

            migrationBuilder.RenameIndex(
                name: "IX_Quizzes_LessonId",
                table: "Quiz",
                newName: "IX_Quiz_LessonId");

            migrationBuilder.RenameIndex(
                name: "IX_Questions_QuizId",
                table: "Question",
                newName: "IX_Question_QuizId");

            migrationBuilder.RenameIndex(
                name: "IX_ConnectPairs_QuestionId",
                table: "ConnectPair",
                newName: "IX_ConnectPair_QuestionId");

            migrationBuilder.RenameIndex(
                name: "IX_AnswerOptions_QuestionId",
                table: "AnswerOption",
                newName: "IX_AnswerOption_QuestionId");

            migrationBuilder.AddColumn<int>(
                name: "QuizId",
                table: "Lessons",
                type: "int",
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_Quiz",
                table: "Quiz",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Question",
                table: "Question",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ConnectPair",
                table: "ConnectPair",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_AnswerOption",
                table: "AnswerOption",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_AnswerOption_Question_QuestionId",
                table: "AnswerOption",
                column: "QuestionId",
                principalTable: "Question",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ConnectPair_Question_QuestionId",
                table: "ConnectPair",
                column: "QuestionId",
                principalTable: "Question",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Question_Quiz_QuizId",
                table: "Question",
                column: "QuizId",
                principalTable: "Quiz",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Quiz_Lessons_LessonId",
                table: "Quiz",
                column: "LessonId",
                principalTable: "Lessons",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_QuizResults_Quiz_QuizId",
                table: "QuizResults",
                column: "QuizId",
                principalTable: "Quiz",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
