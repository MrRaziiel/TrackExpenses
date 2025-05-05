using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TRACKEXPENSES.Server.Data;
using TRACKEXPENSES.Server.Models;

namespace TRACKEXPENSES.Server.Controllers
{

    [ApiController]
    public class AdministrationController(RoleManager<IdentityRole> roleManager, UserManager<User> userManager, FinancasDbContext context) : ControllerBase
    {
        private readonly RoleManager<IdentityRole> _roleManager = roleManager;
        private readonly UserManager<User> _userManager = userManager;
        private readonly FinancasDbContext _context = context;

        [Route("api/User/getAllUsers")]
        [HttpGet]
        public IActionResult ListClients()
        {
            var allClients = _context.UsersList.Include(client => client.GroupOfUsers).ToList();
            if (allClients == null) return BadRequest("Dados inválidos.");

            return Ok(allClients);
        }
    }
}
