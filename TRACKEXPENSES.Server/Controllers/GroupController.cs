using Google.Protobuf.Collections;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel;
using System.Data;
using TRACKEXPENSES.Server.Data;
using TRACKEXPENSES.Server.Extensions;
using TRACKEXPENSES.Server.Models;
using TRACKEXPENSES.Server.Requests.Group;
using TRACKEXPENSES.Server.Requests.User;
using TRACKEXPENSES.Server.Services;

namespace TRACKEXPENSES.Server.Controllers
{
    [ApiController]
    [Route("api/Group")]
    public class GroupController(
        ICodeGroupService codeService,
        FinancasDbContext context,
        GroupQueryExtensions groupQuerry,
        UserManager<User> userManager,
        RoleManager<IdentityRole> roleManager
    ) : ControllerBase
    {
        private readonly ICodeGroupService _codeService = codeService;
        private readonly FinancasDbContext _context = context;
        private readonly GroupQueryExtensions _groupQuerry = groupQuerry;
        private readonly UserManager<User> _userManager = userManager;
        private readonly RoleManager<IdentityRole> _roleManager = roleManager;

        /* ----------------------------- helpers ----------------------------- */
        private string? CurrentUserId() => _userManager.GetUserId(User);

        private static object ProjectGroup(Group g, User? admin, IEnumerable<User> users)
        {
            return new
            {
                g.Id,
                g.Name,
                Admin = admin is null ? null : new
                {
                    admin.Id,
                    admin.Email,
                    FullName = $"{admin.FirstName} {admin.FamilyName}".Trim()
                },
                Members = users
                    .Where(u => u.Id != g.AdminId)
                    .Select(u => new
                    {
                        u.Id,
                        u.Email,
                        FullName = $"{u.FirstName} {u.FamilyName}".Trim()
                    })
                    .ToList()
            };
        }

        private static object ProjectLite(Group g, bool isAdmin) => new
        {
            id = g.Id,
            name = g.Name,
            isAdmin
        };

        private async Task<bool> IsCurrentUserGroupAdmin(Group g, CancellationToken ct)
        {
            var meId = CurrentUserId();
            if (string.IsNullOrEmpty(meId) || meId != g.AdminId) return false;
            var me = await _userManager.FindByIdAsync(meId);
            if (me == null) return false;
            return await _userManager.IsInRoleAsync(me, "GROUPADMINISTRATOR");
        }

        /* ----------------------------- create/register ----------------------------- */

        [HttpPost("Register")]
        public async Task<IActionResult> Register([FromBody] GroupRegisterRequest req, CancellationToken ct)
        {
            if (!ModelState.IsValid) return ValidationProblem(ModelState);

            var admin = await _userManager.Users.SingleOrDefaultAsync(u => u.Email == req.AdminEmail, ct);
            if (admin is null) return NotFound("Admin user not found.");

            var group = new Group
            {
                Name = req.GroupName.Trim(),
                AdminId = admin.Id
            };

            var memberIds = (req.UsersId ?? new())
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Select(id => id.Trim())
                .Distinct()
                .Where(id => id != admin.Id)
                .ToList();

            if (memberIds.Count > 0)
            {
                var users = await _userManager.Users
                    .Where(u => memberIds.Contains(u.Id))
                    .ToListAsync(ct);

                foreach (var u in users)
                    group.Users.Add(u);
            }

            if (!group.Users.Any(u => u.Id == admin.Id))
                group.Users.Add(admin);

            _context.Groups.Add(group);

            const string roleName = "GROUPADMINISTRATOR";

            var hasRole = await _userManager.IsInRoleAsync(admin, roleName);
            if (!hasRole)
            {
                var addToRole = await _userManager.AddToRoleAsync(admin, roleName);
                if (!addToRole.Succeeded)
                {
                    var errors = string.Join("; ", addToRole.Errors.Select(e => $"{e.Code}:{e.Description}"));
                    return StatusCode(StatusCodes.Status500InternalServerError,
                        new { message = $"Failed to add admin to role '{roleName}'", errors });
                }
            }

            await _context.SaveChangesAsync(ct);

            return Ok(new
            {
                group.Id,
                group.Name,
                Admin = new { admin.Id, admin.Email, FullName = $"{admin.FirstName} {admin.FamilyName}".Trim() },
                Members = group.Users.Select(u => new { u.Id, u.Email, FullName = $"{u.FirstName} {u.FamilyName}".Trim() })
            });
        }

        /* ----------------------------- code check ----------------------------- */

        [Description("This endpoint allows a user to register or join a group.")]
        [HttpPost("check-code")]
        public async Task<IActionResult> CodeGroupCheck([FromBody] CheckGroupCodeRequest request)
        {
            var response = await codeGroupCheckBd(request);
            if (response == null) return NotFound(new { message = "Code can't be null." });
            return Ok(response);
        }

        [NonAction]
        public async Task<bool?> codeGroupCheckBd(CheckGroupCodeRequest request)
        {
            var exists = await _codeService.CheckGroupCodeAsync(request);
            return exists;
        }

        /* ----------------------------- queries existentes ----------------------------- */

        [HttpPost("GetGroupsByUserEmail")]
        public async Task<IActionResult> GetGroupsByUserEmail([FromBody] UserEmailRequest request)
        {
            var grupos = await _groupQuerry.GetGroupsByUserEmailAsync(request.UserEmail);
            return Ok(grupos);
        }

        [Authorize]
        [HttpGet("List")]
        public async Task<IActionResult> List([FromQuery] string? email = null, CancellationToken ct = default)
        {
            string? userId;

            if (!string.IsNullOrWhiteSpace(email))
            {
                var normalized = _userManager.NormalizeEmail(email);
                var user = await _userManager.Users
                    .AsNoTracking()
                    .SingleOrDefaultAsync(u => u.NormalizedEmail == normalized, ct);

                if (user is null)
                    return NotFound(new { message = "User not found by email." });

                userId = user.Id;
            }
            else
            {
                userId = CurrentUserId();
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized();
            }

            var data = await _context.Groups
                .AsNoTracking()
                .Where(g => g.AdminId == userId || g.Users.Any(u => u.Id == userId))
                .Select(g => new
                {
                    g.Id,
                    g.Name,
                    Admin = _context.Users
                        .Where(u => u.Id == g.AdminId)
                        .Select(u => new
                        {
                            u.Id,
                            u.Email,
                            FullName = (u.FirstName + " " + u.FamilyName).Trim()
                        })
                        .FirstOrDefault(),

                    Members = g.Users
                        .Where(u => u.Id != g.AdminId)
                        .Select(u => new
                        {
                            u.Id,
                            u.Email,
                            FullName = (u.FirstName + " " + u.FamilyName).Trim()
                        })
                        .ToList()
                })
                .ToListAsync(ct);

            return Ok(data);
        }

        [Authorize]
        [HttpDelete("Leave")]
        public async Task<IActionResult> LeaveByQuery([FromQuery] string id, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(id))
                return BadRequest(new { message = "id is required." });

            var meId = CurrentUserId();
            if (string.IsNullOrEmpty(meId))
                return Unauthorized();

            var group = await _context.Groups
                .Include(g => g.Users)
                .SingleOrDefaultAsync(g => g.Id == id, ct);

            if (group is null)
                return NotFound(new { message = "Group not found." });

            var isAdmin = group.AdminId == meId;
            var isMember = group.Users.Any(u => u.Id == meId);

            if (!isAdmin && !isMember)
                return NotFound(new { message = "You are not a member of this group." });

            if (isAdmin)
            {
                var otherMembers = group.Users.Any(u => u.Id != meId);
                if (otherMembers)
                    return Conflict(new { message = "Admin cannot leave while there are members. Transfer admin or remove members first." });

                _context.Groups.Remove(group);
                await _context.SaveChangesAsync(ct);
                return Ok(new { deleted = true });
            }

            var me = group.Users.FirstOrDefault(u => u.Id == meId);
            if (me != null)
                group.Users.Remove(me);

            await _context.SaveChangesAsync(ct);
            return Ok(new { left = true });
        }

        // ========= POST /api/Group/Update?id=&name=&usersId=&usersId= =========
        [HttpPost("Update")]
        public async Task<IActionResult> Update(
            [FromQuery] string id,
            [FromQuery] string name,
            [FromQuery] List<string>? usersId,
            CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(id))
                return BadRequest(new { message = "id is required." });
            if (string.IsNullOrWhiteSpace(name))
                return BadRequest(new { message = "name is required." });

            var g = await _context.Groups
                .Include(x => x.Users)
                .SingleOrDefaultAsync(x => x.Id == id, ct);

            if (g is null) return NotFound(new { message = "Group not found." });

            if (!await IsCurrentUserGroupAdmin(g, ct))
                return Forbid();

            g.Name = name.Trim();

            var incoming = (usersId ?? new())
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .Select(s => s.Trim())
                .Distinct()
                .ToHashSet();

            incoming.Add(g.AdminId);

            var existingIds = g.Users.Select(u => u.Id).ToHashSet();
            var toAddIds = incoming.Except(existingIds).ToList();
            var toRemoveIds = existingIds.Except(incoming).Where(uid => uid != g.AdminId).ToList();

            if (toAddIds.Count > 0)
            {
                var addUsers = await _userManager.Users.Where(u => toAddIds.Contains(u.Id)).ToListAsync(ct);
                foreach (var u in addUsers) g.Users.Add(u);
            }
            if (toRemoveIds.Count > 0)
            {
                foreach (var u in g.Users.Where(u => toRemoveIds.Contains(u.Id)).ToList())
                    g.Users.Remove(u);
            }

            await _context.SaveChangesAsync(ct);

            var admin = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == g.AdminId, ct);
            var users = await _context.Users.AsNoTracking()
                .Where(u => g.Users.Select(x => x.Id).Contains(u.Id))
                .ToListAsync(ct);

            return Ok(ProjectGroup(g, admin, users));
        }

        [HttpPost("Edit")]
        public Task<IActionResult> Edit(
            [FromQuery] string id,
            [FromQuery] string name,
            [FromQuery] List<string>? usersId,
            CancellationToken ct = default)
            => Update(id, name, usersId, ct);

        [Authorize]
        [HttpGet("Get")]
        public async Task<IActionResult> Get([FromQuery] string id, CancellationToken ct = default)
        {
            var g = await _context.Groups
                .AsNoTracking()
                .Include(x => x.Users)
                .SingleOrDefaultAsync(x => x.Id == id, ct);

            if (g is null) return NotFound(new { message = "Group not found." });

            var admin = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == g.AdminId, ct);
            return Ok(new
            {
                g.Id,
                g.Name,
                Admin = admin == null ? null : new { admin.Id, admin.Email, FullName = (admin.FirstName + " " + admin.FamilyName).Trim() },
                Members = g.Users.Where(u => u.Id != g.AdminId).Select(u => new { u.Id, u.Email, FullName = (u.FirstName + " " + u.FamilyName).Trim() }).ToList()
            });
        }

        private async Task<IActionResult> DeleteInternal(string id, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(id))
                return BadRequest(new { message = "id is required." });

            var g = await _context.Groups
                .Include(x => x.Users)
                .SingleOrDefaultAsync(x => x.Id == id, ct);

            if (g is null) return NotFound(new { message = "Group not found." });

            if (!await IsCurrentUserGroupAdmin(g, ct))
                return Forbid();

            _context.Groups.Remove(g);
            await _context.SaveChangesAsync(ct);
            return NoContent();
        }

        [HttpDelete("Delete")]
        public Task<IActionResult> DeleteByQuery([FromQuery] string id, CancellationToken ct = default)
            => DeleteInternal(id, ct);

        [HttpDelete("{id}")]
        public Task<IActionResult> DeleteByRoute([FromRoute] string id, CancellationToken ct = default)
            => DeleteInternal(id, ct);

        [HttpPost("Delete")]
        public Task<IActionResult> DeleteByPost([FromQuery] string id, CancellationToken ct = default)
            => DeleteInternal(id, ct);

        /* ----------------------------- ALIASES NOVOS p/ compat ----------------------------- */

        // Admin only: grupos onde o utilizador atual é admin (formato simples)
        [Authorize]
        [HttpGet("Admin")]
        [HttpGet("/api/Groups/Admin")]          // alias absoluto
        [HttpGet("/api/GroupAdmin/MyGroups")]   // alias absoluto (o mais usado no front antigo)
        public async Task<IActionResult> AdminOnly(CancellationToken ct = default)
        {
            var userId = CurrentUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var list = await _context.Groups
                .AsNoTracking()
                .Where(g => g.AdminId == userId)
                .OrderBy(g => g.Name)
                .ToListAsync(ct);

            return Ok(list.Select(g => ProjectLite(g, isAdmin: true)));
        }

        // Listagem dos meus grupos (sou admin OU membro) — formato simples
        [Authorize]
        [HttpGet("ListMine")]
        [HttpGet("GetMyGroups")]
        [HttpGet("MyGroups")]
        [HttpGet("/api/Groups/ListMine")]       // alias absoluto
        public async Task<IActionResult> ListMine(CancellationToken ct = default)
        {
            var userId = CurrentUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var list = await _context.Groups
                .AsNoTracking()
                .Where(g => g.AdminId == userId || g.Users.Any(u => u.Id == userId))
                .Select(g => new { g.Id, g.Name, IsAdmin = (g.AdminId == userId) })
                .OrderBy(g => g.Name)
                .ToListAsync(ct);

            return Ok(list.Select(x => new { id = x.Id, name = x.Name, isAdmin = x.IsAdmin }));
        }
        public sealed class GroupIdRequest
        {
            public string? GroupId { get; set; }
        }

        // ---------- implementação comum ----------
        private async Task<IActionResult> MembersInternal(string groupId, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(groupId))
                return BadRequest(new { message = "groupId is required." });

            var g = await _context.Groups
                .AsNoTracking()
                .Include(x => x.Users)
                .SingleOrDefaultAsync(x => x.Id == groupId, ct);

            if (g is null) return NotFound(new { message = "Group not found." });

            var admin = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == g.AdminId, ct);

            var members = new List<object>();

            if (admin != null)
            {
                members.Add(new
                {
                    id = admin.Id,
                    email = admin.Email,
                    fullName = $"{admin.FirstName} {admin.FamilyName}".Trim(),
                    isAdmin = true
                });
            }

            members.AddRange(
                g.Users
                 .Where(u => u.Id != g.AdminId)
                 .Select(u => new
                 {
                     id = u.Id,
                     email = u.Email,
                     fullName = $"{u.FirstName} {u.FamilyName}".Trim(),
                     isAdmin = false
                 })
            );

            return Ok(new { groupId = g.Id, groupName = g.Name, members });
        }

        // ---------- GET (o que o front está a chamar) ----------
        [Authorize]
        [HttpGet("Members")]
        public Task<IActionResult> MembersGet([FromQuery] string groupId, CancellationToken ct = default)
            => MembersInternal(groupId, ct);

        // ---------- POST opcional (para contornar 405 se precisares) ----------
        [Authorize]
        [HttpPost("Members")]
        public Task<IActionResult> MembersPost([FromBody] GroupIdRequest req, CancellationToken ct = default)
            => MembersInternal(req?.GroupId ?? string.Empty, ct);
    }
}
