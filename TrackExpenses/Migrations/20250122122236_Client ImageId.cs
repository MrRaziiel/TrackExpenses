using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrackExpenses.Migrations
{
    /// <inheritdoc />
    public partial class ClientImageId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "PhotoPath",
                table: "AspNetUsers",
                newName: "ProfileImageId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ProfileImageId",
                table: "AspNetUsers",
                newName: "PhotoPath");
        }
    }
}
