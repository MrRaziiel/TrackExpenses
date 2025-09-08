using Microsoft.Extensions.Options;
using System;
using TRACKEXPENSES.Server.Data;
using TRACKEXPENSES.Server.Extensions;
using TRACKEXPENSES.Server.Services.Expenses;
using Microsoft.EntityFrameworkCore;

namespace TRACKEXPENSES.Server.Services.Subscription
{
    public sealed class PremiumService : IPremiumService
    {
        private readonly FinancasDbContext _db;
        private readonly ISubscriptionProvider _subs;
        private readonly IOptions<PremiumOptions> _opt;

        public PremiumService(FinancasDbContext db, ISubscriptionProvider subs, IOptions<PremiumOptions> opt)
        {
            _db = db;
            _subs = subs;
            _opt = opt;
        }

        public async Task<bool> IsPremiumAsync(string userId, CancellationToken ct = default)
        {
            var (tier, _) = await _subs.GetTierAsync(userId, ct);
            return tier == SubscriptionTier.Premium;
        }

        public async Task<DateTimeOffset?> GetPremiumExpiryAsync(string userId, CancellationToken ct = default)
        {
            var (tier, exp) = await _subs.GetTierAsync(userId, ct);
            return tier == SubscriptionTier.Premium ? exp : null;
        }

        public async Task<bool> CanCreateWalletAsync(string userId, CancellationToken ct = default)
        {
            var isPremium = await IsPremiumAsync(userId, ct);
            var max = isPremium ? _opt.Value.PremiumMaxActiveWallets : _opt.Value.FreeMaxActiveWallets;

            var activeCount = await _db.Wallets
                .Where(w => w.UserId == userId && w.DeletedAt == null && !w.IsArchived)
                .CountAsync(ct);

            return activeCount < max;
        }

        public async Task EnsureWalletsComplianceAsync(string userId, CancellationToken ct = default)
        {
            // Se for premium, nada a fazer (a não ser que queiras desarquivar automatico)
            if (await IsPremiumAsync(userId, ct)) return;

            // Free: só a primary fica utilizável
            var wallets = await _db.Wallets
                .Where(w => w.UserId == userId && w.DeletedAt == null)
                .OrderByDescending(w => w.IsPrimary)
                .ThenBy(w => w.Name)
                .ToListAsync(ct);

            if (wallets.Count == 0) return;

            var primary = wallets.FirstOrDefault(w => w.IsPrimary) ?? wallets.First();

            if (_opt.Value.ArchiveNonPrimaryOnDowngrade)
            {
                foreach (var w in wallets)
                    w.IsArchived = (w.Id != primary.Id);
                await _db.SaveChangesAsync(ct);
            }
        }
    }

}
