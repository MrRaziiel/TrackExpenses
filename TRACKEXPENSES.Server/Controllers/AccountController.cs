using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TRACKEXPENSES.Server.Data;
using TRACKEXPENSES.Server.Models;
using TRACKEXPENSES.Server.ViewModels;


namespace TRACKEXPENSES.Server.Controllers
{

    [ApiController]
    [Route("api/User")]
    public class AccountController(RoleManager<IdentityRole> roleManager, UserManager<User> userManager, FinancasDbContext context, IWebHostEnvironment webHostEnvironment) : ControllerBase
    {
        private readonly RoleManager<IdentityRole> _roleManager = roleManager;
        private readonly UserManager<User> _userManager = userManager;
        private readonly FinancasDbContext _context = context;
        private readonly IWebHostEnvironment _webHostEnvironment = webHostEnvironment;

        [HttpGet("GetProfile")]
        public async Task<IActionResult> GetProfile([FromQuery] string UserEmail)
        {
            if (UserEmail == null) return NotFound("No Email entered");

            var existUser = await context.Users.Include(user => user.Expenses).SingleOrDefaultAsync(c => c.Email == UserEmail);
            if (existUser == null) return NotFound("No user found");

          
            return Ok(existUser);
        }

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

        [HttpPost("UploadProfileImage/{id}")]
        public async Task<IActionResult> UploadProfileImage(string id, IFormFile photo)
        {
            var existUser = await context.Users.Include(user => user.Expenses).SingleOrDefaultAsync(c => c.Id == id);
            if (existUser == null) return NotFound("User not found");
            if (photo == null || photo.Length == 0) return BadRequest("Invalid file.");

            var extension = Path.GetExtension(photo.FileName);
            var fileName = id + extension;
            var relativePath = Path.Combine("Images", "Users");
            var folderPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", relativePath);
            var fullPath = Path.Combine(folderPath, fileName);
            var partialPathFile = Path.Combine(relativePath, fileName).Replace("\\", "/");

            Directory.CreateDirectory(folderPath); 

            
            var existPhoto = await context.ImagesDB.SingleOrDefaultAsync(c => c.Name == partialPathFile);
            if (existPhoto != null)
            {
                existPhoto.Extension = extension;
                await using (var stream = new FileStream(fullPath, FileMode.Create))
                {
                    await photo.CopyToAsync(stream);
                }

                context.ImagesDB.Update(existPhoto);
                await context.SaveChangesAsync();

                return Ok(new { partialPath = partialPathFile });
            }

  
            var newImage = new ImageDB
            {
                Name = partialPathFile,
                Extension = extension,

            };

            await using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await photo.CopyToAsync(stream);
            }

            await context.ImagesDB.AddAsync(newImage);
            existUser.ProfileImageId = newImage.Id.ToString(); 
            context.Users.Update(existUser);
            await context.SaveChangesAsync();

            return Ok(new { partialPath = partialPathFile });
        }


        [HttpGet("GetPhotoProfile/{email}")]
        public async Task<IActionResult> GetPhotoProfile(string email)
        {
            if (string.IsNullOrEmpty(email))
                return BadRequest("Invalid user ID");


            var existUser = await context.Users
                .Include(user => user.Expenses)
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

    }
}
