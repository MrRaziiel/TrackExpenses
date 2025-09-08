using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace TRACKEXPENSES.Server.Models
{
    public class Expense
    {
        [Key] public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required, MaxLength(120)] public string Name { get; set; }
        public string? Description { get; set; }
        public decimal Value { get; set; }           // Para one-off ou valor base da recorrência
        public decimal? PayAmount { get; set; }      // Pode ser usado p/ partial payments

        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }

        public int? RepeatCount { get; set; }        // nº de repetições (opcional)
        public bool ShouldNotify { get; set; }
        public string? Periodicity { get; set; }     // manter compat; ver abaixo
        public RecurrenceKind RecurrenceKind { get; set; } = RecurrenceKind.None;
        public string? RRule { get; set; }           // iCal RRULE se RecurrenceKind == RRule

        public string? Category { get; set; }
        public string? ImageId { get; set; }

        [Required] public string UserId { get; set; }   // manter
        public string? GroupId { get; set; }            // manter

        // NOVO: ligação à Wallet
        [Required] public string WalletId { get; set; }
        [ForeignKey(nameof(WalletId))] public Wallet Wallet { get; set; }

        public ICollection<ExpenseInstance> Instances { get; set; } = new List<ExpenseInstance>();

        public InstallmentPlan? InstallmentPlan { get; set; }
    }

    public class ExpenseInstance
    {
        [Key] public string Id { get; set; } = Guid.NewGuid().ToString();
        [Required] public string ExpenseId { get; set; }
        [ForeignKey(nameof(ExpenseId))] public Expense Expense { get; set; }

        public DateTime DueDate { get; set; }
        public bool IsPaid { get; set; }
        public decimal Value { get; set; }            // Valor daquela prestação/recorrência
        public decimal PaidAmount { get; set; }

        public string? ImageId { get; set; }
        [ForeignKey(nameof(ImageId))] public ImageDB? Image { get; set; }
    }

   

}
