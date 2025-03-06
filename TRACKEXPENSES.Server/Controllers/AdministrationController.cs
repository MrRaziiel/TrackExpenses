using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TRACKEXPENSES.Server.Data;
using TRACKEXPENSES.Server.Models;

namespace TRACKEXPENSES.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdministrationController : ControllerBase
    {
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly UserManager<Client> _userManager;
        private readonly FinancasDbContext _context;


        public AdministrationController(RoleManager<IdentityRole> roleManager, UserManager<Client> userManager, FinancasDbContext context)
        {
            _roleManager = roleManager;
            _userManager = userManager;
            _context = context;
        }

        [HttpGet]

        public IActionResult ListClients()
        {
            var allClients = _context.Clients.Include(client => client.GroupOfClients).ToList();
            if (allClients == null) return BadRequest("Dados inválidos.");

            return Ok(allClients);


        }
    }
}
