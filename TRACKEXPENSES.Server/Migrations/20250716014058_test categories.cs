using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TRACKEXPENSES.Server.Migrations
{
    /// <inheritdoc />
    public partial class testcategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ExpenseCategoryId",
                table: "Expenses");

            migrationBuilder.DropColumn(
                name: "IsPayed",
                table: "Expenses");

            migrationBuilder.AddColumn<string>(
                name: "Periodicity",
                table: "Expenses",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "firstPaymentDate",
                table: "Expenses",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "lastPaymentDate",
                table: "Expenses",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "numberAppointments",
                table: "Expenses",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ParentCategoryId",
                table: "ExpenseCategory",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "ExpenseCategory",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ExpenseCategory_ExpenseCategory_ParentCategoryId",
                table: "ExpenseCategory");

            migrationBuilder.DropIndex(
                name: "IX_ExpenseCategory_ParentCategoryId",
                table: "ExpenseCategory");

            migrationBuilder.DropColumn(
                name: "Periodicity",
                table: "Expenses");

            migrationBuilder.DropColumn(
                name: "firstPaymentDate",
                table: "Expenses");

            migrationBuilder.DropColumn(
                name: "lastPaymentDate",
                table: "Expenses");

            migrationBuilder.DropColumn(
                name: "numberAppointments",
                table: "Expenses");

            migrationBuilder.DropColumn(
                name: "ParentCategoryId",
                table: "ExpenseCategory");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "ExpenseCategory");

            migrationBuilder.AddColumn<int>(
                name: "ExpenseCategoryId",
                table: "Expenses",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "IsPayed",
                table: "Expenses",
                type: "bit",
                nullable: true);
        }
    }
}
