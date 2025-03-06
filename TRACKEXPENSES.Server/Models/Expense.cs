using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace TRACKEXPENSES.Server.Models
{
    public class Expense
    {
        [Key]
        public int Id { get; set; }
        public string? ClientId { get; set; }
        public DateTime? CreatedDate { get; set; }
        public string? Description { get; set; }
        public string? GroupId { get; set; }
        public string? ImagePath { get; set; }
        public bool? IsPayed { get; set; }
        public required string Name { get; set; }
        public double? PayAmount { get; set; }
        public double Value {  get; set; }

        public int ExpenseCategoryId { get; set; }
        // Method to find an expense by ID
        public static List<Expense> GetExpenseById(DbSet<Expense> expenses, String userId)
        {
            var listExpensesbyId = expenses.Where(exp => exp.ClientId == userId).ToList();
            return (List<Expense>)listExpensesbyId;
     
        }
    }
}
