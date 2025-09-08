using Microsoft.EntityFrameworkCore;

namespace TRACKEXPENSES.Server.Extensions
{
    public sealed class PremiumOptions
    {
        // FREE
        public int FreeMaxActiveWallets { get; set; } = 1;

        // PREMIUM (podes pôr int.MaxValue para “ilimitado”)
        public int PremiumMaxActiveWallets { get; set; } = 50;

        // Comportamento no downgrade
        public bool ArchiveNonPrimaryOnDowngrade { get; set; } = true;
    }

}
