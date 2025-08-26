using System.ComponentModel.DataAnnotations;

namespace TRACKEXPENSES.Server.Requests.User
{
        public class UserEmailRequest
        {
            /// <example>usuario@empresa.com</example>
            [Required]
            [EmailAddress]
            public string UserEmail { get; set; }
        }
}
