using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;


namespace TRACKEXPENSES.Server.Models
{
    public class Earning
    {
        [Key] public int Id { get; set; }
        [Required, MaxLength(120)] public string Name { get; set; }
        [Range(0, double.MaxValue)] public decimal Amount { get; set; }
        public DateTime Date { get; set; }
        public string? Category { get; set; }
        [Required] public string UserId { get; set; }
        public string? GroupId { get; set; }

        public string? Periodicity { get; set; }  // manter compat
        public RecurrenceKind RecurrenceKind { get; set; } = RecurrenceKind.None;
        public string? RRule { get; set; }
        public int? RepeatCount { get; set; }
        public bool IsActive { get; set; } = true;

        // NOVO: Wallet
        [Required] public string WalletId { get; set; }
        [ForeignKey(nameof(WalletId))] public Wallet Wallet { get; set; }
    }
}
