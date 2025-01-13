using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrackExpenses.Migrations
{
    /// <inheritdoc />
    public partial class addingexpensesCategory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedDate",
                table: "Expenses",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ExpenseCategoryId",
                table: "Expenses",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ImagePath",
                table: "Expenses",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsPayed",
                table: "Expenses",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "PayAmount",
                table: "Expenses",
                type: "float",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedDate",
                table: "Expenses");

            migrationBuilder.DropColumn(
                name: "ExpenseCategoryId",
                table: "Expenses");

            migrationBuilder.DropColumn(
                name: "ImagePath",
                table: "Expenses");

            migrationBuilder.DropColumn(
                name: "IsPayed",
                table: "Expenses");

            migrationBuilder.DropColumn(
                name: "PayAmount",
                table: "Expenses");
        }
    }
}
