using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TRACKEXPENSES.Server.Data;
using TRACKEXPENSES.Server.Models;

namespace TRACKEXPENSES.Server.Controllers
{

    [ApiController]
    public class AdministrationController(RoleManager<IdentityRole> roleManager, UserManager<Users> userManager, FinancasDbContext context) : ControllerBase
    {
        private readonly RoleManager<IdentityRole> _roleManager = roleManager;
        private readonly UserManager<Users> _userManager = userManager;
        private readonly FinancasDbContext _context = context;

        [Route("api/Users/getAllUsers")]
        [HttpGet]
        public IActionResult ListClients()
        {
            var allClients = _context.Clients.Include(client => client.GroupOfUsers).ToList();
            if (allClients == null) return BadRequest("Dados inválidos.");

            return Ok(allClients);
        }
    }
}
