using System.ComponentModel.DataAnnotations;

namespace TRACKEXPENSES.Server.Models
{
    public class CreateRoleViewModel
    {
        [Required]
        [Display(Name = "Role")]
        public required string RoleName { get; set; }
    }
}