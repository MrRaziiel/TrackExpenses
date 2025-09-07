using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TRACKEXPENSES.Server.Data;
using TRACKEXPENSES.Server.Models;


namespace TRACKEXPENSES.Server.Extensions
{
    public class GroupQueryExtensions
    {
        private readonly FinancasDbContext _context;

        public GroupQueryExtensions(FinancasDbContext context)
        {
            _context = context;
        }

    
        public async Task<List<Group>> GetGroupsByUserEmailAsync(string email)
        {
            if (string.IsNullOrWhiteSpace(email)) return new List<Group>();

            return await _context.Users
                .Where(u => u.Email == email)
                .SelectMany(u => u.Groups)   
                .ToListAsync();
        }


        public async Task<List<Group>> GetGroupsByUserEmail_IncludeAsync(string email)
        {
            if (string.IsNullOrWhiteSpace(email)) return new List<Group>();

            var user = await _context.Users
                .Include(u => u.Groups)
                .FirstOrDefaultAsync(u => u.Email == email);

            return user?.Groups?.ToList() ?? new List<Group>();
        }
    }
}
