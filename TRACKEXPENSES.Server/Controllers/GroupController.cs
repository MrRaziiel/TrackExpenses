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
using static TRACKEXPENSES.Server.Controllers.GroupController;


namespace TRACKEXPENSES.Server.Controllers
{
    [ApiController]
    [Route("api/Group")]
    public class GroupController(IGroupRegistrationService groupService, ICodeGroupService codeService,
        FinancasDbContext context, GroupQueryExtensions groupQuerry) : ControllerBase
    {
        private readonly IGroupRegistrationService _groupService = groupService;
        private readonly ICodeGroupService _codeService = codeService;
        private readonly FinancasDbContext _context = context;
        private readonly GroupQueryExtensions _groupQuerry = groupQuerry;


        [HttpPost("Registe")]
        [Authorize]
        public async Task<IActionResult> Register([FromBody] GroupRegisterRequest request)
        {
            var response = await registeGroup(request);
            return Ok();
        }

        //On register doesn't become a GROUPADMINISTRATOR only after registe
        [NonAction]

        private async Task<string> registeGroup(GroupRegisterRequest request)
        {
            var role = await _groupService.RegisterGroupAsync(request);

            return role;

        }

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

        [HttpPost("GetGroupsByUserEmail")]

        public async Task<IActionResult> GetGroupsByUserEmail([FromBody] UserEmailRequest request)
        {
            var grupos = await _groupQuerry.GetGroupsByUserEmailAsync(request.UserEmail);
            return Ok(grupos);
        }


        private static readonly Random random = new();
        private string GenerateCodeGroup()
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            return new string(Enumerable.Repeat(chars, 32)
                .Select(s => s[random.Next(s.Length)]).ToArray());
        }
    }
}
