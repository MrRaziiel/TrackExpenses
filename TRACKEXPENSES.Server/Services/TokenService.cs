using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using TRACKEXPENSES.Server.Models;

namespace TRACKEXPENSES.Server.Services
{
    public static class TokenService
    {
        public static string Hash(string value)
        {
            using var sha = SHA256.Create();
            return Convert.ToHexString(sha.ComputeHash(Encoding.UTF8.GetBytes(value)));
        }

        public static string GenerateJwt(User user, IConfigurationSection jwt)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["SecretKey"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var exp = DateTime.UtcNow.AddMinutes(double.Parse(jwt["AccessTokenExpirationMinutes"]!));

            var token = new JwtSecurityToken(
                issuer: jwt["Issuer"],
                audience: jwt["Audience"],
                claims: new[]
                {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                new Claim(JwtRegisteredClaimNames.Email, user.Email ?? "")
                },
                expires: exp,
                signingCredentials: creds
            );
            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public static (string raw, RefreshToken model) GenerateRefreshToken(HttpContext http, IConfigurationSection jwt)
        {
            var raw = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
            var model = new RefreshToken
            {
                TokenHash = Hash(raw),
                Expires = DateTime.UtcNow.AddDays(int.Parse(jwt["RefreshTokenExpirationDays"]!)),
                Created = DateTime.UtcNow,
                CreatedByIp = http.Connection.RemoteIpAddress?.ToString() ?? ""
            };
            return (raw, model);
        }
    }
}
