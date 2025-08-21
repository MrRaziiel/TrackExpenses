using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TRACKEXPENSES.Server.Data;
using TRACKEXPENSES.Server.Models;
using TRACKEXPENSES.Server.Models.Api;
using TRACKEXPENSES.Server.ViewModels;
using TRACKEXPENSES.Server.Handlers;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using System.Text;


namespace TRACKEXPENSES.Server.Services
{
    public class JwtService
    {

        private readonly FinancasDbContext _dbcontext;
        private readonly IConfiguration _configuration;
        private readonly UserManager<User> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;

        public JwtService(FinancasDbContext dbContext, IConfiguration configuration, UserManager<User> userManager, RoleManager<IdentityRole> roleManager)
        {
            _dbcontext = dbContext;
            _configuration = configuration;
            _userManager = userManager;
            _roleManager = roleManager;
        }

        public async Task<LoginResponseModel?> Authenticate(LoginViewModel request)
        {
            if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password)) 
                return null;

            var userAccount = await _dbcontext.Users.FirstOrDefaultAsync(x => x.Email == request.Email);
            
            if (userAccount is null || !PasswordHashHandler.VerifyPassword(request.Password, userAccount.Password!))
             return null;

            var roleNameResponse = await _userManager.GetRolesAsync(userAccount);
            var roleName = roleNameResponse.IsNullOrEmpty() ? null : roleNameResponse[0];

            var issuer = _configuration["JwtSettings:Issuer"];
            var audience = _configuration["JwtSettings:Audience"];
            var key = _configuration["JwtSettings:SecretKey"];
            var tokenValidityMin = _configuration.GetValue<int>("JwtSettings:AccessTokenExpirationMinutes");
            var tokenExpiryTimeStamp = DateTime.UtcNow.AddMinutes(tokenValidityMin);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.Email, request.Email),              
                new Claim(ClaimTypes.NameIdentifier, userAccount.Id),  
                new Claim(ClaimTypes.Role, roleName ?? "User")          
            }),
                Expires = tokenExpiryTimeStamp,
                Issuer = issuer,
                Audience = audience,
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(Encoding.ASCII.GetBytes(key)),
                SecurityAlgorithms.HmacSha512Signature),
            };

            var tokenHandler = new JwtSecurityTokenHandler();
       
            var securityToken = tokenHandler.CreateToken(tokenDescriptor);
            var accessToken = tokenHandler.WriteToken(securityToken);


            return new LoginResponseModel
            {
                AccessToken = accessToken,
                Email = request.Email,
                Role = roleName,
                ExpiresIn = (int)tokenExpiryTimeStamp.Subtract(DateTime.UtcNow).TotalSeconds
            };
   
        }
    }
}
