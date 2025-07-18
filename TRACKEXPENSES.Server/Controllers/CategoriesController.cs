using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TRACKEXPENSES.Server.Data;
using TRACKEXPENSES.Server.Models;

namespace TRACKEXPENSES.Server.Controllers
{
    [ApiController]
    [Route("api/Categories")]
    public class CategoriesController(FinancasDbContext context) : ControllerBase
    {
        private readonly FinancasDbContext _context = context;


        [HttpGet("getAllCategories")]
        public async Task<IActionResult> GetAllCategories()
        {
            var categories = await _context.ExpenseCategoryToShow.ToListAsync();
            return Ok(categories);

        }
    

        [HttpGet("GetCategoriesByType")]
        public async Task<IActionResult> GetCategoriesByType([FromQuery] string type)
        {
            if (!Enum.TryParse<CategoryType>(type, true, out var parsedType))
                return BadRequest("Invalid category type");

            var categories = await _context.ExpenseCategoryToShow
                                           .Where(c => c.Type == parsedType)
                                           .ToListAsync();
            return Ok(categories);
        }
    }
}
