using System.ComponentModel.DataAnnotations;

namespace TRACKEXPENSES.Server.ViewModels
{
    public class RegisterViewModel
    {
        [Required(ErrorMessage = "FirstName is required.")]
        public string FirstName { get; set; }

        [Required(ErrorMessage = "LastName is required.")]
        public string FamilyName { get; set; }

        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress]
        public string Email { get; set; }

        [Required(ErrorMessage = "Password is required.")]
        [StringLength(40, MinimumLength = 8, ErrorMessage = "The {0} must be at {2} and at max {1} character")]
        [DataType(DataType.Password)]
        [Compare("ConfirmPassword", ErrorMessage = "Password does not match.")]
        public string Password { get; set; }

        [Required(ErrorMessage = "confirm password is required.")]
        [DataType(DataType.Password)]
        public string ConfirmPassword { get; set; }

        public string CodeInvite { get; set; }

    }
}