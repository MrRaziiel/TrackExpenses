using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using TrackExpenses.Models;

namespace TrackExpenses.ViewModels
{
    public abstract class ClientViewModel
    {
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

        public string? ProfileImageId { get; set; }
        public string? ProfileImagePath { get; set; }
        [PasswordPropertyText]
        public required string Password { get; set; }

        public virtual void CopyTo(Client updateClient)
        {
            updateClient.FirstName = FirstName;
            updateClient.FamilyName = FamilyName;
            updateClient.Password = Password;
            if (Birthday != default || Birthday != null) updateClient.Birthday = Birthday;
        }
    }

    public class AdminClientUpdateViewModel : ClientViewModel {

        public static AdminClientUpdateViewModel FromClient(Client client)
        {
            return new AdminClientUpdateViewModel()
            {
                Id = client.Id,
                FirstName = client.FirstName,
                FamilyName = client.FamilyName,
                Birthday = client.Birthday,
                Email = client.Email,
                ProfileImageId = client.ProfileImageId,
                Password = client.Password
            };
        }
        //public override void CopyTo(Client updateClient)
        //{
        //    base.CopyTo(updateClient);

        //}
    }

    public class ClientUpdateViewModel : ClientViewModel
    {
        public static ClientUpdateViewModel FromClient(Client client)
        {
            return new ClientUpdateViewModel()
            {
                Id = client.Id,
                FirstName = client.FirstName,
                FamilyName = client.FamilyName,
                Birthday = client.Birthday,
                Email = client.Email,
                ProfileImageId = client.ProfileImageId,
                Password = client.Password
            };
            
        }

    }
}
