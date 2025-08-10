using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TRACKEXPENSES.Server.Data;
using TRACKEXPENSES.Server.Models;
using TRACKEXPENSES.Server.Services;
using TRACKEXPENSES.Server.ViewModels;


namespace TRACKEXPENSES.Server.Controllers
{

    [ApiController]
    [Route("api/User")]
    
    public class AccountController(RoleManager<IdentityRole> roleManager, UserManager<User> userManager, FinancasDbContext context, IWebHostEnvironment webHostEnvironment, SignInManager<User> signInManager, IConfiguration configuration, JwtService jwtService) : Controller
    {
        private readonly RoleManager<IdentityRole> _roleManager = roleManager;
        private readonly UserManager<User> _userManager = userManager;
        private readonly FinancasDbContext _context = context;
        private readonly IWebHostEnvironment _webHostEnvironment = webHostEnvironment;
        private readonly IConfiguration _configuration = configuration;
        private readonly JwtService _jwtService = jwtService;
        private readonly SignInManager<User> _signInManager = signInManager;


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

        [HttpGet("GetProfile")]
        [Authorize]
        public async Task<IActionResult> GetProfile([FromQuery] string UserEmail)
        {
            if (UserEmail == null) return NotFound("No Email entered");

            var existUser = await context.Users.Include(user => user.Expenses).SingleOrDefaultAsync(c => c.Email == UserEmail);
            if (existUser == null) return NotFound("No user found");

          
            return Ok(existUser);
        }

        [Authorize]
        [HttpPut("EditUser")]
        public async Task<IActionResult> EditUser([FromBody] UserUpdateViewModel UserToEdit)
        {

            if (UserToEdit == null) return NotFound("No user found");

            var existUser = await context.Users.Include(user => user.Expenses).SingleOrDefaultAsync(c => c.Email == UserToEdit.Email);
            if (existUser == null) return NotFound("No user found");

            UserToEdit.CopyTo(existUser);
            _context.Users.Update(existUser);
            _context.SaveChanges();
            return Ok("User Updated");

        }

        [Authorize]
        [HttpPost("UploadProfileImage/{id}")]
        public async Task<IActionResult> UploadProfileImage(string id, IFormFile photo)
        {
            if (string.IsNullOrWhiteSpace(id))
                return BadRequest("Invalid user ID.");

            if (photo == null || photo.Length == 0)
                return BadRequest("Invalid file.");

            var user = await context.Users
                .SingleOrDefaultAsync(u => u.Id == id);

            if (user == null)
                return NotFound("User not found");

            var extension = Path.GetExtension(photo.FileName);
            if (string.IsNullOrWhiteSpace(extension))
                return BadRequest("File must have an extension.");

            var folderName = Path.Combine("Images", "Users", id, "Profile");
            var rootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", folderName);
            Directory.CreateDirectory(rootPath); 

            var fileName = id + extension;
            var fullPath = Path.Combine(rootPath, fileName);
            var relativePath = Path.Combine(folderName, fileName).Replace("\\", "/");

            ImageDB imageRecord = null;

            if (!string.IsNullOrEmpty(user.ProfileImageId))
            {
                imageRecord = await context.ImagesDB
                    .SingleOrDefaultAsync(i => i.Id.ToString() == user.ProfileImageId);

                if (imageRecord != null)
                {
                    // Apaga imagem anterior
                    var oldPath = Path.Combine(rootPath, id + imageRecord.Extension);
                    if (System.IO.File.Exists(oldPath))
                        System.IO.File.Delete(oldPath);

                    // Atualiza extensão e nome
                    imageRecord.Extension = extension;
                    imageRecord.Name = relativePath;

                    context.ImagesDB.Update(imageRecord);
                }
            }

            if (imageRecord == null)
            {
                imageRecord = new ImageDB
                {
                    Name = relativePath,
                    Extension = extension
                };

                await context.ImagesDB.AddAsync(imageRecord);
                user.ProfileImageId = imageRecord.Id.ToString();
            }

            // Salva nova imagem no disco
            using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await photo.CopyToAsync(stream);
            }

            context.Users.Update(user);
            await context.SaveChangesAsync();

            return Ok(new { partialPath = relativePath });
        }


        [Authorize]
        [HttpGet("GetPhotoProfile/{email}")]
        public async Task<IActionResult> GetPhotoProfile(string email)
        {
            if (string.IsNullOrEmpty(email))
                return BadRequest("Invalid user ID");


            var existUser = await context.Users
                .SingleOrDefaultAsync(c => c.Email == email);

            if (existUser == null)
                return NotFound("User not found");
            if (existUser.ProfileImageId == "No_image.jpg")
                return Ok(new { photoPath = "NoPhoto" });

            var imageBd = await context.ImagesDB.SingleOrDefaultAsync(imgId => imgId.Id == existUser.ProfileImageId);

            if (imageBd == null)
                return Ok(new { firstName = existUser.FirstName });

            return Ok(new { photoPath = imageBd.Name });
        }

        [Authorize]
        [HttpGet]
        public IActionResult AuthenticatedOnlyEndpoint()
        {
            return Ok("You are authenticated!");
        }

    }
}
