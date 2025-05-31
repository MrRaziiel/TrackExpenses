using System.ComponentModel.DataAnnotations;

namespace TRACKEXPENSES.Server.ViewModels
{
    public class RegisterViewModel
    {
        public string FirstName { get; set; }

        public string FamilyName { get; set; }

        public string Email { get; set; }

        public string Password { get; set; }

        public string ConfirmPassword { get; set; }

        public string? CodeInvite { get; set; }

        public DateTime? Birthday { get; internal set; }
        public string? PhoneNumber { get; internal set; }

    }
}