namespace TRACKEXPENSES.Server.Models
{
    public class RefreshToken
    {
        public int Id { get; set; }
        public string TokenHash { get; set; } = default!;
        public DateTime Expires { get; set; }
        public DateTime Created { get; set; }
        public string CreatedByIp { get; set; } = string.Empty;
        public DateTime? Revoked { get; set; }
        public string? ReplacedByTokenHash { get; set; }
        public bool IsActive => Revoked == null && DateTime.UtcNow < Expires;

        // FK
        public string UserId { get; set; } = default!;
        public User User { get; set; } = default!;
    }
}
