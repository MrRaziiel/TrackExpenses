using System;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Cryptography.KeyDerivation;

namespace TRACKEXPENSES.Server.Handlers
{ 
public static class PasswordHashHandler
{
    private static readonly RandomNumberGenerator _randomNumberGenerator = RandomNumberGenerator.Create();
    private const int _iterationCount = 10000;

    public static string HashPassword(string password)
    {
        int saltSize = 128 / 8;
        var salt = new byte[saltSize];
        _randomNumberGenerator.GetBytes(salt);

        var subkey = KeyDerivation.Pbkdf2(
            password: password,
            salt: salt,
            prf: KeyDerivationPrf.HMACSHA512,
            iterationCount: _iterationCount,
            numBytesRequested: 256 / 8);

        var outputBytes = new byte[13 + salt.Length + subkey.Length];
        outputBytes[0] = 0x01; // Format marker

        WriteNetworkByteOrder(outputBytes, 1, (uint)KeyDerivationPrf.HMACSHA512);
        WriteNetworkByteOrder(outputBytes, 5, (uint)_iterationCount);
        WriteNetworkByteOrder(outputBytes, 9, (uint)saltSize);

        Buffer.BlockCopy(salt, 0, outputBytes, 13, salt.Length);
        Buffer.BlockCopy(subkey, 0, outputBytes, 13 + salt.Length, subkey.Length);

        return Convert.ToBase64String(outputBytes);
    }

    public static bool VerifyPassword(string password, string hashedPassword)
    {
        try
        {
            var hashedBytes = Convert.FromBase64String(hashedPassword);

            var prf = (KeyDerivationPrf)ReadNetworkByteOrder(hashedBytes, 1);
            var iterations = (int)ReadNetworkByteOrder(hashedBytes, 5);
            var saltLength = (int)ReadNetworkByteOrder(hashedBytes, 9);

            if (saltLength < 128 / 8) return false;

            var salt = new byte[saltLength];
            Buffer.BlockCopy(hashedBytes, 13, salt, 0, salt.Length);

            var storedSubkey = new byte[hashedBytes.Length - 13 - salt.Length];
            Buffer.BlockCopy(hashedBytes, 13 + salt.Length, storedSubkey, 0, storedSubkey.Length);

            var generatedSubkey = KeyDerivation.Pbkdf2(
                password: password,
                salt: salt,
                prf: prf,
                iterationCount: iterations,
                numBytesRequested: storedSubkey.Length);

            return CryptographicOperations.FixedTimeEquals(generatedSubkey, storedSubkey);
        }
        catch
        {
            return false;
        }
    }

    private static void WriteNetworkByteOrder(byte[] buffer, int offset, uint value)
    {
        buffer[offset + 0] = (byte)(value >> 24);
        buffer[offset + 1] = (byte)(value >> 16);
        buffer[offset + 2] = (byte)(value >> 8);
        buffer[offset + 3] = (byte)(value >> 0);
    }

    private static uint ReadNetworkByteOrder(byte[] buffer, int offset)
    {
        return ((uint)(buffer[offset + 0]) << 24)
             | ((uint)(buffer[offset + 1]) << 16)
             | ((uint)(buffer[offset + 2]) << 8)
             | ((uint)(buffer[offset + 3]));
    }
}
}