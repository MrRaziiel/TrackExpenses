using Microsoft.EntityFrameworkCore;

namespace TRACKEXPENSES.Server.Requests.Wallet
{
    public sealed class CreateWalletRequest
    {
        public string Name { get; set; } = default!;
        public string Currency { get; set; } = "EUR";
        public string? Description { get; set; }
    }
    public record WalletRequest(string Id, string Name, string Currency, bool IsPrimary, bool IsArchived);
    public sealed class UpdateWalletRequest
    {
        public string Name { get; set; } = default!;
        public string Currency { get; set; } = "EUR";
        public string? Description { get; set; }
        public bool? IsArchived { get; set; } // opcional
    }
}
