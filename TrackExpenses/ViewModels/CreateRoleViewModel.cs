using System.ComponentModel.DataAnnotations;
namespace TrackExpenses.Models
{
    public class CreateRoleViewModel
    {
        [Required]
        [Display(Name = "Role")]
        public required string RoleName { get; set; }
    }
}