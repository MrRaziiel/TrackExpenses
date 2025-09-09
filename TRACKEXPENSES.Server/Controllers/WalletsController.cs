﻿using Microsoft.AspNetCore.Authorization;
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
        private readonly FinancasDbContext _context;
        private readonly UserManager<User> _userManager;
        private readonly IPremiumService _premium;

        private async Task<bool> CurrentUserIsPremiumAsync()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return false;

            var roles = await _userManager.GetRolesAsync(user);
            return roles.Any(r => r.Equals("PREMIUM", StringComparison.OrdinalIgnoreCase));
        }

        public WalletsController(
            FinancasDbContext context,
            UserManager<User> userManager,
            IPremiumService premium)
        {
            _context = context;
            _userManager = userManager;
            _premium = premium;
        }

        private string? CurrentUserId() => _userManager.GetUserId(User);

        // GET /api/wallets?includeArchived=false
        [HttpGet]
        public async Task<IActionResult> List([FromQuery] bool includeArchived = false)
        {
            var userId = CurrentUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var q = _context.Wallets
                .AsNoTracking()
                .Where(w => w.UserId == userId);

            if (!includeArchived)
                q = q.Where(w => !w.IsArchived);

            var wallets = await q
                .OrderByDescending(w => w.IsPrimary)
                .ThenBy(w => w.Name)
                .Select(w => new
                {
                    id = w.Id,
                    name = w.Name,
                    currency = w.Currency,
                    isPrimary = w.IsPrimary,
                    isArchived = w.IsArchived
                })
                .ToListAsync();

            return Ok(wallets);
        }


        // POST /api/wallets
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateWalletRequest req)
        {
            var userId = CurrentUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();
            if (req == null || string.IsNullOrWhiteSpace(req.Name))
                return BadRequest(new { message = "Nome é obrigatório." });

            var isPremium = await CurrentUserIsPremiumAsync();

            var activeCount = await _context.Wallets
                .Where(w => w.UserId == userId && !w.IsArchived)
                .CountAsync();

            if (!isPremium && activeCount >= 1)
            {
                return UnprocessableEntity(new
                {
                    message = "A tua conta só permite 1 carteira ativa. Torna-te PREMIUM para criar mais."
                });
            }

            // primeira ativa torna-se primária
            var isFirstActive = activeCount == 0;

            var wallet = new Wallet
            {
                Id = Guid.NewGuid().ToString(),
                UserId = userId,
                Name = req.Name.Trim(),
                Currency = string.IsNullOrWhiteSpace(req.Currency) ? "EUR" : req.Currency,
                IsArchived = false,
                IsPrimary = isFirstActive
            };

            _context.Wallets.Add(wallet);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = wallet.Id }, new
            {
                id = wallet.Id,
                name = wallet.Name,
                currency = wallet.Currency,
                isPrimary = wallet.IsPrimary,
                isArchived = wallet.IsArchived
            });
        }


        // PUT /api/wallets/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateWalletRequest req)
        {
            var userId = CurrentUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var w = await _context.Wallets.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);
            if (w == null) return NotFound();

            if (!string.IsNullOrWhiteSpace(req.Name))
                w.Name = req.Name.Trim();

            if (!string.IsNullOrWhiteSpace(req.Currency))
                w.Currency = req.Currency.Trim().ToUpperInvariant();

            if (req.IsArchived.HasValue)
                w.IsArchived = req.IsArchived.Value;

            await _context.SaveChangesAsync();
            return Ok(new
            {
                id = w.Id,
                name = w.Name,
                currency = w.Currency,
                isPrimary = w.IsPrimary,
                isArchived = w.IsArchived
            });
        }

        // DELETE /api/wallets/{id} (soft delete)
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var userId = CurrentUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var w = await _context.Wallets.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);
            if (w == null) return NotFound();

            if (w.IsPrimary)
                return UnprocessableEntity(new { message = "Não podes apagar a carteira primária." });

            _context.Wallets.Remove(w);
            await _context.SaveChangesAsync();
            return Ok();
        }

        // POST /api/wallets/{id}/set-primary
        [HttpPost("{id}/set-primary")]
        public async Task<IActionResult> SetPrimary(string id)
        {
            var userId = CurrentUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var w = await _context.Wallets.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);
            if (w == null) return NotFound();
            if (w.IsArchived) return UnprocessableEntity(new { message = "Não podes tornar primária uma carteira arquivada." });

            // desmarca todas as outras
            var others = _context.Wallets.Where(x => x.UserId == userId && x.Id != id && x.IsPrimary);
            await others.ForEachAsync(x => x.IsPrimary = false);

            w.IsPrimary = true;

            await _context.SaveChangesAsync();
            return Ok(new { id = w.Id, isPrimary = true });
        }

        // POST /api/wallets/{id}/archive
        [HttpPost("{id}/archive")]
        public async Task<IActionResult> Archive(string id)
        {
            var userId = CurrentUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var w = await _context.Wallets.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);
            if (w == null) return NotFound();

            if (w.IsArchived) return Ok(); // já está arquivada

            w.IsArchived = true;

            // se era primária, tenta promover outra ativa
            if (w.IsPrimary)
            {
                w.IsPrimary = false;
                var candidate = await _context.Wallets
                    .Where(x => x.UserId == userId && !x.IsArchived && x.Id != w.Id)
                    .OrderBy(x => x.Name) // qualquer critério estável
                    .FirstOrDefaultAsync();

                if (candidate != null)
                    candidate.IsPrimary = true;
            }

            await _context.SaveChangesAsync();
            return Ok(new { id = w.Id, isArchived = true });
        }

        // POST /api/wallets/{id}/unarchive
        [HttpPost("{id}/unarchive")]
        public async Task<IActionResult> Unarchive(string id)
        {
            var userId = CurrentUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var w = await _context.Wallets.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);
            if (w == null) return NotFound();

            if (!w.IsArchived) return Ok();

            // regra de FREE: não permitir mais que 1 ativa
            var isPremium = await CurrentUserIsPremiumAsync();
            if (!isPremium)
            {
                var activeCount = await _context.Wallets.CountAsync(x => x.UserId == userId && !x.IsArchived);
                if (activeCount >= 1)
                {
                    return UnprocessableEntity(new
                    {
                        message = "A tua conta só permite 1 carteira ativa. Torna-te PREMIUM para teres mais."
                    });
                }
            }

            w.IsArchived = false;

            // se não existe primária, esta passa a ser primária
            var existsPrimary = await _context.Wallets.AnyAsync(x => x.UserId == userId && x.IsPrimary && !x.IsArchived);
            if (!existsPrimary)
                w.IsPrimary = true;

            await _context.SaveChangesAsync();
            return Ok(new { id = w.Id, isArchived = false, isPrimary = w.IsPrimary });
        }

        // POST /api/wallets/downgrade  -> aplica regra de free (só primary ativa)
        [HttpPost("downgrade")]
        public async Task<IActionResult> DowngradeToFree(CancellationToken ct = default)
        {
            var uid = CurrentUserId();
            if (string.IsNullOrEmpty(uid)) return Unauthorized();

            await _premium.EnsureWalletsComplianceAsync(uid, ct);
            await _context.SaveChangesAsync(ct);
            return NoContent();
        }
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(string id, CancellationToken ct = default)
        {
            var userId = CurrentUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var w = await _context.Wallets
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId && x.DeletedAt == null, ct);

            if (w == null) return NotFound();

            return Ok(new
            {
                id = w.Id,
                name = w.Name,
                currency = w.Currency,
                isPrimary = w.IsPrimary,
                isArchived = w.IsArchived
            });
        }
    }
}
