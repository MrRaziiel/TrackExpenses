using Microsoft.AspNetCore.Identity;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using TRACKEXPENSES.Server.Handlers;
using TRACKEXPENSES.Server.ViewModels;
using Microsoft.EntityFrameworkCore;


namespace TRACKEXPENSES.Server.Models
{
    public class User : IdentityUser
    {

        private event PropertyChangedEventHandler? PropertyChanged;
        private void OnPropertyChanged(string name) => PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));

        [MaxLength(250)] public required string FirstName { get; set; }
        [MaxLength(250)] public required string FamilyName { get; set; }

        private DateTime? birthday;
        public DateTime? Birthday
        {
            get => birthday;
            set { birthday = value; OnPropertyChanged(nameof(Birthday)); if (birthday != null) BirthdayString = birthday.Value.ToString(); }
        }

        public string? BirthdayString { get; set; }
        public string? ProfileImageId { get; set; }

        [PasswordPropertyText]
        public required string Password { get; set; }


        public ICollection<Group> Groups { get; } = new List<Group>();

        public List<Expense> Expenses { get; set; } = new();
        public List<RefreshToken> RefreshTokens { get; set; } = new();

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
