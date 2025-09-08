using Microsoft.EntityFrameworkCore;

namespace TRACKEXPENSES.Server.Services.Expenses
{
    public interface IPremiumService
    {
        Task<bool> IsPremiumAsync(string userId, CancellationToken ct = default);

        // Informação adicional útil
        Task<DateTimeOffset?> GetPremiumExpiryAsync(string userId, CancellationToken ct = default);

        // Política de cap (free vs premium) — já aplica regras de negócio
        Task<bool> CanCreateWalletAsync(string userId, CancellationToken ct = default);

        // Reage a downgrade: arquiva não-primárias e garante compliance
        Task EnsureWalletsComplianceAsync(string userId, CancellationToken ct = default);
    }
}
