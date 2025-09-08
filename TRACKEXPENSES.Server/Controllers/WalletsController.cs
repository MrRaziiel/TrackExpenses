using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Client;
using System;
using TRACKEXPENSES.Server.Data;
using TRACKEXPENSES.Server.Models;
using TRACKEXPENSES.Server.Requests.Wallet;
using TRACKEXPENSES.Server.Services.Expenses;

namespace TRACKEXPENSES.Server.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/wallets")]
    public sealed class WalletsController : ControllerBase
    {
        private readonly FinancasDbContext _db;
        private readonly UserManager<User> _userManager;
        private readonly IPremiumService _premium;

        public WalletsController(
            FinancasDbContext db,
            UserManager<User> userManager,
            IPremiumService premium)
        {
            _db = db;
            _userManager = userManager;
            _premium = premium;
        }

        private string? CurrentUserId() => _userManager.GetUserId(User);

        // GET /api/wallets?includeArchived=false
        [HttpGet]
        public async Task<ActionResult<IEnumerable<WalletRequest>>> List([FromQuery] bool includeArchived = false, CancellationToken ct = default)
        {
            var uid = CurrentUserId();
            if (string.IsNullOrEmpty(uid)) return Unauthorized();

            var q = _db.Wallets.Where(w => w.UserId == uid && w.DeletedAt == null);
            if (!includeArchived) q = q.Where(w => !w.IsArchived);

            var res = await q
                .OrderByDescending(w => w.IsPrimary).ThenBy(w => w.Name)
                .Select(w => new WalletRequest(w.Id, w.Name, w.Currency, w.IsPrimary, w.IsArchived))
                .ToListAsync(ct);

            return Ok(res);
        }

        // GET /api/wallets/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<WalletRequest>> Get(string id, CancellationToken ct = default)
        {
            var uid = CurrentUserId();
            if (string.IsNullOrEmpty(uid)) return Unauthorized();

            var w = await _db.Wallets.FirstOrDefaultAsync(x => x.Id == id && x.UserId == uid && x.DeletedAt == null, ct);
            if (w == null) return NotFound();

            return new WalletRequest(w.Id, w.Name, w.Currency, w.IsPrimary, w.IsArchived);
        }

        // POST /api/wallets
        [HttpPost]
        public async Task<ActionResult<WalletRequest>> Create([FromBody] WalletCreateRequest dto, CancellationToken ct = default)
        {
            var uid = CurrentUserId();
            if (string.IsNullOrEmpty(uid)) return Unauthorized();

            var canCreate = await _premium.CanCreateWalletAsync(uid, ct);
            if (!canCreate)
                return Forbid("Conta free permite apenas 1 carteira ativa.");

            var countActive = await _db.Wallets.CountAsync(w => w.UserId == uid && !w.IsArchived && w.DeletedAt == null, ct);

            var wallet = new Wallet
            {
                UserId = uid,
                Name = dto.Name?.Trim() ?? "Minha Wallet",
                Currency = string.IsNullOrWhiteSpace(dto.Currency) ? "EUR" : dto.Currency.Trim().ToUpperInvariant(),
                IsPrimary = countActive == 0,
                IsArchived = false
            };

            _db.Wallets.Add(wallet);
            await _db.SaveChangesAsync(ct);

            var result = new WalletRequest(wallet.Id, wallet.Name, wallet.Currency, wallet.IsPrimary, wallet.IsArchived);
            return CreatedAtAction(nameof(Get), new { id = wallet.Id }, result);
        }

        // PUT /api/wallets/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] WalletUpdateRequest dto, CancellationToken ct = default)
        {
            var uid = CurrentUserId();
            if (string.IsNullOrEmpty(uid)) return Unauthorized();

            var w = await _db.Wallets.FirstOrDefaultAsync(x => x.Id == id && x.UserId == uid && x.DeletedAt == null, ct);
            if (w == null) return NotFound();

            if (w.IsArchived) return Forbid("Wallet arquivada (read-only).");

            w.Name = dto.Name?.Trim() ?? w.Name;
            w.Currency = string.IsNullOrWhiteSpace(dto.Currency) ? w.Currency : dto.Currency.Trim().ToUpperInvariant();

            await _db.SaveChangesAsync(ct);
            return NoContent();
        }

        // DELETE /api/wallets/{id} (soft delete)
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id, CancellationToken ct = default)
        {
            var uid = CurrentUserId();
            if (string.IsNullOrEmpty(uid)) return Unauthorized();

            var w = await _db.Wallets.FirstOrDefaultAsync(x => x.Id == id && x.UserId == uid && x.DeletedAt == null, ct);
            if (w == null) return NotFound();

            if (w.IsPrimary)
            {
                var hasOthers = await _db.Wallets.AnyAsync(x => x.UserId == uid && x.Id != w.Id && x.DeletedAt == null, ct);
                if (hasOthers) return UnprocessableEntity("Não podes apagar a carteira primária enquanto existirem outras. Define outra como primária primeiro.");
            }

            w.DeletedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return NoContent();
        }

        // POST /api/wallets/{id}/set-primary
        [HttpPost("{id}/set-primary")]
        public async Task<IActionResult> SetPrimary(string id, CancellationToken ct = default)
        {
            var uid = CurrentUserId();
            if (string.IsNullOrEmpty(uid)) return Unauthorized();

            var target = await _db.Wallets.FirstOrDefaultAsync(x => x.Id == id && x.UserId == uid && x.DeletedAt == null, ct);
            if (target == null) return NotFound();
            if (target.IsArchived) return UnprocessableEntity("Não podes tornar primária uma wallet arquivada.");

            var wallets = await _db.Wallets.Where(x => x.UserId == uid && x.DeletedAt == null).ToListAsync(ct);
            foreach (var w in wallets) w.IsPrimary = (w.Id == id);

            await _db.SaveChangesAsync(ct);
            return NoContent();
        }

        // POST /api/wallets/{id}/archive
        [HttpPost("{id}/archive")]
        public async Task<IActionResult> Archive(string id, CancellationToken ct = default)
        {
            var uid = CurrentUserId();
            if (string.IsNullOrEmpty(uid)) return Unauthorized();

            var w = await _db.Wallets.FirstOrDefaultAsync(x => x.Id == id && x.UserId == uid && x.DeletedAt == null, ct);
            if (w == null) return NotFound();

            if (w.IsPrimary) return UnprocessableEntity("Não podes arquivar a carteira primária.");

            w.IsArchived = true;
            await _db.SaveChangesAsync(ct);
            return NoContent();
        }

        // POST /api/wallets/{id}/unarchive
        [HttpPost("{id}/unarchive")]
        public async Task<IActionResult> Unarchive(string id, CancellationToken ct = default)
        {
            var uid = CurrentUserId();
            if (string.IsNullOrEmpty(uid)) return Unauthorized();

            var w = await _db.Wallets.FirstOrDefaultAsync(x => x.Id == id && x.UserId == uid && x.DeletedAt == null, ct);
            if (w == null) return NotFound();

            // Verifica política (free não pode ter 2+ ativas)
            var canCreateOrUnarchive = await _premium.CanCreateWalletAsync(uid, ct);
            if (!canCreateOrUnarchive)
                return Forbid("Conta free permite apenas 1 carteira ativa.");

            w.IsArchived = false;
            await _db.SaveChangesAsync(ct);
            return NoContent();
        }

        // POST /api/wallets/downgrade  -> aplica regra de free (só primary ativa)
        [HttpPost("downgrade")]
        public async Task<IActionResult> DowngradeToFree(CancellationToken ct = default)
        {
            var uid = CurrentUserId();
            if (string.IsNullOrEmpty(uid)) return Unauthorized();

            await _premium.EnsureWalletsComplianceAsync(uid, ct);
            await _db.SaveChangesAsync(ct);
            return NoContent();
        }
    }
}
