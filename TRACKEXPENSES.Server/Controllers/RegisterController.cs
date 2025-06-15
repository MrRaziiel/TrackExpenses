using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using TRACKEXPENSES.Server.Models;
using TRACKEXPENSES.Server.ViewModels;
using TRACKEXPENSES.Server.Data;
using System.Data;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.Mvc.Formatters;
using Microsoft.EntityFrameworkCore.SqlServer.Query.Internal;
using Microsoft.EntityFrameworkCore;


namespace TRACKEXPENSES.Server.Controllers
{
    //[ApiController]
    [Route("api/auth")]
    public class RegisterController(SignInManager<User> signInManager, UserManager<User> userManager, FinancasDbContext context, IConfiguration configuration) : Controller
    {
        private readonly SignInManager<User> _signInManager = signInManager;
        private readonly UserManager<User> _userManager = userManager;
        private readonly FinancasDbContext _context = context;
        private readonly IConfiguration _configuration = configuration;



        [HttpPost("Register")]
        public async Task<IActionResult> Register([FromBody] RegisterViewModel model)
        {
           //Problems with DATE
            if (!ModelState.IsValid) return BadRequest(ModelState);

            User user = new()
            {

                FirstName = model.FirstName,
                FamilyName = model.FamilyName,
                Email = model.Email,
                UserName = model.Email,
                Password = model.Password,
                PhoneNumber = model.PhoneNumber != null ? model.PhoneNumber : "000000000",
                ProfileImageId = "No_image.jpg",

            };
            try
            {
                if (model.Birthday != null) user.Birthday = model.Birthday;
            }
            catch (Exception ex)
            {
                return BadRequest(ex);
            }


            string role = "";

            if (string.IsNullOrEmpty(model.CodeInvite))
            {

                GroupOfUsers groupOfUsers = new()
                {
                    Name = model.FamilyName,
                    CodeInvite = GenerateCodeGroup()

                };
                role = "GROUPADMINISTRATOR";

                await _context.GroupOfUsers.AddAsync(groupOfUsers);
                user.GroupId = groupOfUsers.Id;
            }
            else
            {
                var group = _context.GroupOfUsers.FirstOrDefault(x => x.CodeInvite == model.CodeInvite);

                if (group == null) return BadRequest("Code Group incorrect");
                string id = group.Id;
                user.GroupId = id;
                role = "USER";

            }
            
            var result = await _userManager.CreateAsync(user, user.Password);
            if (!result.Succeeded) return BadRequest(result.Errors);

            await _context.UsersList.AddAsync(user);
            await _userManager.AddToRoleAsync(user, role);
            await _context.SaveChangesAsync();
            return Ok();
        }

        private static readonly Random random = new();
        private string GenerateCodeGroup()
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            return new string(Enumerable.Repeat(chars, 32)
                .Select(s => s[random.Next(s.Length)]).ToArray());
        }

        [HttpGet("EmailCheckInDb")]
        public async Task<IActionResult> EmailCheckInDb([FromQuery] string email)
        {
            if (string.IsNullOrEmpty(email)) return BadRequest(false);
            var user = await _userManager.FindByNameAsync(email);
            var exists = user != null;
            return Ok(exists);

        }
        [HttpGet("CodeGroupCheckBd")]
        public IActionResult CodeGroupCheckBd([FromQuery] string code)
        {
            if (string.IsNullOrEmpty(code)) return Ok();
            var user = _context?.GroupOfUsers.FirstOrDefault(userToFind => userToFind.CodeInvite == code);
            var exists = user != null;
            return Ok(exists);
        }

        [HttpPost("Login")]
        public async Task<IActionResult> Login([FromBody] LoginViewModel model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var user = await userManager.FindByEmailAsync(model.Email);
            if (user is null)
            {
                return NotFound();
            }

            var result = await signInManager.CheckPasswordSignInAsync(user, model.Password, false);
            if (!result.Succeeded)
            {
                return NotFound();
            }

            var authClaims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, user.UserName),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            };

            var jwtSettings = configuration.GetSection("JwtSettings");
            var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]));
            var expirationTimeInMinutes = 0.0;
            double.TryParse(jwtSettings["ExpirationTimeInMinutes"], out expirationTimeInMinutes);

            var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            expires: DateTime.Now.AddMinutes(expirationTimeInMinutes),
            claims: authClaims,
            signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
            );
            var roleNameResponse = await _userManager.GetRolesAsync(user);
            var roleName = roleNameResponse.IsNullOrEmpty() ? null : roleNameResponse[0];

            return Ok(new
            {
                token = new JwtSecurityTokenHandler().WriteToken(token),
                expiration = token.ValidTo,
                user = new
                {
                    id = user.Id,
                    email = user.Email,
                    role = roleName,
                    path = user.ProfileImageId,
                }
            });

        }
       
    }
}

   



