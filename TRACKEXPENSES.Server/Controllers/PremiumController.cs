using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using TRACKEXPENSES.Server.Data;
using TRACKEXPENSES.Server.Models;
using TRACKEXPENSES.Server.Requests.User;
using TRACKEXPENSES.Server.Services.Expenses;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/Premium")]
public class PremiumController : ControllerBase
{
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly UserManager<User> _userManager;
    private readonly FinancasDbContext _db;
    private readonly IPremiumService _premium;

    public PremiumController(
        RoleManager<IdentityRole> roleManager,
        UserManager<User> userManager,
        FinancasDbContext context,
        IPremiumService premium)
    {
        _roleManager = roleManager;
        _userManager = userManager;
        _db = context;
        _premium = premium;
    }

    [HttpPost("Subscribe")]
    [Authorize]
    public async Task<IActionResult> Subscribe([FromBody] UserEmailRequest request, CancellationToken ct)
    {
        var user = await _db.Users.SingleOrDefaultAsync(c => c.Email == request.UserEmail, ct);
        if (user == null) return NotFound("No user found");

        if (!await _roleManager.RoleExistsAsync("PREMIUM"))
            await _roleManager.CreateAsync(new IdentityRole("PREMIUM"));

        var roles = await _userManager.GetRolesAsync(user);
        if (!roles.Contains("PREMIUM"))
        {
            var addRoleRes = await _userManager.AddToRoleAsync(user, "PREMIUM");
            if (!addRoleRes.Succeeded) return UnprocessableEntity("Error to change to premium");
        }

        await UnarchiveAllUserWalletsAsync(user.Id, ct);
        await _db.SaveChangesAsync(ct);

        return Created(string.Empty, null);
    }

    [HttpPost("Cancel")]
    [Authorize]
    public async Task<IActionResult> Cancel([FromBody] UserEmailRequest request, CancellationToken ct)
    {
        var user = await _db.Users.SingleOrDefaultAsync(c => c.Email == request.UserEmail, ct);
        if (user == null) return NotFound("No user found");

        var roles = await _userManager.GetRolesAsync(user);
        if (!roles.Contains("PREMIUM"))
            return UnprocessableEntity("User is already not PREMIUM");

        var removeRes = await _userManager.RemoveFromRoleAsync(user, "PREMIUM");
        if (!removeRes.Succeeded) return UnprocessableEntity("Error to change to free");

        await _premium.EnsureWalletsComplianceAsync(user.Id, ct);
        await _db.SaveChangesAsync(ct);

        return Created(string.Empty, null);
    }

    private async Task UnarchiveAllUserWalletsAsync(string userId, CancellationToken ct)
    {
        var wallets = await _db.Wallets
            .Where(w => w.UserId == userId && w.DeletedAt == null)
            .ToListAsync(ct);

        if (wallets.Count == 0) return;

        if (!wallets.Any(w => w.IsPrimary))
        {
            var first = wallets.OrderBy(w => w.Id).First();
            foreach (var w in wallets) w.IsPrimary = (w.Id == first.Id);
        }

        foreach (var w in wallets)
            w.IsArchived = false;
    }
}
