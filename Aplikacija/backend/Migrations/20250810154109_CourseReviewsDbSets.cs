using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class CourseReviewsDbSets : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CourseReview_Courses_CourseId",
                table: "CourseReview");

            migrationBuilder.DropForeignKey(
                name: "FK_CourseReview_Users_UserId",
                table: "CourseReview");

            migrationBuilder.DropPrimaryKey(
                name: "PK_CourseReview",
                table: "CourseReview");

            migrationBuilder.RenameTable(
                name: "CourseReview",
                newName: "CourseReviews");

            migrationBuilder.RenameIndex(
                name: "IX_CourseReview_CourseId",
                table: "CourseReviews",
                newName: "IX_CourseReviews_CourseId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_CourseReviews",
                table: "CourseReviews",
                columns: new[] { "UserId", "CourseId" });

            migrationBuilder.AddForeignKey(
                name: "FK_CourseReviews_Courses_CourseId",
                table: "CourseReviews",
                column: "CourseId",
                principalTable: "Courses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_CourseReviews_Users_UserId",
                table: "CourseReviews",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CourseReviews_Courses_CourseId",
                table: "CourseReviews");

            migrationBuilder.DropForeignKey(
                name: "FK_CourseReviews_Users_UserId",
                table: "CourseReviews");

            migrationBuilder.DropPrimaryKey(
                name: "PK_CourseReviews",
                table: "CourseReviews");

            migrationBuilder.RenameTable(
                name: "CourseReviews",
                newName: "CourseReview");

            migrationBuilder.RenameIndex(
                name: "IX_CourseReviews_CourseId",
                table: "CourseReview",
                newName: "IX_CourseReview_CourseId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_CourseReview",
                table: "CourseReview",
                columns: new[] { "UserId", "CourseId" });

            migrationBuilder.AddForeignKey(
                name: "FK_CourseReview_Courses_CourseId",
                table: "CourseReview",
                column: "CourseId",
                principalTable: "Courses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_CourseReview_Users_UserId",
                table: "CourseReview",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
