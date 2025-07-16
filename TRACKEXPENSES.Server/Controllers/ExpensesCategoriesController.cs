using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TRACKEXPENSES.Server.Data;
using TRACKEXPENSES.Server.Models;
using TRACKEXPENSES.Server.ViewModels;

namespace TRACKEXPENSES.Server.Controllers
{
    [ApiController]
    [Route("api/Categories")]
    public class ExpensesCategoriesController(RoleManager<IdentityRole> roleManager, UserManager<User> userManager, FinancasDbContext context, IWebHostEnvironment webHostEnvironment) : ControllerBase
    {
        private readonly RoleManager<IdentityRole> _roleManager = roleManager;
        private readonly UserManager<User> _userManager = userManager;
        private readonly FinancasDbContext _context = context;


        [HttpPost("Add")]
        public async Task<IActionResult> AddCategory([FromBody] CategoryCreateViewModel newCategory)
        {
            if (string.IsNullOrWhiteSpace(newCategory.Name) || newCategory.UserId.IsNullOrEmpty())
                return BadRequest("Invalid data");

            // Se for subcategoria
            if (!string.IsNullOrEmpty(newCategory.ParentCategory))
            {
                var parent = await _context.ExpenseCategory
                    .FirstOrDefaultAsync(c => c.Name == newCategory.ParentCategory && c.UserId == newCategory.UserId && c.ParentCategoryId == null);

                if (parent == null)
                    return NotFound("Parent category not found");

                var exists = await _context.ExpenseCategory.AnyAsync(c =>
                    c.Name == newCategory.Name && c.ParentCategoryId == parent.Id && c.UserId == newCategory.UserId);

                if (exists)
                    return Conflict("Subcategory already exists");

                var subcategory = new ExpenseCategory
                {
                    Name = newCategory.Name,
                    UserId = newCategory.UserId,
                    ParentCategoryId = parent.Id
                };

                _context.ExpenseCategory.Add(subcategory);
            }
            else
            {
                // Categoria principal
                var exists = await _context.ExpenseCategory.AnyAsync(c =>
                    c.Name == newCategory.Name && c.UserId == newCategory.UserId && c.ParentCategoryId == null);

                if (exists)
                    return Conflict("Category already exists");

                var category = new ExpenseCategory
                {
                    Name = newCategory.Name,
                    UserId = newCategory.UserId
                };

                _context.ExpenseCategory.Add(category);
            }

            var ca = await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpGet("List")]
        public async Task<ActionResult<List<CategoryResponse>>> List([FromQuery] string userEmail)
        {
            if (userEmail.IsNullOrEmpty()) return BadRequest("Invalid userEmail");

            var client = _context?.Users.FirstOrDefault(userToFind => userToFind.Email == userEmail);
            if (client == null) return BadRequest("User not found");

            var categories = await _context.ExpenseCategory
                .Where(c => c.UserId == client.Id)
                .ToListAsync();

            var result = categories
                .Where(c => c.ParentCategoryId == null)
                .Select(c => new CategoryResponse
                {
                    Id = c.Id,
                    Name = c.Name,
                    Subcategories = categories
                        .Where(sub => sub.ParentCategoryId == c.Id)
                        .Select(sub => new SubcategoryResponse
                        {
                            Id = sub.Id,
                            Name = sub.Name
                        }).ToList()
                }).ToList();

            return Ok(result);
        }
    }
}
