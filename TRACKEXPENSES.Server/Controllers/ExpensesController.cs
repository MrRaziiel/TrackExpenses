using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TRACKEXPENSES.Server.Data;
using TRACKEXPENSES.Server.Models;
using TRACKEXPENSES.Server.ViewModels;

namespace TRACKEXPENSES.Server.Controllers
{
    [ApiController]
    [Route("api/Expenses")]
    public class ExpensesController(RoleManager<IdentityRole> roleManager, UserManager<User> userManager, FinancasDbContext context, IWebHostEnvironment webHostEnvironment) : ControllerBase
    {
        private readonly RoleManager<IdentityRole> _roleManager = roleManager;
        private readonly UserManager<User> _userManager = userManager;
        private readonly FinancasDbContext _context = context;

        [HttpGet("GetUserListExpenses")]
        public async Task<IActionResult> GetUserListExpenses([FromQuery] string id)
        {
            if (id == null) return NotFound("No id entered");

            var client = _context?.Users.Include(client => client.Expenses).FirstOrDefault(userToFind => userToFind.Id == id);
            if (client == null ) return NotFound("No Client not found");

            return Ok(new { expenses = client.Expenses});
        }

        //[HttpGet("CreateExpenses")]

        //public async Task<IActionResult> CreateExpense([FromBody] CreateExpenseViewModel expense)
        //{
        //    if (id == null) return NotFound("No id entered");

        //    var client = _context?.Users.Include(client => client.Expenses).FirstOrDefault(userToFind => userToFind.Id == id);

        //    if (client == null) return NotFound("No Client not found");



        //    return Ok(new { expenses = client.Expenses });
        //}
    }
}
