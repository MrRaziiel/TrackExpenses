using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;


namespace TRACKEXPENSES.Server.Models
{


    public class GroupOfUsers
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString(); // Default unique ID generation

        [MaxLength(250)]
        [Required]
        public string Name { get; set; }

        [MaxLength(50)]
        [Required]
        public string? CodeInvite { get; set; } // Unique constraint to be applied in DbContext configuration


        // Navigation property for related users
        public ICollection<User> Users { get; set; } = new List<User>();

    }

    public class User : IdentityUser
    {
       

        private event PropertyChangedEventHandler? PropertyChanged;

        protected void OnPropertyChanged(string name) =>
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));

        [MaxLength(250)]
        public required string FirstName { get; set; }

        [MaxLength(250)]
        public required string FamilyName { get; set; }

        private DateTime? birthday;

        public DateTime? Birthday
        {
            get => birthday;
            set
            {
                birthday = value; // usar a variável privada!
                OnPropertyChanged(nameof(Birthday));
                if (birthday != null)
                {
                    BirthdayString = birthday.Value.ToString();
                }
            }
        }


        public String? BirthdayString { get; set; }


        public string? ProfileImageId { get; set; }

        [PasswordPropertyText]
        public required string Password { get; set; }

        public string? GroupId { get; set; }

        public GroupOfUsers? GroupOfUsers { get; set; }

        public List<Expense> Expenses { get; set; } = new List<Expense>();

    }
}


