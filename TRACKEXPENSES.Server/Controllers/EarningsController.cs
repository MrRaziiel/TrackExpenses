using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TRACKEXPENSES.Server.Data;
using TRACKEXPENSES.Server.Models;
using TRACKEXPENSES.Server.ViewModels;

namespace TRACKEXPENSES.Server.Controllers
{
    [ApiController]
    [Route("api/Earnings")]
    public class EarningsController(FinancasDbContext context, UserManager<User> userManager) : ControllerBase
    {
        private readonly FinancasDbContext _context = context;
        private readonly UserManager<User> _userManager = userManager;

        [HttpPost("Create")]
        public async Task<IActionResult> Create(AddEarningsViewModel model)
        {
            var existUser = await _context.Users
                .SingleOrDefaultAsync(c => c.Email == model.UserEmail);
            if (existUser == null) return NotFound("User not found");

            Earning earning = new Earning()
            {
                Name = model.Name,
                Amount = model.Amount,
                Date = model.Date,
                Category = model.Category,
                UserId = existUser.Id,
                Periodicity = model.Periodicity,
                RepeatCount = model.RepeatCount,
                IsActive = model.IsActive
            };
  

            _context.Earnings.Add(earning);
            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpPut("Update")]
        public async Task<IActionResult> Update(Earning model)
        {
            var earning = await _context.Earnings.FindAsync(model.Id);
            if (earning == null) return NotFound();

            earning.Name = model.Name;
            earning.Amount = model.Amount;
            earning.Date = model.Date;
            earning.Category = model.Category;

            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpDelete("Delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var earning = await _context.Earnings.FindAsync(id);
            if (earning == null) return NotFound();

            _context.Earnings.Remove(earning);
            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpGet("GetByUser")]
        public async Task<IActionResult> GetByUser(string email)
        {
            var existUser = await context.Users
                .SingleOrDefaultAsync(c => c.Email == email);
            if (existUser == null) return NotFound("User not found");

            var earnings = await _context.Earnings
                .Where(e => e.UserId == existUser.Id)
                .ToListAsync();

            return Ok(earnings);
        }
    }
}