using Microsoft.EntityFrameworkCore;
using TRACKEXPENSES.Server.Data;
using TRACKEXPENSES.Server.Requests.Group;

namespace TRACKEXPENSES.Server.Services
{
    public class CodeGroupService : ICodeGroupService
    {
        private readonly FinancasDbContext _context;

        public CodeGroupService(FinancasDbContext context)
        {
            _context = context;
        }

        public async Task<bool?> CheckGroupCodeAsync(CheckGroupCodeRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Code))
                return null;

            var group = await _context.GroupOfUsers
                .FirstOrDefaultAsync(x => x.CodeInvite == request.Code);

            return (group is not null);
        }
    }
}