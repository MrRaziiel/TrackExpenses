using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace TRACKEXPENSES.Server.Models
{
    public class Expense
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string? Description { get; set; }
        public decimal Value { get; set; }
        public decimal? PayAmount { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int? RepeatCount { get; set; }
        public bool ShouldNotify { get; set; }
        public string Periodicity { get; set; }
        public string? Category { get; set; }
        public string UserId { get; set; }
        public string? GroupId { get; set; }


// Method to find an expense by ID
public static List<Expense> GetExpenseById(DbSet<Expense> expenses, string userId)
        {
            var listExpensesbyId = expenses.Where(exp => exp.UserId == userId).ToList();
            return (List<Expense>)listExpensesbyId;
     
        }
    }
}
