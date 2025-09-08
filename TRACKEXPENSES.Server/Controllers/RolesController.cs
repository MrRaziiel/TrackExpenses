using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using TRACKEXPENSES.Server.Data;
using TRACKEXPENSES.Server.Models;
using TRACKEXPENSES.Server.Requests.User;
using Microsoft.EntityFrameworkCore;


namespace TRACKEXPENSES.Server.Controllers
{


    [ApiController]
    [Route("api/RolesController")]
    public class RolesController(RoleManager<IdentityRole> roleManager, UserManager<User> userManager, FinancasDbContext context) : ControllerBase
    {
        private readonly RoleManager<IdentityRole> _roleManager = roleManager;
        private readonly UserManager<User> _userManager = userManager;
        private readonly FinancasDbContext _context = context;


        [HttpPost("UserRoles")]
        public async Task<IActionResult> ListUserRoles([FromBody] UserEmailRequest request)
        {
            var userEmail = request.UserEmail;
            if (userEmail == null) return NotFound("No user found");

            var existUser = context.Users.SingleOrDefault(c => c.Email == userEmail);
            if (existUser == null) return NotFound("No user found");
            var addRoleToUserResponse = await _userManager.GetRolesAsync(existUser);

            if (addRoleToUserResponse == null) return NotFound("Roles not found");

            return Ok(new { Roles = addRoleToUserResponse });

        }

    }
}
