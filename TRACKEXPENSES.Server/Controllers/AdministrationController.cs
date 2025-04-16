using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TRACKEXPENSES.Server.Data;
using TRACKEXPENSES.Server.Models;

namespace TRACKEXPENSES.Server.Controllers
{
    [Route("api/Clients/getAllClients")]
    [ApiController]
    public class AdministrationController(RoleManager<IdentityRole> roleManager, UserManager<Client> userManager, FinancasDbContext context) : ControllerBase
    {
        private readonly RoleManager<IdentityRole> _roleManager = roleManager;
        private readonly UserManager<Client> _userManager = userManager;
        private readonly FinancasDbContext _context = context;

        [HttpGet]

        public IActionResult ListClients()
        {
            var allClients = _context.Clients.Include(client => client.GroupOfClients).ToList();
            if (allClients == null) return BadRequest("Dados inválidos.");

            return Ok(allClients);


        }
    }
}
