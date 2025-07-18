using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TRACKEXPENSES.Server.Migrations
{
    /// <inheritdoc />
    public partial class fixCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Type",
                table: "ExpenseCategoryToShow",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Type",
                table: "ExpenseCategoryToShow");
        }
    }
}
