using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrackExpenses.Migrations
{
    /// <inheritdoc />
    public partial class FixExpenses_And_GroupOfClients : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "UserId",
                table: "Expenses",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ClientId",
                table: "Expenses",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Expenses_ClientId",
                table: "Expenses",
                column: "ClientId");

            migrationBuilder.AddForeignKey(
                name: "FK_Expenses_AspNetUsers_ClientId",
                table: "Expenses",
                column: "ClientId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Expenses_AspNetUsers_ClientId",
                table: "Expenses");

            migrationBuilder.DropIndex(
                name: "IX_Expenses_ClientId",
                table: "Expenses");

            migrationBuilder.DropColumn(
                name: "ClientId",
                table: "Expenses");

            migrationBuilder.AlterColumn<int>(
                name: "UserId",
                table: "Expenses",
                type: "int",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);
        }
    }
}
