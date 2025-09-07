
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TRACKEXPENSES.Server.Data;
using TRACKEXPENSES.Server.Requests.Group;
using TRACKEXPENSES.Server.Services;

namespace TRACKEXPENSES.Server.Services;

public class GroupRegistrationService : IGroupRegistrationService
{
    private readonly FinancasDbContext _context;

    public GroupRegistrationService(FinancasDbContext context)
    {
        _context = context;
    }


    public async Task<string?> RegisterGroupAsync(GroupRegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CodeInvite))
            return "USER";

        var user = await _context.Users
            .FirstOrDefaultAsync(x => x.Id == request.AdminId);
        if (user is null) return null;

        var group = await _context.GroupOfUsers
            .FirstOrDefaultAsync(x => x.CodeInvite == request.CodeInvite);
        if (group is null) return null;

        await _context.SaveChangesAsync();
        return "GROUPMEMBER";
    }

}
