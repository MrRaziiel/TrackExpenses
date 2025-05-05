using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using TRACKEXPENSES.Server.Models;

namespace TRACKEXPENSES.Server.ViewModels
{
    public abstract class UserViewModel
    {
        public string Id { get; set; }

        [MaxLength(250)]
        public required string FirstName { get; set; }

        [MaxLength(250)]
        public required string FamilyName { get; set; }

        [DataType(DataType.Date)]
        [DisplayName("Birthday:")]
        [DisplayFormat(ApplyFormatInEditMode = true, DataFormatString = "{0:dd/mm/YYYY}")]
        public DateTime? Birthday { get; set; }

        public required string Email { get; set; }

        public string? ProfileImageId { get; set; }
        public string? ProfileImagePath { get; set; }
        [PasswordPropertyText]
        public required string Password { get; set; }

        public virtual void CopyTo(User updateUser)
        {
            updateUser.FirstName = FirstName;
            updateUser.FamilyName = FamilyName;
            updateUser.Password = Password;
            if (Birthday != default || Birthday != null) updateUser.Birthday = Birthday;
        }
    }

    public class AdminClientUpdateViewModel : UserViewModel
    {

        public static AdminClientUpdateViewModel FromClient(User user)
        {
            return new AdminClientUpdateViewModel()
            {
                Id = user.Id,
                FirstName = user.FirstName,
                FamilyName = user.FamilyName,
                Birthday = user.Birthday,
                Email = user.Email,
                ProfileImageId = user.ProfileImageId,
                Password = user.Password
            };
        }
        //public override void CopyTo(Client updateUser)
        //{
        //    base.CopyTo(updateUser);

        //}
    }

    public class UserUpdateViewModel : UserViewModel
    {
        public static UserUpdateViewModel FromClient(User User)
        {
            return new UserUpdateViewModel()
            {
                Id = User.Id,
                FirstName = User.FirstName,
                FamilyName = User.FamilyName,
                Birthday = User.Birthday,
                Email = User.Email,
                ProfileImageId = User.ProfileImageId,
                Password = User.Password
            };

        }

    }
}