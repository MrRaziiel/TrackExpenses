using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;



namespace TRACKEXPENSES.Server.Requests.Group
{
    public class GroupRegisterRequest
    {
        [Required]
        [EmailAddress]
        [DefaultValue("utilizador@gmail.com")]
        public string AdminEmail { get; set; }


        [DefaultValue("Filipino")]

        public string GroupName { get; set; }

        public List<string>? UsersId { get; set; }
        
        

    }
}
