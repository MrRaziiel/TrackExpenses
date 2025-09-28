using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using TRACKEXPENSES.Server.Data;
using TRACKEXPENSES.Server.Models;

namespace TRACKEXPENSES.Server.Controllers
{
    [ApiController]
    [Route("api/Earnings")]
    public class EarningsController(FinancasDbContext context, UserManager<User> userManager, IWebHostEnvironment env) : ControllerBase
    {
        private readonly FinancasDbContext _context = context;
        private readonly UserManager<User> _userManager = userManager;
        private readonly IWebHostEnvironment _env = env;

        private static string RelEarningDir(string userKey, Guid earningId)
            => Path.Combine("Images", "Users", userKey, "Earnings", earningId.ToString()).Replace("\\", "/");
        private static string RelInstanceDir(string userKey, Guid earningId, Guid instanceId)
            => Path.Combine("Images", "Users", userKey, "Earnings", earningId.ToString(), instanceId.ToString()).Replace("\\", "/");
        private string PhysFromRel(string rel)
            => Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), rel.Replace("/", Path.DirectorySeparatorChar.ToString()));

        [HttpGet("ListEarnings")]
        public async Task<IActionResult> ListEarnings([FromQuery] string userEmail, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(userEmail)) return BadRequest("userEmail is required.");
            var list = await _context.Earnings.AsNoTracking()
                .Where(e => e.UserEmail == userEmail)
                .Include(e => e.Instances)
                .OrderByDescending(e => e.Date)
                .ToListAsync(ct);
            return Ok(list);
        }

        [HttpGet("GetById/{id:guid}")]
        public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
        {
            var e = await _context.Earnings.AsNoTracking()
                .Include(x => x.Instances)
                .FirstOrDefaultAsync(x => x.Id == id, ct);
            return e is null ? NotFound() : Ok(e);
        }

        [HttpPost("CreateEarningsWithImage")]
        [RequestSizeLimit(30_000_000)]
        public async Task<IActionResult> Create(CancellationToken ct)
        {
            var form = await Request.ReadFormAsync(ct);

            CreateEarningDto? dto = null;
            if (form.TryGetValue("Earning", out var earningJson) && earningJson.Count > 0)
            {
                try
                {
                    dto = JsonSerializer.Deserialize<CreateEarningDto>(
                        earningJson[0],
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                    );
                }
                catch { /* ignore */ }
            }
            dto ??= new CreateEarningDto
            {
                UserEmail = form["UserEmail"],
                WalletId = form["WalletId"],
                Title = form["Title"],
                Notes = form["Notes"],
                Currency = string.IsNullOrWhiteSpace(form["Currency"]) ? "EUR" : form["Currency"].ToString(),
                Method = string.IsNullOrWhiteSpace(form["Method"]) ? "ONE_OFF" : form["Method"].ToString(),
                Category = string.IsNullOrWhiteSpace(form["Category"]) ? "Other" : form["Category"].ToString(),
                SplitMode = string.IsNullOrWhiteSpace(form["SplitMode"]) ? "SPLIT_TOTAL" : form["SplitMode"].ToString(),
            };

            if (string.IsNullOrWhiteSpace(dto.UserEmail)) return BadRequest("UserEmail is required.");
            if (string.IsNullOrWhiteSpace(dto.WalletId)) return BadRequest("Wallet is required.");

            if (decimal.TryParse(form["Amount"], out var amount)) dto.Amount = amount;
            if (decimal.TryParse(form["PerPeriodAmount"], out var per)) dto.PerPeriodAmount = per;
            if (DateTime.TryParse(form["Date"], out var dt)) dto.Date = dt;
            if (int.TryParse(form["RepeatEvery"], out var re)) dto.RepeatEvery = re;
            if (!string.IsNullOrWhiteSpace(form["RepeatUnit"])) dto.RepeatUnit = form["RepeatUnit"].ToString();
            if (int.TryParse(form["Occurrences"], out var occ)) dto.Occurrences = occ;

            if (!TryValidateModel(dto)) return ValidationProblem(ModelState);

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.UserEmail, ct);
            if (user == null) return NotFound("User not found.");

            var wallet = await _context.Wallets.FirstOrDefaultAsync(w => w.Id == dto.WalletId, ct);
            if (wallet == null) return BadRequest("Wallet not found.");

            var entity = new Earning
            {
                UserEmail = dto.UserEmail,
                UserId = user.Id,
                WalletId = wallet.Id,
                Title = dto.Title,
                Category = string.IsNullOrWhiteSpace(dto.Category) ? "Other" : dto.Category,
                Currency = string.IsNullOrWhiteSpace(dto.Currency) ? "EUR" : dto.Currency,
                Date = dto.Date,
                Notes = dto.Notes,
                Method = string.IsNullOrWhiteSpace(dto.Method) ? "ONE_OFF" : dto.Method,
                RepeatEvery = dto.RepeatEvery,
                RepeatUnit = dto.RepeatUnit,
                Occurrences = dto.Occurrences,
                CreatedAtUtc = DateTime.UtcNow,
                UpdatedAtUtc = DateTime.UtcNow
            };

            // calcular Amount final e instâncias
            var splitMode = (dto.SplitMode ?? "SPLIT_TOTAL").ToUpperInvariant();

            if (entity.Method == "ONE_OFF")
            {
                entity.Amount = dto.Amount;
                _context.Earnings.Add(entity);
                await _context.SaveChangesAsync(ct);

                _context.EarningInstances.Add(new EarningInstance
                {
                    EarningId = entity.Id,
                    ExpectedDate = entity.Date,
                    Amount = entity.Amount
                });
            }
            else
            {
                var occr = entity.Occurrences ?? 1;
                if (occr <= 0) occr = 1;
                var every = entity.RepeatEvery ?? 1;
                var unit = (entity.RepeatUnit ?? "MONTH").ToUpperInvariant();

                decimal perInst;
                if (splitMode == "PER_PERIOD")
                {
                    perInst = dto.PerPeriodAmount ?? dto.Amount;
                    entity.Amount = Math.Round(perInst * occr, 2, MidpointRounding.AwayFromZero);
                }
                else
                {
                    entity.Amount = dto.Amount;
                    perInst = Math.Round(entity.Amount / occr, 2, MidpointRounding.AwayFromZero);
                }

                _context.Earnings.Add(entity);
                await _context.SaveChangesAsync(ct);

                var d = entity.Date;
                decimal remaining = entity.Amount;
                for (int i = 0; i < occr; i++)
                {
                    var value = splitMode == "SPLIT_TOTAL"
                        ? (i == occr - 1 ? remaining : perInst)
                        : perInst;

                    remaining -= value;

                    _context.EarningInstances.Add(new EarningInstance
                    {
                        EarningId = entity.Id,
                        ExpectedDate = d,
                        Amount = value
                    });

                    d = unit switch
                    {
                        "DAY" => d.AddDays(every),
                        "WEEK" => d.AddDays(7 * every),
                        "YEAR" => d.AddYears(every),
                        _ => d.AddMonths(every),
                    };
                }
            }

            await _context.SaveChangesAsync(ct);

            // imagem do earning (com extensão)
            var file = form.Files["ImageFile"] ?? form.Files["Photo"] ?? form.Files["File"];
            if (file != null && file.Length > 0)
            {
                var userKey = entity.UserId ?? entity.UserEmail;

                var ext = Path.GetExtension(file.FileName);
                if (string.IsNullOrWhiteSpace(ext)) ext = ".png";

                var relativeDir = RelEarningDir(userKey, entity.Id);
                var imageId = Guid.NewGuid().ToString();
                var fileName = imageId + ext;
                var relativePath = Path.Combine(relativeDir, fileName).Replace("\\", "/");

                var diskDir = PhysFromRel(relativeDir);
                Directory.CreateDirectory(diskDir);
                var fullPath = Path.Combine(diskDir, fileName);

                await using (var fs = new FileStream(fullPath, FileMode.Create))
                {
                    await file.CopyToAsync(fs, ct);
                }

                entity.ImageUrl = relativePath;
                await _context.SaveChangesAsync(ct);
            }

            return CreatedAtAction(nameof(GetById), new { id = entity.Id }, entity);
        }

        [HttpPut("UpdateEarningWithImage/{id:guid}")]
        [RequestSizeLimit(30_000_000)]
        public async Task<IActionResult> Update(Guid id, CancellationToken ct)
        {
            var e = await _context.Earnings.Include(x => x.Instances).FirstOrDefaultAsync(x => x.Id == id, ct);
            if (e is null) return NotFound();

            var form = await Request.ReadFormAsync(ct);

            UpdateEarningDto? dto = null;
            if (form.TryGetValue("Earning", out var earningJson) && earningJson.Count > 0)
            {
                try
                {
                    dto = JsonSerializer.Deserialize<UpdateEarningDto>(
                        earningJson[0],
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                    );
                }
                catch { /* ignore */ }
            }
            dto ??= new UpdateEarningDto();

            var walletIdStr = form["WalletId"].ToString();
            if (!string.IsNullOrWhiteSpace(walletIdStr)) dto.WalletId = walletIdStr;
            if (!string.IsNullOrWhiteSpace(form["Category"])) dto.Category = form["Category"];
            if (decimal.TryParse(form["Amount"], out var amount)) dto.Amount = amount;
            if (decimal.TryParse(form["PerPeriodAmount"], out var per)) dto.PerPeriodAmount = per;
            if (!string.IsNullOrWhiteSpace(form["Currency"])) dto.Currency = form["Currency"];
            if (DateTime.TryParse(form["Date"], out var date)) dto.Date = date;
            if (!string.IsNullOrWhiteSpace(form["Title"])) dto.Title = form["Title"];
            if (!string.IsNullOrWhiteSpace(form["Notes"])) dto.Notes = form["Notes"];
            if (!string.IsNullOrWhiteSpace(form["Method"])) dto.Method = form["Method"];
            if (int.TryParse(form["RepeatEvery"], out var re)) dto.RepeatEvery = re;
            if (!string.IsNullOrWhiteSpace(form["RepeatUnit"])) dto.RepeatUnit = form["RepeatUnit"].ToString();
            if (int.TryParse(form["Occurrences"], out var occ)) dto.Occurrences = occ;
            if (bool.TryParse(form["RemoveImage"], out var rm)) dto.RemoveImage = rm;
            if (!string.IsNullOrWhiteSpace(form["SplitMode"])) dto.SplitMode = form["SplitMode"];

            if (!string.IsNullOrWhiteSpace(dto.WalletId)) e.WalletId = dto.WalletId;
            if (!string.IsNullOrWhiteSpace(dto.Category)) e.Category = dto.Category!;
            if (dto.Amount.HasValue) e.Amount = dto.Amount.Value;
            if (!string.IsNullOrWhiteSpace(dto.Currency)) e.Currency = dto.Currency!;
            if (dto.Date.HasValue) e.Date = dto.Date.Value;
            if (dto.Title is not null) e.Title = dto.Title;
            if (dto.Notes is not null) e.Notes = dto.Notes;
            if (dto.Method is not null) e.Method = dto.Method;
            if (dto.RepeatEvery.HasValue) e.RepeatEvery = dto.RepeatEvery;
            if (dto.RepeatUnit is not null) e.RepeatUnit = dto.RepeatUnit;
            if (dto.Occurrences.HasValue) e.Occurrences = dto.Occurrences;

            // imagem (com extensão)
            var file = form.Files["ImageFile"] ?? form.Files["Photo"] ?? form.Files["File"];
            if (file != null && file.Length > 0)
            {
                if (!string.IsNullOrEmpty(e.ImageUrl))
                {
                    var oldFullPath = PhysFromRel(e.ImageUrl);
                    if (System.IO.File.Exists(oldFullPath)) System.IO.File.Delete(oldFullPath);
                }

                var userKey = e.UserId ?? e.UserEmail;
                var ext = Path.GetExtension(file.FileName);
                if (string.IsNullOrWhiteSpace(ext)) ext = ".png";

                var relativeDir = RelEarningDir(userKey, e.Id);
                var imageId = Guid.NewGuid().ToString();
                var fileName = imageId + ext;
                var relativePath = Path.Combine(relativeDir, fileName).Replace("\\", "/");

                var diskDir = PhysFromRel(relativeDir);
                Directory.CreateDirectory(diskDir);
                var fullPath = Path.Combine(diskDir, fileName);

                await using (var fs = new FileStream(fullPath, FileMode.Create))
                {
                    await file.CopyToAsync(fs, ct);
                }

                e.ImageUrl = relativePath;
            }
            else if (dto.RemoveImage && !string.IsNullOrEmpty(e.ImageUrl))
            {
                var oldFullPath = PhysFromRel(e.ImageUrl);
                if (System.IO.File.Exists(oldFullPath)) System.IO.File.Delete(oldFullPath);
                e.ImageUrl = null;
            }

            e.UpdatedAtUtc = DateTime.UtcNow;
            await _context.SaveChangesAsync(ct);
            return Ok(e);
        }

        [HttpPost("DeleteEarning")]
        public async Task<IActionResult> DeletePost([FromBody] IdDto body, CancellationToken ct)
        {
            if (!Guid.TryParse(body.Id, out var gid)) return BadRequest("Invalid Id.");

            var e = await _context.Earnings.Include(x => x.Instances).FirstOrDefaultAsync(x => x.Id == gid, ct);
            if (e is null) return NotFound();

            if (!string.IsNullOrEmpty(e.ImageUrl))
            {
                var full = PhysFromRel(e.ImageUrl);
                if (System.IO.File.Exists(full)) System.IO.File.Delete(full);
            }

            foreach (var inst in e.Instances)
            {
                if (!string.IsNullOrEmpty(inst.ImageUrl))
                {
                    var full = PhysFromRel(inst.ImageUrl);
                    if (System.IO.File.Exists(full)) System.IO.File.Delete(full);
                }
            }

            _context.EarningInstances.RemoveRange(e.Instances);
            _context.Earnings.Remove(e);
            await _context.SaveChangesAsync(ct);
            return Ok(new { deleted = true });
        }


        [HttpGet("GetEarningImage/{earningId:guid}")]
        public async Task<IActionResult> GetEarningImage(Guid earningId, CancellationToken ct)
        {
            var e = await _context.Earnings.FirstOrDefaultAsync(x => x.Id == earningId, ct);
            if (e == null) return NotFound("Earning not found");
            return Ok(new { imagePath = string.IsNullOrEmpty(e.ImageUrl) ? "NoPhoto" : e.ImageUrl });
        }

        [HttpPost("UploadImage/{earningId:guid}")]
        public async Task<IActionResult> UploadImage(Guid earningId, IFormFile Image, CancellationToken ct)
        {
            if (Image == null) return BadRequest("Invalid input");

            var e = await _context.Earnings.FirstOrDefaultAsync(x => x.Id == earningId, ct);
            if (e == null) return NotFound("Earning not found");
            var userKey = e.UserId ?? e.UserEmail;

            // remover imagem anterior (se existir)
            if (!string.IsNullOrEmpty(e.ImageUrl))
            {
                var old = PhysFromRel(e.ImageUrl);
                if (System.IO.File.Exists(old)) System.IO.File.Delete(old);
            }

            var ext = Path.GetExtension(Image.FileName);
            if (string.IsNullOrWhiteSpace(ext)) ext = ".png";

            var relativeDir = RelEarningDir(userKey, e.Id);
            var imageId = Guid.NewGuid().ToString();
            var fileName = imageId + ext;
            var relativePath = Path.Combine(relativeDir, fileName).Replace("\\", "/");

            var diskDir = PhysFromRel(relativeDir);
            Directory.CreateDirectory(diskDir);
            var fullPath = Path.Combine(diskDir, fileName);

            await using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await Image.CopyToAsync(stream, ct);
            }

            e.ImageUrl = relativePath;
            await _context.SaveChangesAsync(ct);

            return Ok(new { imagePath = e.ImageUrl });
        }

        [HttpGet("GetEarningInstanceById")]
        public async Task<IActionResult> GetEarningInstanceById([FromQuery] Guid id, CancellationToken ct)
        {
            var inst = await _context.EarningInstances.Include(i => i.Earning).FirstOrDefaultAsync(i => i.Id == id, ct);
            if (inst == null) return NotFound("Instance not found.");
            return Ok(new
            {
                inst.Id,
                inst.ExpectedDate,
                inst.Amount,
                inst.IsReceived,
                inst.ReceivedAtUtc,
                imagePath = inst.ImageUrl
            });
        }

        [HttpGet("InstancesByEarning/{earningId:guid}")]
        public async Task<IActionResult> InstancesByEarning(Guid earningId, CancellationToken ct)
        {
            var list = await _context.EarningInstances
                .Where(i => i.EarningId == earningId)
                .OrderBy(i => i.ExpectedDate)
                .Select(i => new
                {
                    i.Id,
                    i.ExpectedDate,
                    i.Amount,
                    i.IsReceived,
                    i.ReceivedAtUtc,
                    imagePath = i.ImageUrl
                })
                .ToListAsync(ct);

            return Ok(list);
        }

        [HttpPost("UpdateEarningInstance")]
        public async Task<IActionResult> UpdateEarningInstance([FromBody] UpdateEarningInstanceRequest updated, CancellationToken ct)
        {
            var inst = await _context.EarningInstances.Include(i => i.Earning).FirstOrDefaultAsync(i => i.Id == updated.Id, ct);
            if (inst == null) return NotFound("Instance not found.");

            if (updated.ExpectedDate.HasValue) inst.ExpectedDate = updated.ExpectedDate.Value;
            if (updated.Amount.HasValue) inst.Amount = updated.Amount.Value;
            if (updated.IsReceived.HasValue)
            {
                inst.IsReceived = updated.IsReceived.Value;
                inst.ReceivedAtUtc = updated.IsReceived.Value ? (updated.ReceivedAtUtc ?? DateTime.UtcNow) : null;
            }

            await _context.SaveChangesAsync(ct);
            return Ok(new
            {
                inst.Id,
                inst.ExpectedDate,
                inst.Amount,
                inst.IsReceived,
                inst.ReceivedAtUtc,
                inst.ImageUrl
            });
        }

        [HttpPost("Instance/UploadImage/{instanceId:guid}")]
        public async Task<IActionResult> UploadInstanceImage(Guid instanceId, IFormFile image, CancellationToken ct)
        {
            if (image == null || image.Length == 0) return BadRequest("Invalid input");

            var inst = await _context.EarningInstances.Include(i => i.Earning).FirstOrDefaultAsync(i => i.Id == instanceId, ct);
            if (inst == null) return NotFound("Instance not found.");
            if (inst.Earning == null) return BadRequest("Instance has no parent.");

            var userKey = inst.Earning.UserId ?? inst.Earning.UserEmail;

            // remover antiga
            if (!string.IsNullOrEmpty(inst.ImageUrl))
            {
                var old = PhysFromRel(inst.ImageUrl);
                if (System.IO.File.Exists(old)) System.IO.File.Delete(old);
            }

            var ext = Path.GetExtension(image.FileName);
            if (string.IsNullOrWhiteSpace(ext)) ext = ".png";

            var relativeDir = RelInstanceDir(userKey, inst.EarningId, inst.Id);
            var imageId = Guid.NewGuid().ToString();
            var fileName = imageId + ext;
            var relativePath = Path.Combine(relativeDir, fileName).Replace("\\", "/");

            var diskDir = PhysFromRel(relativeDir);
            Directory.CreateDirectory(diskDir);
            var fullPath = Path.Combine(diskDir, fileName);

            await using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await image.CopyToAsync(stream, ct);
            }

            inst.ImageUrl = relativePath;
            await _context.SaveChangesAsync(ct);
            return Ok(new { imagePath = inst.ImageUrl });
        }
    }
}
