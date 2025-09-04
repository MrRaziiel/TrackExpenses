namespace TRACKEXPENSES.Server.Models.Api
{
    public class LoginResponseModel
    {
        public string? Email { get; set; }
        
        public string? AccessToken { get; set; }

        public int ExpiresIn { get; set; }

        public List<string> Roles { get; set; }

        public string? RefreshToken { get; internal set; }
    }
}
