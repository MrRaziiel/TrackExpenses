using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System;
using TRACKEXPENSES.Server.Models;
using TRACKEXPENSES.Server.ViewModels;
using System;
using TRACKEXPENSES.Server.Data;
using System.Data;

namespace TRACKEXPENSES.Server.Controllers
{
    //[ApiController]
    [Route("api/auth")]
    public class AccountController(SignInManager<User> signInManager, UserManager<User> userManager, FinancasDbContext context) : Controller
    {
        private readonly SignInManager<User> _signInManager = signInManager;
        private readonly UserManager<User> _userManager = userManager;
        private readonly FinancasDbContext _context = context;



        [HttpPost("signin")]
        public async Task<IActionResult> Register([FromBody] RegisterViewModel model)
        {
            return Ok();
            if (!ModelState.IsValid) return BadRequest(ModelState);

            User user = new()
            {

                FirstName = model.FirstName,
                FamilyName = model.FamilyName,
                Email = model.Email,
                UserName = model.Email,
                Password = model.Password,
                PhoneNumber = model.PhoneNumber != null ? model.PhoneNumber : "000000000",

            };
            if (model.Birthday != null) user.Birthday = model.Birthday;


            string role = "";

            if (string.IsNullOrEmpty(model.CodeInvite))
            {

                GroupOfUsers groupOfUsers = new()
                {
                    Name = model.FamilyName,
                    CodeInvite = GenerateCodeGroup()

                };
                role = "GROUPADMINISTRATOR";

                await _context.GroupOfUsers.AddAsync(groupOfUsers);
                user.GroupId = groupOfUsers.Id;
            }
            else
            {
                var group = _context.GroupOfUsers.FirstOrDefault(x => x.CodeInvite == model.CodeInvite);

                if (group == null) return BadRequest("Code Group incorrect");
                string id = group.Id;
                user.GroupId = id;
                role = "USER";

            }
            if (string.IsNullOrEmpty(user.ProfileImageId))
            {
                user.ProfileImageId = "No_image.jpg";
            }
            else
            {

            }

            var result = await _userManager.CreateAsync(user, user.Password);
            if (!result.Succeeded) return BadRequest(result.Errors);

            await _context.UsersList.AddAsync(user);
            await _userManager.AddToRoleAsync(user, role);
            await _context.SaveChangesAsync();
            return Ok();
        }

        private static readonly Random random = new();
        private string GenerateCodeGroup()
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            return new string(Enumerable.Repeat(chars, 32)
                .Select(s => s[random.Next(s.Length)]).ToArray());
        }

        [HttpGet("EmailCheckInDb")]
        public async Task<IActionResult> EmailCheckInDb([FromQuery] string email)
        {
            if (string.IsNullOrEmpty(email)) BadRequest(false);
            var user = await _userManager.FindByNameAsync(email);
            var exists = user != null;
            return Ok(exists);

        }
        [HttpGet("CodeGroupCheckBd")]
        public IActionResult CodeGroupCheckBd([FromQuery] string code)
        {
            if (string.IsNullOrEmpty(code)) BadRequest(false);
            var user = _context?.GroupOfUsers.FirstOrDefault(userToFind => userToFind.CodeInvite == code);
            var exists = user != null;
            return Ok(exists);
        }

    }
        

    }




//        public IActionResult VerifyEmail()
//        {
//            return View();
//        }
//        [HttpPost]
//        public async Task<IActionResult> VerifyEmail(VerifyEmailViewModel model)
//        {
//            if (ModelState.IsValid)
//            {
//                var user = await _userManager.FindByNameAsync(model.Email);
//                if (user == null)
//                {
//                    ModelState.AddModelError("", "Someting is wrong!");
//                    return View(model);
//                }
//                else
//                {
//                    return RedirectToAction("ChangePassword", "Account", new { username = user.UserName });
//                }
//            }
//            return View(model);
//        }


//        public IActionResult ChangePassword(string username)
//        {
//            if (string.IsNullOrEmpty(username))
//            {
//                return RedirectToAction("VerifyEmail", "Account");
//            }
//            return View(new ChangePasswordViewModel { Email = username });
//        }
//        [HttpPost]
//        public async Task<IActionResult> ChangePassword(ChangePasswordViewModel model)
//        {
//            if (ModelState.IsValid)
//            {
//                var user = await _userManager.FindByNameAsync(model.Email);
//                if (user != null)
//                {
//                    var result = await _userManager.RemovePasswordAsync(user);
//                    if (result.Succeeded)
//                    {
//                        result = await _userManager.AddPasswordAsync(user, model.NewPassword);
//                        return RedirectToAction("Login", "Account");
//                    }
//                    else
//                    {
//                        foreach (var error in result.Errors)
//                        {
//                            ModelState.AddModelError("", error.Description);

//                        }
//                        return View(model);
//                    }
//                }
//                else
//                {
//                    ModelState.AddModelError("", "Email not found!");
//                    return View(model);

//                }
//            }
//            else
//            {
//                ModelState.AddModelError("", "Something wen wrong. Try again");
//                return View(model);
//            }
//        }
//        public async Task<IActionResult> LogOut()
//        {
//            await _signInManager.SignOutAsync();
//            return RedirectToAction("Index", "Home");
//        }


//        public IActionResult Profile()
//        {
//            return View();
//        }


//        private static readonly Random random = new();
//        private string GenerateCodeGroup()
//        {
//            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
//            return new string(Enumerable.Repeat(chars, 32)
//                .Select(s => s[random.Next(s.Length)]).ToArray());
//        }

//    }
//}