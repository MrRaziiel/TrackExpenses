using System.ComponentModel.DataAnnotations;

namespace TRACKEXPENSES.Server.ViewModels
{
    public class VerifyEmailViewModel
    {

        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress]
        public string Email { get; set; }
    }
}