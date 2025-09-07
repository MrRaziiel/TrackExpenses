using Microsoft.AspNetCore.Identity;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using TRACKEXPENSES.Server.Handlers;
using TRACKEXPENSES.Server.ViewModels;


namespace TRACKEXPENSES.Server.Models
{


    public class Group
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [MaxLength(250)]
        [Required]
        public string Name { get; set; }

        public string? CodeInvite { get; set; }

        // vários users
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

        public ICollection<Group> Groups { get; set; } = new List<Group>();

        public List<Expense> Expenses { get; set; } = new List<Expense>();

        public List<RefreshToken> RefreshTokens { get; set; } = new();

    }

    public class UserGroup
    {
        public string AdminId { get; set; }
        public User User { get; set; }

        public string GroupId { get; set; }
        public Group Group { get; set; }

        // opcional
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    }


    public class CreateUserFromRegister : User
    {
        public static CreateUserFromRegister fromRegister(RegisterViewModel register)
        {

            return new CreateUserFromRegister()
            {

                FirstName = register.FirstName,
                FamilyName = register.FamilyName,
                Email = register.Email,
                UserName = register.Email,
                Password = PasswordHashHandler.HashPassword(register.Password),
                PhoneNumber = register.PhoneNumber != null ? register.PhoneNumber : "000000000",
                ProfileImageId = "No_image.jpg",
                Birthday = register.Birthday != null ? register.Birthday : DateTime.Now,

            };


        }
    }

}


