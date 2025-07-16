using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace TRACKEXPENSES.Server.Models
{
    public class Expense
    {
        [Key]
        public int Id { get; set; }
        public DateTime? CreatedDate { get; set; }
        public required string Name { get; set; }
        public string? Description { get; set; }
        public string? ImagePath { get; set; }
        public string Periodicity { get; set; }
        public double? PayAmount { get; set; }
        public double Value {  get; set; }

        public DateTime? firstPaymentDate { get; set; }
        public DateTime? lastPaymentDate { get; set; }
        public DateTime? numberAppointments { get; set; }

        private bool? _isPayed;
        public bool IsPayed => PayAmount.HasValue && PayAmount.Value >= Value;
        public string? GroupId { get; set; }
        public string? ClientId { get; set; }

        // Method to find an expense by ID
        public static List<Expense> GetExpenseById(DbSet<Expense> expenses, string userId)
        {
            var listExpensesbyId = expenses.Where(exp => exp.ClientId == userId).ToList();
            return (List<Expense>)listExpensesbyId;
     
        }
    }
}
