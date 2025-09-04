using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using TRACKEXPENSES.Server.Data;
using TRACKEXPENSES.Server.Models;
using TRACKEXPENSES.Server.Requests.User;

namespace TRACKEXPENSES.Server.Controllers
{

    [ApiController]
    [Route("api/Premium")]
    public class PremiumController(RoleManager<IdentityRole> roleManager, UserManager<User> userManager, FinancasDbContext context) : ControllerBase
    {
        private readonly RoleManager<IdentityRole> _roleManager = roleManager;
        private readonly UserManager<User> _userManager = userManager;
        private readonly FinancasDbContext _context = context;

        [HttpPost("Subscribe")]
        [Authorize]
        public async Task<IActionResult> Subscribe([FromBody] UserEmailRequest request)
        {
            var userEmail = request.UserEmail;

            if (userEmail == null) return NotFound("No user found");

            var existUser = context.Users.SingleOrDefault(c => c.Email.Contains(userEmail));
            if (existUser == null) return NotFound("No user found");

            var listRoles = await userManager.GetRolesAsync(existUser);
            var role = listRoles.FirstOrDefault(c => c == "PREMIUM");

            if (role != null) return UnprocessableEntity("User is already PREMIUM");

            var addRoleToUserResponse = await userManager.AddToRoleAsync(existUser, "PREMIUM");

            if (!addRoleToUserResponse.Succeeded) return NotFound("Error to change to premium");

            var isSave = _context.SaveChangesAsync();
            
            return Created();

        }

        [HttpPost("Cancel")]
        
        public async Task<IActionResult> Cancel([FromBody] UserEmailRequest request)
        {
            var userEmail = request.UserEmail;

            if (userEmail == null) return NotFound("No user found");

            var existUser = context.Users.SingleOrDefault(c => c.Email.Contains(userEmail));
            if (existUser == null) return NotFound("No user found");

            var listRoles = await userManager.GetRolesAsync(existUser);
            var role = listRoles.Where(c => c == "PREMIUM");
            if (role == null) return UnprocessableEntity("User is already not PREMIUM");

            var addRoleToUserResponse = await userManager.RemoveFromRolesAsync(existUser, role);

            if (!addRoleToUserResponse.Succeeded) return NotFound("Error to change to premium");

            return Created();

        }


    }
}
