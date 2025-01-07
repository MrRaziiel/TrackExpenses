using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using TrackExpenses.Data;

namespace TrackExpenses.Models
{
    public class Expense
    {
        [Key]
        public int Id { get; set; }
        public required string Name { get; set; }
        public string? Description { get; set; }
        public  double Value {  get; set; }

        public string? ClientId { get; set; }
        public string? GroupId { get; set; }

        // Method to find an expense by ID
        public static List<Expense> GetExpenseById(DbSet<Expense> expenses, String userId)
        {
            var listExpensesbyId = expenses.Where(exp => exp.ClientId == userId).ToList();
            return (List<Expense>)listExpensesbyId;
     
        }
    }
}
