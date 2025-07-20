using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Drawing;
using System.Text.Json;
using TRACKEXPENSES.Server.Data;
using TRACKEXPENSES.Server.Models;
using TRACKEXPENSES.Server.ViewModels;
using IronBarCode;


namespace TRACKEXPENSES.Server.Controllers
{
    [ApiController]
    [Route("api/Expenses")]
    public class ExpensesController(FinancasDbContext context) : ControllerBase
    {

        private readonly FinancasDbContext _context = context;

        [HttpPost("CreateExpensesWithImage")]
        public async Task<IActionResult> CreateExpensesWithImage(
   [FromForm] ExpenseCreateRequestViewModel request,
   IFormFile? image,
   [FromForm] string? uploadType)
        {
            if (request == null || string.IsNullOrEmpty(request.UserEmail))
                return BadRequest("Missing expense data or user email.");

            var user = await context.Users.FirstOrDefaultAsync(u => u.Email == request.UserEmail);
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

            if (image != null && !string.IsNullOrEmpty(uploadType))
            {
                var extension = Path.GetExtension(image.FileName);
                if (string.IsNullOrWhiteSpace(extension))
                    return BadRequest("File must have an extension.");

                var folderPath = Path.Combine("Images", "Users", "Expenses", expenseId);
                var rootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", folderPath);
                Directory.CreateDirectory(rootPath);

                var targetInstanceId = instances.First().Id;
                var fileName = targetInstanceId + extension;
                var fullPath = Path.Combine(rootPath, fileName);
                var relativePath = Path.Combine(folderPath, fileName).Replace("\\", "/");

                var imageDb = new ImageDB
                {
                    Id = targetInstanceId,
                    Name = relativePath,
                    Extension = extension
                };

                using (var stream = new FileStream(fullPath, FileMode.Create))
                {
                    await image.CopyToAsync(stream);
                }

                await context.ImagesDB.AddAsync(imageDb);

                expense.ImageId = imageDb.Id;
            }

            await context.Expenses.AddAsync(expense);
            await context.ExpenseInstances.AddRangeAsync(instances);
            await context.SaveChangesAsync();

            return Ok(new { ExpenseId = expense.Id, Instances = instances.Count });
        }


        [HttpPost("ParseQrImage")]
        public async Task<IActionResult> ParseQrImage()
        {
            var file = Request.Form.Files.FirstOrDefault();
            if (file == null || file.Length == 0)
                return BadRequest("Invalid image");

            try
            {
                using var ms = new MemoryStream();
                await file.CopyToAsync(ms);
                ms.Position = 0;

                var results = BarcodeReader.Read(ms);

                if (results == null || string.IsNullOrWhiteSpace(results[0].Value))
                    return BadRequest("QR not recognized or invalid format");

                var parsed = JsonSerializer.Deserialize<ExpenseCreateRequestViewModel>(results[0].Value);
                if (parsed == null)
                    return BadRequest("Failed to parse QR data.");

                parsed.Periodicity = "OneTime";
                parsed.RepeatCount = 1;
                parsed.EndDate = null;

                return Ok(parsed);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Failed to read QR: " + ex.Message);
            }
        }


        [HttpGet("ListExpenses")]
        public async Task<IActionResult> ListExpenses([FromQuery] string userEmail)
        {
            try
            {
                var user = await context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
                if (user == null) return NotFound("User not found.");

                var expenses = await context.Expenses
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
            var expense = await context.Expenses
                .Include(e => e.Instances)
                .FirstOrDefaultAsync(e => e.Id == request.Id);

            if (expense == null) return NotFound();

            context.ExpenseInstances.RemoveRange(expense.Instances);
            context.Expenses.Remove(expense);

            await context.SaveChangesAsync();
            return Ok();
        }


        [HttpGet("GetFutureExpenseDates")]
        public async Task<IActionResult> GetFutureExpenseDates([FromQuery] string email)
        {
            var user = await context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null) return NotFound();

            var futureInstances = await context.ExpenseInstances
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

        [HttpGet("GetExpenseById/{id}")]
        public async Task<IActionResult> GetExpenseById(string id)
        {
            var expense = await context.Expenses
                .Include(e => e.Instances)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (expense == null)
                return NotFound("Expense not found.");

            return Ok(expense);
        }

        [HttpPut("UpdateExpense")]
        public async Task<IActionResult> UpdateExpense([FromBody] Expense updated)
        {
            if (updated == null || string.IsNullOrEmpty(updated.Id))
                return BadRequest("Invalid data.");

            var existing = await context.Expenses
                .Include(e => e.Instances)
                .FirstOrDefaultAsync(e => e.Id == updated.Id);

            if (existing == null)
                return NotFound("Expense not found.");

            // Atualiza os campos principais
            existing.Name = updated.Name;
            existing.Description = updated.Description;
            existing.Value = updated.Value;
            existing.PayAmount = updated.PayAmount;
            existing.StartDate = updated.StartDate;
            existing.EndDate = updated.EndDate;
            existing.RepeatCount = updated.RepeatCount;
            existing.ShouldNotify = updated.ShouldNotify;
            existing.Periodicity = updated.Periodicity;
            existing.Category = updated.Category;
            existing.GroupId = updated.GroupId;

            // Recria as instâncias com valor proporcional
            context.ExpenseInstances.RemoveRange(existing.Instances);

            int count = existing.RepeatCount ?? (existing.Periodicity == "Endless" ? 60 : 1);
            var current = existing.StartDate;
            var instanceValue = Math.Round(existing.Value / count, 2);
            var remainingToPay = existing.PayAmount ?? 0;

            var newInstances = new List<ExpenseInstance>();

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

                var inst = new ExpenseInstance
                {
                    Id = Guid.NewGuid().ToString(),
                    ExpenseId = existing.Id,
                    DueDate = current,
                    Value = instanceValue,
                    PaidAmount = paidAmount,
                    IsPaid = paidAmount >= instanceValue
                };

                newInstances.Add(inst);

                current = existing.Periodicity switch
                {
                    "Daily" => current.AddDays(1),
                    "Weekly" => current.AddDays(7),
                    "Monthly" => current.AddMonths(1),
                    "Yearly" => current.AddYears(1),
                    _ => current
                };
            }

            await context.ExpenseInstances.AddRangeAsync(newInstances);
            await context.SaveChangesAsync();

            return Ok();
        }


        [HttpPatch("MarkAsPaid/{instanceId}")]
        public async Task<IActionResult> MarkAsPaid(string instanceId)
        {
            var instance = await context.ExpenseInstances.FindAsync(instanceId);
            if (instance == null)
                return NotFound("Instance not found.");

            instance.IsPaid = true;
            await context.SaveChangesAsync();

            return Ok("Marked as paid.");
        }

        [HttpGet("GetExpenseWithInstances")]
        public async Task<IActionResult> GetExpenseWithInstances(string id)
        {
            var expense = await context.Expenses
                .Include(e => e.Instances)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (expense == null)
                return NotFound();

            return Ok(expense);
        }


        [HttpGet("GetExpenseInstanceById")]
        public async Task<IActionResult> GetExpenseInstanceById(string id)
        {
            var instance = await context.ExpenseInstances
                .Include(e => e.Image) // opcional
                .FirstOrDefaultAsync(e => e.Id == id);

            if (instance == null)
                return NotFound();

            return Ok(instance);
        }
        [HttpPost("UpdateExpenseInstance")]
        public async Task<IActionResult> UpdateExpenseInstance([FromBody] ExpenseInstance updatedInstance)
        {
            var instance = await context.ExpenseInstances.FindAsync(updatedInstance.Id);
            if (instance == null)
                return NotFound();

            instance.DueDate = updatedInstance.DueDate;
            instance.IsPaid = updatedInstance.IsPaid;

            // Se quiser permitir atualização de valor (caso esse campo exista na instância)
            if (updatedInstance.GetType().GetProperty("Value") != null)
            {
                var value = updatedInstance.GetType().GetProperty("Value")?.GetValue(updatedInstance);
                instance.GetType().GetProperty("Value")?.SetValue(instance, value);
            }

            await context.SaveChangesAsync();

            return Ok(instance);
        }

        private List<ExpenseInstance> GenerateExpenseInstances(Expense expense)
        {
            var instances = new List<ExpenseInstance>();
            var current = expense.StartDate;
            int count = expense.Periodicity == "Endless" ? 60 : expense.RepeatCount ?? 1;

            for (int i = 0; i < count; i++)
            {
                instances.Add(new ExpenseInstance
                {
                    ExpenseId = expense.Id,
                    DueDate = current,
                    IsPaid = false,
                    ImageId = null
                });

                current = expense.Periodicity switch
                {
                    "Daily" => current.AddDays(1),
                    "Weekly" => current.AddDays(7),
                    "Monthly" => current.AddMonths(1),
                    "Yearly" => current.AddYears(1),
                    _ => current
                };
            }

            return instances;
        }
        public class DeleteExpenseRequest
        {
            public string Id { get; set; }
        }

    }
}
