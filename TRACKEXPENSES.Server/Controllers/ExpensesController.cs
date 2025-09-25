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
            if (request == null || string.IsNullOrWhiteSpace(request.UserEmail))
                return BadRequest("Missing expense data or user email.");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.UserEmail);
            if (user == null) return NotFound("User not found.");

            if (string.IsNullOrWhiteSpace(request.WalletId))
                return BadRequest("Wallet is required.");

            var wallet = await _context.Wallets.FirstOrDefaultAsync(w => w.Id == request.WalletId);
            if (wallet == null)
                return BadRequest("Wallet not found.");

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
                UserId = user.Id,
                WalletId = wallet.Id
            };

            var periodicity = request.Periodicity ?? "OneTime";
            int count =
                periodicity == "OneTime" ? 1 :
                (request.RepeatCount.HasValue && request.RepeatCount.Value > 0) ? request.RepeatCount.Value :
                (periodicity == "Endless" ? 60 : 1);

            if (count <= 0) count = 1;

            var instances = new List<ExpenseInstance>();
            var currentDate = expense.StartDate;

            decimal total = expense.Value;
            decimal instanceValue = count > 0 ? Math.Round(total / count, 2, MidpointRounding.AwayFromZero) : total;

            decimal remainingToPay = expense.PayAmount ?? 0m;

            for (int i = 0; i < count; i++)
            {
                decimal paidAmount;
                if (remainingToPay >= instanceValue)
                {
                    paidAmount = instanceValue;
                    remainingToPay -= instanceValue;
                }
                else if (remainingToPay > 0)
                {
                    paidAmount = remainingToPay;
                    remainingToPay = 0m;
                }
                else
                {
                    paidAmount = 0m;
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

                currentDate = periodicity switch
                {
                    "Daily" => currentDate.AddDays(1),
                    "Weekly" => currentDate.AddDays(7),
                    "Monthly" => currentDate.AddMonths(1),
                    "Yearly" => currentDate.AddYears(1),
                    "Endless" => currentDate.AddMonths(1),
                    _ => currentDate
                };
            }

            // ===================== IMAGEM (opcional) =====================
            // Guarda caminho relativo no formato:
            // Images/Users/{UserId}/Expenses/{ExpenseId}/{ImageId}.{ext}
            if (request.Image != null && !string.IsNullOrEmpty(request.UploadType))
            {
                var extension = Path.GetExtension(request.Image.FileName);
                if (string.IsNullOrWhiteSpace(extension))
                    return BadRequest("File must have an extension.");

                var relativeDir = Path.Combine("Images", "Users", user.Id, "Expenses", expenseId)
                    .Replace("\\", "/");

                var diskDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", relativeDir);
                Directory.CreateDirectory(diskDir);

                var imageId = Guid.NewGuid().ToString();
                var fileName = imageId + extension;

                var relativePath = Path.Combine(relativeDir, fileName).Replace("\\", "/");
                var fullPath = Path.Combine(diskDir, fileName);

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

            // ===================== PERSISTÊNCIA =====================
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
                .Include(e => e.Image)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (instance == null)
                return NotFound();

            return Ok(instance);
        }

        public sealed class UpdateExpenseInstanceRequest
        {
            public string Id { get; set; } = default!;
            public DateTime DueDate { get; set; }
            public bool IsPaid { get; set; }
            public decimal? Value { get; set; }
            public decimal? PaidAmount { get; set; }
            public DateTime? PaidDate { get; set; }
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

            if (updated.PaidAmount.HasValue)
                instance.PaidAmount = updated.PaidAmount.Value;

            instance.PaidDate = updated.PaidDate ?? (updated.IsPaid ? DateTime.UtcNow : null);

            await _context.SaveChangesAsync();
            return Ok(new
            {
                instance.Id,
                instance.DueDate,
                instance.IsPaid,
                instance.Value,
                instance.PaidAmount,
                instance.PaidDate
            });
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

            if (string.IsNullOrEmpty(expense.ImageId) || expense.ImageId == "No_image.jpg")
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

            var userId = expense.UserId;
            if (string.IsNullOrEmpty(userId)) return BadRequest("Expense has no UserId.");

            var extension = Path.GetExtension(Image.FileName);
            if (string.IsNullOrWhiteSpace(extension))
                return BadRequest("File must have an extension.");

            // remover imagem anterior se existir
            if (!string.IsNullOrEmpty(expense.ImageId))
            {
                var existing = await _context.ImagesDB.FirstOrDefaultAsync(i => i.Id == expense.ImageId);
                if (existing != null)
                {
                    var oldFullPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot",
                        existing.Name.Replace("/", Path.DirectorySeparatorChar.ToString()));
                    if (System.IO.File.Exists(oldFullPath))
                    {
                        System.IO.File.Delete(oldFullPath);
                    }
                    _context.ImagesDB.Remove(existing);
                }
            }

            var imageId = Guid.NewGuid().ToString();
            var fileName = imageId + extension;

            var relativeDir = Path.Combine("Images", "Users", userId, "Expenses", expenseId).Replace("\\", "/");
            var relativePath = Path.Combine(relativeDir, fileName).Replace("\\", "/");

            var diskDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", relativeDir);
            Directory.CreateDirectory(diskDir);
            var fullPath = Path.Combine(diskDir, fileName);

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

        [HttpGet("InstancesByExpense/{expenseId}")]
        public async Task<IActionResult> InstancesByExpense(string expenseId)
        {
            var list = await _context.ExpenseInstances
                .Include(i => i.Image)
                .Where(i => i.ExpenseId == expenseId)
                .OrderBy(i => i.DueDate)
                .Select(i => new
                {
                    i.Id,
                    i.DueDate,
                    i.Value,
                    i.IsPaid,
                    i.PaidAmount,
                    i.PaidDate,
                    imagePath = i.Image != null ? i.Image.Name : null
                })
                .ToListAsync();

            return Ok(list);
        }

        [HttpPost("Instance/UploadImage/{instanceId}")]
        public async Task<IActionResult> UploadInstanceImage(string instanceId, IFormFile image)
        {
            if (string.IsNullOrWhiteSpace(instanceId) || image == null)
                return BadRequest("Invalid input");

            var inst = await _context.ExpenseInstances
                .Include(i => i.Expense)
                .FirstOrDefaultAsync(i => i.Id == instanceId);

            if (inst == null) return NotFound("Instance not found");
            if (inst.Expense == null) return BadRequest("Instance has no parent expense.");

            var userId = inst.Expense.UserId;
            if (string.IsNullOrEmpty(userId)) return BadRequest("Expense has no UserId.");

            var extension = Path.GetExtension(image.FileName);
            if (string.IsNullOrWhiteSpace(extension))
                return BadRequest("File must have an extension.");

            // remover imagem anterior se existir
            if (!string.IsNullOrEmpty(inst.ImageId))
            {
                var existing = await _context.ImagesDB.FirstOrDefaultAsync(i => i.Id == inst.ImageId);
                if (existing != null)
                {
                    var oldFullPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot",
                        existing.Name.Replace("/", Path.DirectorySeparatorChar.ToString()));
                    if (System.IO.File.Exists(oldFullPath))
                    {
                        System.IO.File.Delete(oldFullPath);
                    }
                    _context.ImagesDB.Remove(existing);
                }
            }

            var imageId = Guid.NewGuid().ToString();
            var fileName = imageId + extension;

            var relativeDir = Path.Combine("Images", "Users", userId, "Expenses", inst.ExpenseId, inst.Id)
                .Replace("\\", "/");
            var relativePath = Path.Combine(relativeDir, fileName).Replace("\\", "/");

            var diskDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", relativeDir);
            Directory.CreateDirectory(diskDir);
            var fullPath = Path.Combine(diskDir, fileName);

            await using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await image.CopyToAsync(stream);
            }

            var imageDb = new ImageDB
            {
                Id = imageId,
                Name = relativePath,
                Extension = extension
            };

            _context.ImagesDB.Add(imageDb);
            inst.ImageId = imageDb.Id;

            await _context.SaveChangesAsync();
            return Ok(new { imagePath = imageDb.Name });
        }
    }
}
