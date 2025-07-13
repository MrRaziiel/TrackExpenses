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
        public string? Password { get; set; }

        public string? PhoneNumber { get; set; }

        public virtual void CopyTo(User updateUser)
        {
            if (FirstName != default || FirstName != null) updateUser.FirstName = FirstName;
            if (FamilyName != default || FamilyName != null) updateUser.FamilyName = FamilyName;
            if (Password != default || Password != null) updateUser.Password = Password;
            if (Birthday != default || Birthday != null) updateUser.Birthday = Birthday;
            if (Email != default || Email != null) updateUser.Email = Email;
            if (ProfileImageId != default || ProfileImageId != null) updateUser.ProfileImageId = ProfileImageId;
            if (PhoneNumber != default || PhoneNumber != null) updateUser.PhoneNumber = ProfileImagePath;
            if (Password != default || Password != null) updateUser.Password = Password;
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
                Password = user.Password,
                PhoneNumber = user.PhoneNumber,
            };
        }

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
                Password = User.Password,
                PhoneNumber = User.PhoneNumber,
            };

        }

    }
}