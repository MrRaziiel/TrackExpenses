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
    public class AccountController(RoleManager<IdentityRole> roleManager, UserManager<User> userManager, FinancasDbContext context) : ControllerBase
    {
        private readonly RoleManager<IdentityRole> _roleManager = roleManager;
        private readonly UserManager<User> _userManager = userManager;
        private readonly FinancasDbContext _context = context;
    
        [HttpGet("GetProfile")]
        public async Task<IActionResult> GetProfile([FromQuery] string UserEmail)
        {
            if (UserEmail == null) return NotFound("No user found");

            var existUser = await context.Users.Include(user => user.Expenses).SingleOrDefaultAsync(c => c.Email == UserEmail);
            if (existUser == null) return NotFound("No user found");

            var userProfile = UserUpdateViewModel.FromClient(existUser);
          
            return Ok(userProfile);
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

    }
}
