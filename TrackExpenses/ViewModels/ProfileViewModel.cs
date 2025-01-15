using System.ComponentModel.DataAnnotations;

namespace TrackExpenses.ViewModels
{
    public class ProfileViewModel
    {
        [Required(ErrorMessage = "FirstName is required.")]
        [Display(Name = "First Name")]
        public string FirstName { get; set; }

        [Required(ErrorMessage = "LastName is required.")]
        [Display(Name = "Family Name")]
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
        [Display(Name = "Confirm Password")]
        public string ConfirmPassword { get; set; }

        [Required(ErrorMessage = "Please enter your birthday.")]
        [DisplayFormat(DataFormatString = "{dd/mm/YYYY}", ApplyFormatInEditMode = true)]
        [DataType(DataType.Date)]
        public DateTime? Birthday { get; set; }

        public string? PhotoPath { get; set; }
    }
}
