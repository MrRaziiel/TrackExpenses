using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TRACKEXPENSES.Server.Data;
using TRACKEXPENSES.Server.Models;

namespace TRACKEXPENSES.Server.Controllers
{

    [ApiController]
    [Route("api/Administrator")]
    [Authorize(Roles = "ADMINISTRATOR")]
    public class AdministrationController(RoleManager<IdentityRole> roleManager, UserManager<User> userManager, FinancasDbContext context) : ControllerBase
    {
        private readonly RoleManager<IdentityRole> _roleManager = roleManager;
        private readonly UserManager<User> _userManager = userManager;
        private readonly FinancasDbContext _context = context;

        [HttpGet("User/GetAllUsers")]
        public IActionResult ListClients()
        {
            var allClients = _context.UsersList.Include(client => client.GroupOfUsers).ToList();
            if (allClients == null) return BadRequest("Dados inválidos.");

            return Ok(new { ListUsers = allClients});
        }

        [HttpPost("User/DeleteUser")]
        public async Task<IActionResult> DeleteUser([FromBody] string UserID)
        {

            if (UserID == null) return NotFound("No user found");

            var existUser = context.Users.Include(user => user.Expenses).SingleOrDefault(c => c.Id == UserID);
            if (existUser == null) return NotFound("No user found");
            if (existUser.Expenses.Count > 0)
            {
                foreach (var clientExpense in existUser.Expenses)
                {
                    var bdExpense = _context.Expenses.FirstOrDefault(exp => exp.Id == clientExpense.Id);
                    if (bdExpense != null)
                    {
                        context.Expenses.Remove(bdExpense);
                    }

                }
                await context.SaveChangesAsync();
            }
            context.Users.Remove(existUser);
            var removeUserResponse = await context.SaveChangesAsync();
            return Ok("User Deleted");

        }

        [HttpGet("GetAllGroupsNames")]
        public IActionResult GetAllGroupsNames()
        {
            var groupNames = _context.GroupOfUsers.ToList();

            return Ok(new { GroupNames = groupNames });
        }

    }
}
