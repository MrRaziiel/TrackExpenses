using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TRACKEXPENSES.Server.Migrations
{
    /// <inheritdoc />
    public partial class addingcategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ExpenseCategory_ExpenseCategory_ParentCategoryId",
                table: "ExpenseCategory");

            migrationBuilder.DropIndex(
                name: "IX_ExpenseCategory_ParentCategoryId",
                table: "ExpenseCategory");

            migrationBuilder.DropColumn(
                name: "ParentCategoryId",
                table: "ExpenseCategory");

            migrationBuilder.AddColumn<string>(
                name: "ExpenseId",
                table: "ExpenseCategory",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "ExpenseCategoryToShow",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExpenseCategoryToShow", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ExpenseCategoryToShow");

            migrationBuilder.DropColumn(
                name: "ExpenseId",
                table: "ExpenseCategory");

            migrationBuilder.AddColumn<int>(
                name: "ParentCategoryId",
                table: "ExpenseCategory",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_ExpenseCategory_ParentCategoryId",
                table: "ExpenseCategory",
                column: "ParentCategoryId");

            migrationBuilder.AddForeignKey(
                name: "FK_ExpenseCategory_ExpenseCategory_ParentCategoryId",
                table: "ExpenseCategory",
                column: "ParentCategoryId",
                principalTable: "ExpenseCategory",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
