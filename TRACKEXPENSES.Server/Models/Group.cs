using System.ComponentModel.DataAnnotations;
using TRACKEXPENSES.Server.Models;
using Microsoft.EntityFrameworkCore;



namespace TRACKEXPENSES.Server.Models
{
    public class Group
    {
        public string Id { get; init; } = Guid.NewGuid().ToString();

        [Required, MaxLength(250)]
        public string Name { get; set; } = default!;

        public string? CodeInvite { get; set; }

        //  Admin único do grupo (User.Id)
        [Required]
        public string AdminId { get; set; } = default!;

        //  Membros do grupo (n:n)
        public ICollection<User> Users { get; } = new List<User>();
    }

    


}

