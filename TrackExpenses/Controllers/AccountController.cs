using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using TrackExpenses.Models;
using TrackExpenses.ViewModels;

namespace TrackExpenses.Controllers
{
    public class AccountController : Controller
    {
        private readonly SignInManager<Client> signInManager;
        private readonly UserManager<Client> userManager;

        public AccountController(SignInManager<Client> signInManager, UserManager<Client> userManager)
        {
            this.signInManager = signInManager;
            this.userManager = userManager;
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
                    return RedirectToAction("Index", "Home");
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

        public async Task<IActionResult> Register(RegisterViewModel model)
        {
            if (ModelState.IsValid)
            {
                Client client = new Client
                {

                    FirstName = model.Name,
                    LastName = model.Name,
                    Email = model.Email,
                    UserName = model.Email,
                    Password = model.Password,
                };

                var result = await userManager.CreateAsync(client, model.Password);
                if (result.Succeeded)
                {
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
                if (User != null)
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
    }
}
