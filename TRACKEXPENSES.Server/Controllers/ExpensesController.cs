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

        [HttpGet("ListExpenses")]
        public async Task<IActionResult> ListExpenses([FromQuery] string userEmail)
        {
            var existUser = context.Users.Include(user => user.Expenses).SingleOrDefault(c => c.Email == userEmail);
            if (existUser == null) return NotFound("User not found");

            var expenses = await _context.Expenses
                .Where(e => e.UserId == existUser.Id)
                .OrderByDescending(e => e.StartDate)
                .ToListAsync();

            return Ok( expenses );
        }

        [HttpPost("CreateExpenses")]
        public async Task<IActionResult> CreateExpenses([FromBody] ExpenseCreateRequestViewModel model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == model.UserEmail);
            if (user == null) return NotFound("User not found");

            var expense = new Expense
            {
                Name = model.Name,
                Description = model.Description,
                Value = model.Value,
                PayAmount = model.PayAmount,
                StartDate = model.StartDate,
                EndDate = model.EndDate,
                RepeatCount = model.RepeatCount,
                ShouldNotify = model.ShouldNotify,
                Periodicity = model.Periodicity,
                Category = model.Category,
                UserId = user.Id,
                GroupId = user.GroupId
            };

            try
            {
                _context.Expenses.Add(expense);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Expense created successfully." });
            }
            catch (Exception ex)
            {
     
                return StatusCode(500, new { message = "Error saving expense", details = ex.Message, inner = ex.InnerException?.Message });
            }
        }
        [HttpGet("GetFutureExpenseDates")]
        public async Task<IActionResult> GetFutureExpenseDates([FromQuery] string email)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null)
                return NotFound("User not found");

            var expenses = await _context.Expenses
                .Where(e => e.UserId == user.Id)
                .ToListAsync();

            var allDates = new List<object>();

            foreach (var expense in expenses)
            {
                if (expense.StartDate == null) continue;

                var dates = new List<DateTime>();
                var current = expense.StartDate;
                int repeat = expense.RepeatCount ?? 1;

                for (int i = 0; i < repeat; i++)
                {
                    dates.Add(current);

                    switch (expense.Periodicity.ToLower())
                    {
                        case "daily":
                            current = current.AddDays(1);
                            break;
                        case "weekly":
                            current = current.AddDays(7);
                            break;
                        case "monthly":
                            current = current.AddMonths(1);
                            break;
                        case "yearly":
                            current = current.AddYears(1);
                            break;
                        case "onetime":
                        default:
                            i = repeat; // stop immediately
                            break;
                    }
                }

                foreach (var date in dates)
                {
                    allDates.Add(new
                    {
                        expense.Id,
                        expense.Name,
                        expense.Value,
                        Date = date,
                        expense.Category
                    });
                }
            }

            return Ok(allDates);
        }

    }

}
