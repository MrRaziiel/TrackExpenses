using System.ComponentModel;
using System.ComponentModel.DataAnnotations;


namespace TRACKEXPENSES.Server.Requests.Group
{
    public class GroupRegisterRequest
    {
        [Required]
        [EmailAddress]
        [DefaultValue("utilizador@gmail.com")]
        public string AdminId { get; set; }

        [DefaultValue("****************")]
        public string CodeInvite { get; set; }

        [DefaultValue("Filipino")]

        public string GroupName { get; set; }
        
        

    }
}
