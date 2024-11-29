using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System;
using TrackExpenses.Models;
using TrackExpenses.ViewModels;
using System;
using TrackExpenses.App_Start;
using Microsoft.EntityFrameworkCore;
using TrackExpenses.Models;

namespace TrackExpenses.Controllers
{
    public class AccountController : Controller
    {
        private readonly SignInManager<Client> signInManager;
        private readonly UserManager<Client> userManager;
        private readonly FinancasDbContext _context;

        public AccountController(SignInManager<Client> signInManager, UserManager<Client> userManager, FinancasDbContext context)
        {
            this.signInManager = signInManager;
            this.userManager = userManager;
            this._context = context;
        }

        public IActionResult Login()
        {
            return View();
        }
        [HttpPost]

        public async Task<IActionResult> Login(LoginViewModel model)
        {
            if (ModelState.IsValid)
            {
                var result = await signInManager.PasswordSignInAsync(model.Email, model.Password, model.RememberMe, false);
                if (result.Succeeded)
                {
                    return RedirectToAction("UserIndex", "Home");
                }
                else
                {
                    ModelState.AddModelError("", "Email or password is incorrect");
                    return View(model);
                }
            }
            return View(model);

        }
        public IActionResult Register()
        {
            return View();
        }
        [HttpPost]

        public async Task<IActionResult> Register(RegisterViewModel model, string? code)
        {

            if (ModelState.IsValid)
            {
                Client client = new Client
                {

                    FirstName = model.FirstName,
                    FamilyName = model.FamilyName,
                    Email = model.Email,
                    UserName = model.Email,
                    Password = model.Password,
                };
                string role = "";
                if (code == null)
                {

                    GroupOfClients groupOfClients = new GroupOfClients
                    {
                        Name = model.FamilyName,
                        CodeInvite = GenerateCodeGroup(),

                    };
                    role = "GROUPADMINISTRATOR";
                    _context.GroupOfClients.Add(groupOfClients);
                    await _context.SaveChangesAsync();

                }
                else
                {
                    var group = _context.GroupOfClients.FirstOrDefault(x => x.CodeInvite == code);

                    if (group == null)
                    {
                        ModelState.AddModelError("", "Code Group incorrect");
                        return View(model);
                    }
                    else
                    {
                        client.GroupId = group.Id;
                        role = "USER";

                    }
                }
                var result = await userManager.CreateAsync(client, model.Password);
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(client, role);
                    return RedirectToAction("Login", "Account");
                }
                else
                {
                    foreach (var error in result.Errors)
                    {
                        ModelState.AddModelError("", error.Description);

                    }
                    return View(model);
                }

            }
            return View(model);

        }

        public IActionResult CodeGroupCheck()
        {
            return View();
        }

        [HttpPost]
        public IActionResult CodeGroupCheck(string code)
        {
            return RedirectToAction("Register", "Account", new { code = code });
        }


        public IActionResult VerifyEmail()
        {
            return View();
        }
        [HttpPost]
        public async Task<IActionResult> VerifyEmail(VerifyEmailViewModel model)
        {
            if (ModelState.IsValid)
            {
                var client = await userManager.FindByNameAsync(model.Email);
                if (client == null)
                {
                    ModelState.AddModelError("", "Someting is wrong!");
                    return View(model);
                }
                else
                {
                    return RedirectToAction("ChangePassword", "Account", new { username = client.UserName });
                }
            }
            return View(model);
        }


        public IActionResult ChangePassword(string username)
        {
            if (string.IsNullOrEmpty(username))
            {
                return RedirectToAction("VerifyEmail", "Account");
            }
            return View(new ChangePasswordViewModel { Email = username });
        }
        [HttpPost]
        public async Task<IActionResult> ChangePassword(ChangePasswordViewModel model)
        {
            if (ModelState.IsValid)
            {
                var client = await userManager.FindByNameAsync(model.Email);
                if (client != null)
                {
                    var result = await userManager.RemovePasswordAsync(client);
                    if (result.Succeeded)
                    {
                        result = await userManager.AddPasswordAsync(client, model.NewPassword);
                        return RedirectToAction("Login", "Account");
                    }
                    else
                    {
                        foreach (var error in result.Errors)
                        {
                            ModelState.AddModelError("", error.Description);

                        }
                        return View(model);
                    }
                }
                else
                {
                    ModelState.AddModelError("", "Email not found!");
                    return View(model);

                }
            }
            else
            {
                ModelState.AddModelError("", "Something wen wrong. Try again");
                return View(model);
            }
        }
        public async Task<IActionResult> LogOut()
        {
            await signInManager.SignOutAsync();
            return RedirectToAction("Index", "Home");
        }


        public IActionResult Profile()
        {
            return View();
        }


        private static readonly Random random = new Random();
        private string GenerateCodeGroup()
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            return new string(Enumerable.Repeat(chars, 32)
                .Select(s => s[random.Next(s.Length)]).ToArray());
        }

    }
}
