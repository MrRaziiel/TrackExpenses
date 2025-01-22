using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrackExpenses.Migrations
{
    /// <inheritdoc />
    public partial class updatenameinImgesDB : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Path",
                table: "ImagesDB",
                newName: "Name");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Name",
                table: "ImagesDB",
                newName: "Path");
        }
    }
}
