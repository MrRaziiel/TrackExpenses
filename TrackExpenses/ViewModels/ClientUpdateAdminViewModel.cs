using Microsoft.VisualStudio.Web.CodeGenerators.Mvc.Templates.BlazorIdentity.Pages.Manage;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using TrackExpenses.Models;

namespace TrackExpenses.ViewModels
{
    public class ClientUpdateAdminViewModel
    {
        public ClientUpdateAdminViewModel() { }

        public string Id { get; set; }

        [MaxLength(250)]
        public required string FirstName { get; set; }

        [MaxLength(250)]
        public required string FamilyName { get; set; }

        [DataType(DataType.Date)]
        [DisplayName("Birthday:")]
        [DisplayFormat(ApplyFormatInEditMode = true, DataFormatString = "{0:dd/mm/YYYY}")]
        public DateTime? Birthday { get; set; }

        public required string Email { get; set; }

        public string? PhotoPath { get; set; }
        [PasswordPropertyText]
        public required string Password { get; set; }


        public static ClientUpdateAdminViewModel ClientUpdateToClient(Client client)
        {
            return new ClientUpdateAdminViewModel()
            {
                Id = client.Id,
                FirstName = client.FirstName,
                FamilyName = client.FamilyName,
                Birthday = client.Birthday,
                Email = client.Email,
                PhotoPath = client.PhotoPath,
                Password = client.Password
            };
            
        }

        
    }
}
