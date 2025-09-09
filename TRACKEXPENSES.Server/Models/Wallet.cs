using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TRACKEXPENSES.Server.Models
{
    public class Wallet
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string UserId { get; set; } = default!;

        [ForeignKey(nameof(UserId))]
        public User User { get; set; } = default!;

        [Required, MaxLength(80)]
        public string Name { get; set; } = "My Wallet";

        [Required, MaxLength(3)]
        public string Currency { get; set; } = "EUR"; 

        public bool IsPrimary { get; set; } = false;

        public bool IsArchived { get; set; } = false;


        public DateTime? DeletedAt { get; set; }

        // Relações 1:N
        public ICollection<Expense> Expenses { get; set; } = new List<Expense>();
        public ICollection<Earning> Earnings { get; set; } = new List<Earning>();
    }
}
