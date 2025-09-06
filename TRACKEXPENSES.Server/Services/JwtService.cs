using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using TRACKEXPENSES.Server.Data;
using TRACKEXPENSES.Server.Handlers;
using TRACKEXPENSES.Server.Models;
using TRACKEXPENSES.Server.Models.Api;
using TRACKEXPENSES.Server.ViewModels;


namespace TRACKEXPENSES.Server.Services
{
    public class JwtService
    {
        private readonly FinancasDbContext _dbcontext;
        private readonly IConfiguration _configuration;
        private readonly UserManager<User> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;

        public JwtService(FinancasDbContext dbContext, IConfiguration configuration, UserManager<User> userManager, RoleManager<IdentityRole> roleManager)
        {
            _dbcontext = dbContext;
            _configuration = configuration;
            _userManager = userManager;
            _roleManager = roleManager;
        }

        // ---------- Helpers ----------
        private static string Hash(string value)
        {
            using var sha = SHA256.Create();
            return Convert.ToHexString(sha.ComputeHash(Encoding.UTF8.GetBytes(value)));
        }

        private string GenerateJwt(User user, List<string> roles)
        {
            var issuer = _configuration["JwtSettings:Issuer"];
            var audience = _configuration["JwtSettings:Audience"];
            var key = _configuration["JwtSettings:SecretKey"];
            var minutes = _configuration.GetValue<int>("JwtSettings:AccessTokenExpirationMinutes");
            var exp = DateTime.UtcNow.AddMinutes(minutes);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Email, user.Email ?? ""),
                new Claim(ClaimTypes.NameIdentifier, user.Id),
            };
            if (roles is not null) claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = exp,
                Issuer = issuer,
                Audience = audience,
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(Encoding.ASCII.GetBytes(key!)),
                    SecurityAlgorithms.HmacSha512Signature)
            };

            var handler = new JwtSecurityTokenHandler();
            var token = handler.CreateToken(tokenDescriptor);
            return handler.WriteToken(token);
        }

        private (string raw, RefreshToken model) GenerateRefreshPair(HttpContext http)
        {
            var days = _configuration.GetValue<int>("JwtSettings:RefreshTokenExpirationDays");
            var raw = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
            var model = new RefreshToken
            {
                TokenHash = Hash(raw),
                Expires = DateTime.UtcNow.AddDays(days),
                Created = DateTime.UtcNow,
                CreatedByIp = http.Connection.RemoteIpAddress?.ToString() ?? ""
            };
            return (raw, model);
        }

        // ---------- Login ----------
        public async Task<LoginResponseModel?> Authenticate(LoginViewModel request, HttpContext http)
        {
            if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
                return null;

            var user = await _dbcontext.Users.FirstOrDefaultAsync(x => x.Email == request.Email);
            if (user is null || !PasswordHashHandler.VerifyPassword(request.Password, user.Password!))
                return null;

            if (!user.EmailConfirmed) return null;

            var roles = (await _userManager.GetRolesAsync(user)) is { Count: > 0 } r
            ? new List<string>(r)
            : new List<string> { "User" };
            await DeleteAllTokensForUserAsync(user.Id);
            var access = GenerateJwt(user, roles);
            var (rawRefresh, model) = GenerateRefreshPair(http);
            model.UserId = user.Id;

            _dbcontext.RefreshTokens.Add(model);
            await _dbcontext.SaveChangesAsync();

            var minutes = _configuration.GetValue<int>("JwtSettings:AccessTokenExpirationMinutes");
            return new LoginResponseModel
            {
                AccessToken = access,
                RefreshToken = rawRefresh,      
                Email = request.Email,
                Roles = roles,
                ExpiresIn = minutes
            };
        }

        public async Task<TokenResponse?> RefreshAsync(string refreshTokenRaw, HttpContext http)
        {
            if (string.IsNullOrWhiteSpace(refreshTokenRaw)) return null;

            var hash = Hash(refreshTokenRaw);
            var token = await _dbcontext.RefreshTokens
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.TokenHash == hash);

            if (token is null || !token.IsActive) return null;

            await using var tx = await _dbcontext.Database.BeginTransactionAsync();

            var user = token.User;
            var userId = token.UserId;

            await DeleteAllTokensForUserAsync(userId);

            var (newRaw, newModel) = GenerateRefreshPair(http);
            newModel.UserId = userId;
            _dbcontext.RefreshTokens.Add(newModel);

            await _dbcontext.SaveChangesAsync();
            await tx.CommitAsync();

            var roles = (await _userManager.GetRolesAsync(user)) is { Count: > 0 } r
    ? new List<string>(r)
    : new List<string> { "User" };
            var newAccess = GenerateJwt(user, roles);

            return new TokenResponse(newAccess, newRaw);
        }


        public async Task<bool> RevokeAsync(string refreshTokenRaw)
        {
            if (string.IsNullOrWhiteSpace(refreshTokenRaw)) return true;
            var hash = Hash(refreshTokenRaw);
            var deleted = await _dbcontext.RefreshTokens
        .IgnoreQueryFilters()
        .Where(t => t.TokenHash == hash)
        .ExecuteDeleteAsync();
            return deleted >= 0;
        }

        public async Task<int> DeleteAllTokensForUserAsync(string userId, CancellationToken ct = default)
        {

        return await _dbcontext.RefreshTokens
            .IgnoreQueryFilters()
            .Where(t => t.UserId == userId)
            .ExecuteDeleteAsync(ct);

        }
    }

    // DTOs usados
    public sealed record TokenResponse(string AccessToken, string RefreshToken);



}
