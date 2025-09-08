using Microsoft.EntityFrameworkCore;

namespace TRACKEXPENSES.Server.Services.Subscription
{
    public sealed class ClaimsSubscriptionProvider : ISubscriptionProvider
    {
        private readonly IHttpContextAccessor _http;

        public ClaimsSubscriptionProvider(IHttpContextAccessor http) { _http = http; }

        public Task<(SubscriptionTier, DateTimeOffset?)> GetTierAsync(string userId, CancellationToken ct = default)
        {
            var principal = _http.HttpContext?.User;
            if (principal == null) return Task.FromResult((SubscriptionTier.Free, (DateTimeOffset?)null));

            // Ajusta nomes dos claims para os teus
            var tierClaim = principal.Claims.FirstOrDefault(c => c.Type == "tier")?.Value;
            var expClaim = principal.Claims.FirstOrDefault(c => c.Type == "premium_exp")?.Value;

            var tier = string.Equals(tierClaim, "premium", StringComparison.OrdinalIgnoreCase)
                ? SubscriptionTier.Premium : SubscriptionTier.Free;

            DateTimeOffset? expiry = null;
            if (long.TryParse(expClaim, out var epoch))
                expiry = DateTimeOffset.FromUnixTimeSeconds(epoch);

            // Se expirou, trata como Free
            if (expiry is { } e && e <= DateTimeOffset.UtcNow) tier = SubscriptionTier.Free;

            return Task.FromResult((tier, tier == SubscriptionTier.Premium ? expiry : null));
        }
    }
}
