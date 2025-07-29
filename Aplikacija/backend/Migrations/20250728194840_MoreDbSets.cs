using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class MoreDbSets : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Badge_Users_UserId",
                table: "Badge");

            migrationBuilder.DropForeignKey(
                name: "FK_ChallengeReview_Challenges_ChallengeId",
                table: "ChallengeReview");

            migrationBuilder.DropForeignKey(
                name: "FK_ChallengeReview_Users_UserId",
                table: "ChallengeReview");

            migrationBuilder.DropForeignKey(
                name: "FK_ChallengeSubmission_Challenges_ChallengeId",
                table: "ChallengeSubmission");

            migrationBuilder.DropForeignKey(
                name: "FK_ChallengeSubmission_Users_UserId",
                table: "ChallengeSubmission");

            migrationBuilder.DropForeignKey(
                name: "FK_LessonReview_Lessons_LessonId",
                table: "LessonReview");

            migrationBuilder.DropForeignKey(
                name: "FK_LessonReview_Users_UserId",
                table: "LessonReview");

            migrationBuilder.DropForeignKey(
                name: "FK_Message_Conversations_ConversationId",
                table: "Message");

            migrationBuilder.DropForeignKey(
                name: "FK_Message_Users_SenderId",
                table: "Message");

            migrationBuilder.DropForeignKey(
                name: "FK_QuizResult_Quiz_QuizId",
                table: "QuizResult");

            migrationBuilder.DropForeignKey(
                name: "FK_QuizResult_Users_UserId",
                table: "QuizResult");

            migrationBuilder.DropPrimaryKey(
                name: "PK_QuizResult",
                table: "QuizResult");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Message",
                table: "Message");

            migrationBuilder.DropPrimaryKey(
                name: "PK_LessonReview",
                table: "LessonReview");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ChallengeSubmission",
                table: "ChallengeSubmission");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ChallengeReview",
                table: "ChallengeReview");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Badge",
                table: "Badge");

            migrationBuilder.RenameTable(
                name: "QuizResult",
                newName: "QuizResults");

            migrationBuilder.RenameTable(
                name: "Message",
                newName: "Messages");

            migrationBuilder.RenameTable(
                name: "LessonReview",
                newName: "LessonReviews");

            migrationBuilder.RenameTable(
                name: "ChallengeSubmission",
                newName: "ChallengeSubmissions");

            migrationBuilder.RenameTable(
                name: "ChallengeReview",
                newName: "ChallengeReviews");

            migrationBuilder.RenameTable(
                name: "Badge",
                newName: "Badges");

            migrationBuilder.RenameIndex(
                name: "IX_QuizResult_UserId",
                table: "QuizResults",
                newName: "IX_QuizResults_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_QuizResult_QuizId",
                table: "QuizResults",
                newName: "IX_QuizResults_QuizId");

            migrationBuilder.RenameIndex(
                name: "IX_Message_SenderId",
                table: "Messages",
                newName: "IX_Messages_SenderId");

            migrationBuilder.RenameIndex(
                name: "IX_Message_ConversationId",
                table: "Messages",
                newName: "IX_Messages_ConversationId");

            migrationBuilder.RenameIndex(
                name: "IX_LessonReview_LessonId",
                table: "LessonReviews",
                newName: "IX_LessonReviews_LessonId");

            migrationBuilder.RenameIndex(
                name: "IX_ChallengeSubmission_UserId",
                table: "ChallengeSubmissions",
                newName: "IX_ChallengeSubmissions_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_ChallengeSubmission_ChallengeId",
                table: "ChallengeSubmissions",
                newName: "IX_ChallengeSubmissions_ChallengeId");

            migrationBuilder.RenameIndex(
                name: "IX_ChallengeReview_ChallengeId",
                table: "ChallengeReviews",
                newName: "IX_ChallengeReviews_ChallengeId");

            migrationBuilder.RenameIndex(
                name: "IX_Badge_UserId",
                table: "Badges",
                newName: "IX_Badges_UserId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_QuizResults",
                table: "QuizResults",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Messages",
                table: "Messages",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_LessonReviews",
                table: "LessonReviews",
                columns: new[] { "UserId", "LessonId" });

            migrationBuilder.AddPrimaryKey(
                name: "PK_ChallengeSubmissions",
                table: "ChallengeSubmissions",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ChallengeReviews",
                table: "ChallengeReviews",
                columns: new[] { "UserId", "ChallengeId" });

            migrationBuilder.AddPrimaryKey(
                name: "PK_Badges",
                table: "Badges",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Badges_Users_UserId",
                table: "Badges",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ChallengeReviews_Challenges_ChallengeId",
                table: "ChallengeReviews",
                column: "ChallengeId",
                principalTable: "Challenges",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ChallengeReviews_Users_UserId",
                table: "ChallengeReviews",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ChallengeSubmissions_Challenges_ChallengeId",
                table: "ChallengeSubmissions",
                column: "ChallengeId",
                principalTable: "Challenges",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ChallengeSubmissions_Users_UserId",
                table: "ChallengeSubmissions",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_LessonReviews_Lessons_LessonId",
                table: "LessonReviews",
                column: "LessonId",
                principalTable: "Lessons",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_LessonReviews_Users_UserId",
                table: "LessonReviews",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Messages_Conversations_ConversationId",
                table: "Messages",
                column: "ConversationId",
                principalTable: "Conversations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Messages_Users_SenderId",
                table: "Messages",
                column: "SenderId",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_QuizResults_Quiz_QuizId",
                table: "QuizResults",
                column: "QuizId",
                principalTable: "Quiz",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_QuizResults_Users_UserId",
                table: "QuizResults",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Badges_Users_UserId",
                table: "Badges");

            migrationBuilder.DropForeignKey(
                name: "FK_ChallengeReviews_Challenges_ChallengeId",
                table: "ChallengeReviews");

            migrationBuilder.DropForeignKey(
                name: "FK_ChallengeReviews_Users_UserId",
                table: "ChallengeReviews");

            migrationBuilder.DropForeignKey(
                name: "FK_ChallengeSubmissions_Challenges_ChallengeId",
                table: "ChallengeSubmissions");

            migrationBuilder.DropForeignKey(
                name: "FK_ChallengeSubmissions_Users_UserId",
                table: "ChallengeSubmissions");

            migrationBuilder.DropForeignKey(
                name: "FK_LessonReviews_Lessons_LessonId",
                table: "LessonReviews");

            migrationBuilder.DropForeignKey(
                name: "FK_LessonReviews_Users_UserId",
                table: "LessonReviews");

            migrationBuilder.DropForeignKey(
                name: "FK_Messages_Conversations_ConversationId",
                table: "Messages");

            migrationBuilder.DropForeignKey(
                name: "FK_Messages_Users_SenderId",
                table: "Messages");

            migrationBuilder.DropForeignKey(
                name: "FK_QuizResults_Quiz_QuizId",
                table: "QuizResults");

            migrationBuilder.DropForeignKey(
                name: "FK_QuizResults_Users_UserId",
                table: "QuizResults");

            migrationBuilder.DropPrimaryKey(
                name: "PK_QuizResults",
                table: "QuizResults");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Messages",
                table: "Messages");

            migrationBuilder.DropPrimaryKey(
                name: "PK_LessonReviews",
                table: "LessonReviews");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ChallengeSubmissions",
                table: "ChallengeSubmissions");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ChallengeReviews",
                table: "ChallengeReviews");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Badges",
                table: "Badges");

            migrationBuilder.RenameTable(
                name: "QuizResults",
                newName: "QuizResult");

            migrationBuilder.RenameTable(
                name: "Messages",
                newName: "Message");

            migrationBuilder.RenameTable(
                name: "LessonReviews",
                newName: "LessonReview");

            migrationBuilder.RenameTable(
                name: "ChallengeSubmissions",
                newName: "ChallengeSubmission");

            migrationBuilder.RenameTable(
                name: "ChallengeReviews",
                newName: "ChallengeReview");

            migrationBuilder.RenameTable(
                name: "Badges",
                newName: "Badge");

            migrationBuilder.RenameIndex(
                name: "IX_QuizResults_UserId",
                table: "QuizResult",
                newName: "IX_QuizResult_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_QuizResults_QuizId",
                table: "QuizResult",
                newName: "IX_QuizResult_QuizId");

            migrationBuilder.RenameIndex(
                name: "IX_Messages_SenderId",
                table: "Message",
                newName: "IX_Message_SenderId");

            migrationBuilder.RenameIndex(
                name: "IX_Messages_ConversationId",
                table: "Message",
                newName: "IX_Message_ConversationId");

            migrationBuilder.RenameIndex(
                name: "IX_LessonReviews_LessonId",
                table: "LessonReview",
                newName: "IX_LessonReview_LessonId");

            migrationBuilder.RenameIndex(
                name: "IX_ChallengeSubmissions_UserId",
                table: "ChallengeSubmission",
                newName: "IX_ChallengeSubmission_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_ChallengeSubmissions_ChallengeId",
                table: "ChallengeSubmission",
                newName: "IX_ChallengeSubmission_ChallengeId");

            migrationBuilder.RenameIndex(
                name: "IX_ChallengeReviews_ChallengeId",
                table: "ChallengeReview",
                newName: "IX_ChallengeReview_ChallengeId");

            migrationBuilder.RenameIndex(
                name: "IX_Badges_UserId",
                table: "Badge",
                newName: "IX_Badge_UserId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_QuizResult",
                table: "QuizResult",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Message",
                table: "Message",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_LessonReview",
                table: "LessonReview",
                columns: new[] { "UserId", "LessonId" });

            migrationBuilder.AddPrimaryKey(
                name: "PK_ChallengeSubmission",
                table: "ChallengeSubmission",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ChallengeReview",
                table: "ChallengeReview",
                columns: new[] { "UserId", "ChallengeId" });

            migrationBuilder.AddPrimaryKey(
                name: "PK_Badge",
                table: "Badge",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Badge_Users_UserId",
                table: "Badge",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ChallengeReview_Challenges_ChallengeId",
                table: "ChallengeReview",
                column: "ChallengeId",
                principalTable: "Challenges",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ChallengeReview_Users_UserId",
                table: "ChallengeReview",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ChallengeSubmission_Challenges_ChallengeId",
                table: "ChallengeSubmission",
                column: "ChallengeId",
                principalTable: "Challenges",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ChallengeSubmission_Users_UserId",
                table: "ChallengeSubmission",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_LessonReview_Lessons_LessonId",
                table: "LessonReview",
                column: "LessonId",
                principalTable: "Lessons",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_LessonReview_Users_UserId",
                table: "LessonReview",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Message_Conversations_ConversationId",
                table: "Message",
                column: "ConversationId",
                principalTable: "Conversations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Message_Users_SenderId",
                table: "Message",
                column: "SenderId",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_QuizResult_Quiz_QuizId",
                table: "QuizResult",
                column: "QuizId",
                principalTable: "Quiz",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_QuizResult_Users_UserId",
                table: "QuizResult",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id");
        }
    }
}
