using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TRACKEXPENSES.Server.Data;
using TRACKEXPENSES.Server.Models;
using TRACKEXPENSES.Server.ViewModels;
using Microsoft.AspNetCore.Http;

namespace TRACKEXPENSES.Server.Controllers
{
    [ApiController]
    [Route("api/Expenses")]
    public class ExpensesController(FinancasDbContext context) : ControllerBase
    {
        private readonly FinancasDbContext _context = context;

        [HttpPost("CreateExpensesWithImage")]
        [Consumes("multipart/form-data")]

        public async Task<IActionResult> CreateExpensesWithImage([FromForm] ExpenseCreateRequestViewModel request)
        {
            if (request == null || string.IsNullOrEmpty(request.UserEmail))
                return BadRequest("Missing expense data or user email.");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.UserEmail);
            if (user == null) return NotFound("User not found.");

            var expenseId = Guid.NewGuid().ToString();

            var expense = new Expense
            {
                Id = expenseId,
                Name = request.Name,
                Description = request.Description,
                Value = request.Value,
                PayAmount = request.PayAmount,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                RepeatCount = request.RepeatCount,
                ShouldNotify = request.ShouldNotify,
                Periodicity = request.Periodicity,
                Category = request.Category,
                UserId = user.Id
            };

            var instances = new List<ExpenseInstance>();
            int count = expense.RepeatCount ?? (expense.Periodicity == "Endless" ? 60 : 1);
            var currentDate = expense.StartDate;

            decimal instanceValue = Math.Round(expense.Value / count, 2);
            decimal remainingToPay = expense.PayAmount ?? 0;

            for (int i = 0; i < count; i++)
            {
                decimal paidAmount = 0;
                if (remainingToPay >= instanceValue)
                {
                    paidAmount = instanceValue;
                    remainingToPay -= instanceValue;
                }
                else if (remainingToPay > 0)
                {
                    paidAmount = remainingToPay;
                    remainingToPay = 0;
                }

                var instance = new ExpenseInstance
                {
                    Id = Guid.NewGuid().ToString(),
                    ExpenseId = expenseId,
                    DueDate = currentDate,
                    Value = instanceValue,
                    PaidAmount = paidAmount,
                    IsPaid = paidAmount >= instanceValue
                };

                instances.Add(instance);

                currentDate = request.Periodicity switch
                {
                    "Daily" => currentDate.AddDays(1),
                    "Weekly" => currentDate.AddDays(7),
                    "Monthly" => currentDate.AddMonths(1),
                    "Yearly" => currentDate.AddYears(1),
                    "Endless" => currentDate.AddMonths(1),
                    _ => currentDate
                };
            }

            // ===== IMAGEM =====
            if (request.Image != null && !string.IsNullOrEmpty(request.UploadType))
            {
                var extension = Path.GetExtension(request.Image.FileName);
                if (string.IsNullOrWhiteSpace(extension))
                    return BadRequest("File must have an extension.");

                var folderPath = Path.Combine("Images", "Users", user.Id, "Expenses");
                var rootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", folderPath);
                Directory.CreateDirectory(rootPath);

                var imageId = Guid.NewGuid().ToString();
                var fileName = imageId + extension;
                var fullPath = Path.Combine(rootPath, fileName);
                var relativePath = Path.Combine(folderPath, fileName).Replace("\\", "/");

                await using (var stream = new FileStream(fullPath, FileMode.Create))
                {
                    await request.Image.CopyToAsync(stream);
                }

                var imageDb = new ImageDB
                {
                    Id = imageId,
                    Name = relativePath,
                    Extension = extension
                };

                await _context.ImagesDB.AddAsync(imageDb);
                expense.ImageId = imageDb.Id;
            }

            await _context.Expenses.AddAsync(expense);
            await _context.ExpenseInstances.AddRangeAsync(instances);
            await _context.SaveChangesAsync();

            return Ok(new { ExpenseId = expense.Id, Instances = instances.Count });
        }


        [HttpGet("ListExpenses")]
        public async Task<IActionResult> ListExpenses([FromQuery] string userEmail)
        {
            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
                if (user == null) return NotFound("User not found.");

                var expenses = await _context.Expenses
                    .Where(e => e.UserId == user.Id)
                    .Include(e => e.Instances)
                    .ToListAsync();

                return Ok(expenses);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Failed to read QR: " + ex.Message);
            }
        }

        [HttpPost("DeleteExpense")]
        public async Task<IActionResult> DeleteExpense([FromBody] DeleteExpenseRequest request)
        {
            if (request.Id == null) return NotFound();

            var expense = await _context.Expenses
                .Include(e => e.Instances)
                .FirstOrDefaultAsync(e => e.Id == request.Id);

            if (expense == null) return NotFound();

            _context.ExpenseInstances.RemoveRange(expense.Instances);
            _context.Expenses.Remove(expense);

            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpGet("GetFutureExpenseDates")]
        public async Task<IActionResult> GetFutureExpenseDates([FromQuery] string email)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null) return NotFound();

            var futureInstances = await _context.ExpenseInstances
                .Include(i => i.Expense)
                .Where(i => i.Expense.UserId == user.Id && i.DueDate >= DateTime.Today)
                .Select(i => new
                {
                    i.DueDate,
                    i.Expense.Name,
                    i.Expense.Category,
                    i.Expense.Value
                })
                .ToListAsync();

            return Ok(futureInstances.Select(x => new
            {
                date = x.DueDate,
                name = x.Name,
                category = x.Category,
                value = x.Value
            }));
        }

        [HttpPut("UpdateExpense")]
        public async Task<IActionResult> UpdateExpense([FromBody] ExpensesEditRequestViewModel updated)
        {
            if (updated == null || string.IsNullOrEmpty(updated.Id))
                return BadRequest("Dados inválidos.");

            var existingExpense = await _context.Expenses
                .Include(e => e.Instances)
                .FirstOrDefaultAsync(e => e.Id == updated.Id);

            if (existingExpense == null)
                return NotFound("Despesa não encontrada.");

            // Atualiza os campos da despesa
            existingExpense.Name = updated.Name;
            existingExpense.Description = updated.Description;
            existingExpense.Value = updated.Value;
            existingExpense.PayAmount = updated.PayAmount;
            existingExpense.StartDate = updated.StartDate;
            existingExpense.EndDate = updated.EndDate;
            existingExpense.RepeatCount = updated.RepeatCount;
            existingExpense.ShouldNotify = updated.ShouldNotify;
            existingExpense.Periodicity = updated.Periodicity;
            existingExpense.Category = updated.Category;
            existingExpense.GroupId = updated.GroupId;

            // Recalcular valores das instâncias (mantendo as datas existentes)
            if (existingExpense.Instances.Any())
            {
                decimal instanceValue;
                if (updated.Periodicity != "Endless" && updated.Periodicity != "OneTime")
                {
                    var count = Math.Max(1, (int)(updated.RepeatCount ?? existingExpense.Instances.Count));
                    var alreadyPaid = existingExpense.PayAmount ?? 0m;
                    instanceValue = Math.Round((updated.Value - alreadyPaid) / count, 2);
                }
                else
                {
                    instanceValue = updated.Value;
                }

                foreach (var inst in existingExpense.Instances.OrderBy(i => i.DueDate))
                {
                    inst.Value = instanceValue;
                    _context.ExpenseInstances.Update(inst);
                }
            }

            _context.Expenses.Update(existingExpense);
            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpPatch("MarkAsPaid/{instanceId}")]
        public async Task<IActionResult> MarkAsPaid(string instanceId)
        {
            var instance = await _context.ExpenseInstances.FindAsync(instanceId);
            if (instance == null)
                return NotFound("Instance not found.");

            instance.IsPaid = true;
            await _context.SaveChangesAsync();

            return Ok("Marked as paid.");
        }

        [HttpGet("GetExpenseWithInstances")]
        public async Task<IActionResult> GetExpenseWithInstances(string id)
        {
            var expense = await _context.Expenses
                .Include(e => e.Instances)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (expense == null)
                return NotFound();

            return Ok(expense);
        }

        [HttpGet("GetExpenseInstanceById")]
        public async Task<IActionResult> GetExpenseInstanceById(string id)
        {
            var instance = await _context.ExpenseInstances
                .Include(e => e.Image) // se tiver FK para ImageDB
                .FirstOrDefaultAsync(e => e.Id == id);

            if (instance == null)
                return NotFound();

            return Ok(instance);
        }

        // DTO para update da instância (limpo)
        public sealed class UpdateExpenseInstanceRequest
        {
            public string Id { get; set; } = default!;
            public DateTime DueDate { get; set; }
            public bool IsPaid { get; set; }
            public decimal? Value { get; set; } // opcional
        }

        [HttpPost("UpdateExpenseInstance")]
        public async Task<IActionResult> UpdateExpenseInstance([FromBody] UpdateExpenseInstanceRequest updated)
        {
            if (updated == null || string.IsNullOrWhiteSpace(updated.Id))
                return BadRequest("Invalid payload.");

            var instance = await _context.ExpenseInstances.FindAsync(updated.Id);
            if (instance == null)
                return NotFound("Instance not found.");

            instance.DueDate = updated.DueDate;
            instance.IsPaid = updated.IsPaid;
            if (updated.Value.HasValue)
                instance.Value = updated.Value.Value;

            await _context.SaveChangesAsync();
            return Ok(instance);
        }

        public class DeleteExpenseRequest
        {
            public string Id { get; set; } = default!;
        }

        [HttpGet("GetExpenseImage/{expenseId}")]
        public async Task<IActionResult> GetExpenseImage(string expenseId)
        {
            if (string.IsNullOrEmpty(expenseId))
                return BadRequest("Invalid expense ID");

            var expense = await _context.Expenses.SingleOrDefaultAsync(e => e.Id == expenseId);
            if (expense == null)
                return NotFound("Expense not found");

            if (expense.ImageId == null || expense.ImageId == "No_image.jpg")
                return Ok(new { imagePath = "NoPhoto" });

            var image = await _context.ImagesDB.SingleOrDefaultAsync(img => img.Id == expense.ImageId);
            if (image == null)
                return Ok(new { imagePath = "NoPhoto" });

            return Ok(new { imagePath = image.Name });
        }

        [HttpPost("UploadImage/{expenseId}")]
        public async Task<IActionResult> UploadImage(string expenseId, IFormFile Image)
        {
            if (string.IsNullOrEmpty(expenseId) || Image == null)
                return BadRequest("Invalid input");

            var expense = await _context.Expenses.FirstOrDefaultAsync(e => e.Id == expenseId);
            if (expense == null) return NotFound("Expense not found");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == expense.UserId);
            if (user == null) return NotFound("User not found");

            var extension = Path.GetExtension(Image.FileName);
            if (string.IsNullOrWhiteSpace(extension))
                return BadRequest("File must have an extension.");

            var folderPath = Path.Combine("Images", "Users", user.Id, "Expenses");
            var rootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", folderPath);
            Directory.CreateDirectory(rootPath);

            string imageId;

            // Se já existe uma imagem, remove a antiga
            if (!string.IsNullOrEmpty(expense.ImageId))
            {
                var existing = await _context.ImagesDB.FirstOrDefaultAsync(i => i.Id == expense.ImageId);
                if (existing != null)
                {
                    var existingPath = Path.Combine("wwwroot", existing.Name.Replace("/", Path.DirectorySeparatorChar.ToString()));
                    if (System.IO.File.Exists(existingPath))
                    {
                        System.IO.File.Delete(existingPath);
                    }
                    _context.ImagesDB.Remove(existing);
                }

                imageId = expense.ImageId;
            }
            else
            {
                imageId = Guid.NewGuid().ToString();
            }

            var fileName = imageId + extension;
            var fullPath = Path.Combine(rootPath, fileName);
            var relativePath = Path.Combine(folderPath, fileName).Replace("\\", "/");

            await using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await Image.CopyToAsync(stream);
            }

            var imageDb = new ImageDB
            {
                Id = imageId,
                Name = relativePath,
                Extension = extension
            };

            _context.ImagesDB.Add(imageDb);
            expense.ImageId = imageDb.Id;

            await _context.SaveChangesAsync();

            return Ok(new { imagePath = imageDb.Name });
        }

        [HttpGet("GetExpenseById/{id}")]
        public async Task<IActionResult> GetExpenseById(string id)
        {
            var expense = await _context.Expenses
                .Include(e => e.Instances)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (expense == null)
                return NotFound("Expense not found.");

            return Ok(expense);
        }
    }
}
