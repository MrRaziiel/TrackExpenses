using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace TRACKEXPENSES.Server.Models
{
    public class Expense
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

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

        public string? ImageId { get; set; }

        public string UserId { get; set; }

        public string? GroupId { get; set; }

        public ICollection<ExpenseInstance> Instances { get; set; } = new List<ExpenseInstance>();
    }

    public class ExpenseInstance
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string ExpenseId { get; set; }

        [ForeignKey("ExpenseId")]
        public Expense Expense { get; set; }

        public DateTime DueDate { get; set; }

        public bool IsPaid { get; set; }

        public decimal Value { get; set; }

        public decimal PaidAmount { get; set; }

        public string? ImageId { get; set; }

        [ForeignKey("ImageId")]
        public ImageDB? Image { get; set; }
    }
}
