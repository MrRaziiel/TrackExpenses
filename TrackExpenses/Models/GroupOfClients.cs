using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TrackExpenses.Models
{
    public class GroupOfClients
    {
        [Key]
        public int Id { get; set; }
        [MaxLength(250)]
        public required string Name { get; set; }
        // Navigation property - A group can have many clients
        public string? CodeInvite { get; set; }
        // Navigation property for related Clients
        public ICollection<Client>? Clients { get; set; }
    }

    public class Client
    {
        [Key]
        public int Id { get; set; }
        [MaxLength(250)]
        public required string FirstName { get; set; }
        [MaxLength(250)]
        public required string LastName { get; set; }
        public DateTime? Birtday { get; set; }
        [EmailAddress]
        public required string Email { get; set; }
        [PasswordPropertyText]
        public required string Password {  get; set; }
        public string? PhotoPath {  get; set; }
        // Foreign key for GroupOfClients
        public int GroupId { get; set; }

        [ForeignKey("Id")]
        public GroupOfClients? GroupOfClients { get; set; } // Navigation property
    }
    }

