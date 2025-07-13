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
            if (existUser == null) return NotFound();
            if (photo == null || photo.Length == 0)
                return BadRequest("invalid file.");
            
            var extension = Path.GetExtension(photo.FileName);
            var nameFile = id;
            var partialPath = Path.Combine("Images", "Users", nameFile);

            var existPhoto = await context.ImagesDB.SingleOrDefaultAsync(c => c.Name == partialPath);

            if (existPhoto != null)
            {
                existPhoto.Extension = extension;
                _context.Users.Update(existUser);
                await context.SaveChangesAsync();

                return Ok(new { partialPath });

            }

            ImageDB newImage = new(partialPath, extension);

            Directory.CreateDirectory(Path.GetDirectoryName(partialPath));
            using (var stream = new FileStream(partialPath + extension, FileMode.Create))
            {
                await photo.CopyToAsync(stream);
            }
            var saveImage = await context.ImagesDB.AddAsync(newImage);
            if (saveImage == null) NotFound("Error saving photo");
            existUser.ProfileImageId = newImage.Id.ToString();
            context.Users.Update(existUser);
            await context.SaveChangesAsync();

            partialPath = partialPath.Replace("\\", "/");

            return Ok(new { partialPath });






        }

        [HttpGet("GetPhotoProfile/{id}")]
        public async Task<string> GetPhotoProfile(string id)
        {
            if (id == null) return null;

            var existUser = await context.Users.Include(user => user.Expenses).SingleOrDefaultAsync(c => c.Id == id);

            if (existUser == null) return null;


            if (existUser.ProfileImageId == "No_image.jpg") return "NoPhoto";
            
            var imageBd = _context.ImagesDB.SingleOrDefault(imgId => imgId.Id.Equals(existUser.ProfileImageId));

            return imageBd.Name;


        }
                //        var rootPath = Path.Combine("/", "images", "Users");

                //        if (imageBd != null)
                //        {
                //            var nameWithExtensio = imageBd.Name + imageBd.Extension;
                //            model.ProfileImagePath = Path.Combine(rootPath, imageBd.Name, nameWithExtensio);
                //        }
                //        else
                //        {
                //            model.ProfileImagePath = Path.Combine(rootPath, "No_image.jpg");
                //        }
                //    }


                //    return Ok(existUser);
                //}

            }
}
