using Microsoft.EntityFrameworkCore;

namespace TRACKEXPENSES.Server.Requests.Wallet
{
    public record WalletCreateRequest(string Name, string Currency);
    public record WalletRequest(string Id, string Name, string Currency, bool IsPrimary, bool IsArchived);
    public record WalletUpdateRequest(string Name, string Currency);
}
