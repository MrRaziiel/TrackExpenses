using Microsoft.AspNetCore.Identity;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using static System.Net.Mime.MediaTypeNames;

namespace TrackExpenses.Models
{


    public class GroupOfClients
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString(); // Default unique ID generation

        [MaxLength(250)]
        [Required]
        public string Name { get; set; }

        [MaxLength(50)]
        [Required]
        public string? CodeInvite { get; set; } // Unique constraint to be applied in DbContext configuration


        // Navigation property for related clients
        public ICollection<Client> Clients { get; set; } = new List<Client>();

    }

    public class Client : IdentityUser
    {

        [MaxLength(250)]
        public required string FirstName { get; set; }

        [MaxLength(250)]
        public required string FamilyName { get; set; }

        public DateTime Birthday { get; set; }

        public string? PhotoPath { get; set; }
        [PasswordPropertyText]
        public required string Password { get; set; }

        public string? GroupId { get; set; }

        public GroupOfClients? GroupOfClients { get; set; }

        public List<Expense> Expenses { get; set; } = new List<Expense>();

    }
   

}


