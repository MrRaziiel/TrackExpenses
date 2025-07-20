using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace TRACKEXPENSES.Server.Models
{
    public class Category
    {
        [Key]
        public int Id { get; set; }

        public string Name { get; set; }

        // Usuário que criou esta categoria
        public string UserId { get; set; }
        public string ExpenseId { get; set; }

    }

    public class ExpenseCategoryToShow
    {
        [Key]
        public int Id { get; set; }

        public string Name { get; set; }

        public CategoryType Type { get; set; }
    }

    public enum CategoryType
    {
        Expense,
        Earning
    }
}
