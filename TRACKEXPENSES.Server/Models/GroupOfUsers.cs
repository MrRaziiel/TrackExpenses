using Microsoft.AspNetCore.Identity;
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


        // Navigation property for related clients
        public ICollection<Users> Users { get; set; } = new List<Users>();

    }

    public class Users : IdentityUser
    {
        private DateTime? birthday;

        private event PropertyChangedEventHandler? PropertyChanged;

        protected void OnPropertyChanged(string name) =>
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));

        [MaxLength(250)]
        public required string FirstName { get; set; }

        [MaxLength(250)]
        public required string FamilyName { get; set; }

        [DataType(DataType.Date)]
        [DisplayName("Birthday:")]
        [DisplayFormat(ApplyFormatInEditMode = true, DataFormatString = "{0:dd/mm/YYYY}")]
        public DateTime? Birthday
        {
            get => birthday; set
            {
                Birthday = value;
                OnPropertyChanged(nameof(Birthday));
                if (Birthday != null)
                {
                    BirthdayString = Birthday.Value.ToString("dd/MM/yyyy", new CultureInfo("pt-PT"));
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


