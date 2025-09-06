using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace TRACKEXPENSES.Server.Requests.User
{
        public class UserEmailRequest
        {
            /// <example>utlizador@empresa.com</example>
            [Required]
            [EmailAddress]
        [DefaultValue("utilizador@gmail.com")]
        public string UserEmail { get; set; }

        [DefaultValue("*****************")]
        public string? Token { get; set; }
    }
}
