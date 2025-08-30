using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace TRACKEXPENSES.Server.ViewModels
{
    public class RegisterViewModel
    {
        [DefaultValue("Ruben")]
        public string FirstName { get; set; }

        [DefaultValue("Filipino")]
        public string FamilyName { get; set; }

        [DefaultValue("utilizador@gmail.com")]
        public string Email { get; set; }

        [DefaultValue("****************")]
        public string Password { get; set; }

        [DefaultValue("****************")]
        public string ConfirmPassword { get; set; }

        [DefaultValue("****************")]
        public string? CodeInvite { get; set; }

        [DefaultValue("14/06/2025")]
        public DateTime? Birthday { get; set; }

        [DefaultValue("9111111111111111")]
        public string? PhoneNumber { get;  set; }

    }

  


}