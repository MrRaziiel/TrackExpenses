using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Data;
using TRACKEXPENSES.Server.Data;
using TRACKEXPENSES.Server.Models;
using TRACKEXPENSES.Server.Services;
using TRACKEXPENSES.Server.ViewModels;


namespace TRACKEXPENSES.Server.Controllers
{
    //[ApiController]
    [Route("api/auth")]
    public class RegisterController(SignInManager<User> signInManager, UserManager<User> userManager, FinancasDbContext context, IConfiguration configuration, JwtService jwtService) : Controller
    {
        private readonly SignInManager<User> _signInManager = signInManager;
        private readonly UserManager<User> _userManager = userManager;
        private readonly FinancasDbContext _context = context;
        private readonly IConfiguration _configuration = configuration;
        private readonly JwtService _jwtService = jwtService;




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
                Birthday = model.Birthday != null ? model.Birthday : DateTime.Now,

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
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginViewModel model)
        {
            var result2 = await _jwtService.Authenticate(model);
            if (result2 == null)
                return Unauthorized();

            return Ok(result2);

        }

        [Authorize]
        [HttpGet]
        public IActionResult AuthenticatedOnlyEndpoint()
        {
            return Ok("You are authenticated!");
        }
       
    }
}

   



