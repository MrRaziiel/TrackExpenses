using Microsoft.EntityFrameworkCore;

namespace TRACKEXPENSES.Server.Services.Subscription
{
    public enum SubscriptionTier { Free = 0, Premium = 1 }

    public interface ISubscriptionProvider
    {
        Task<(SubscriptionTier tier, DateTimeOffset? expiry)> GetTierAsync(string userId, CancellationToken ct = default);
    }
}
