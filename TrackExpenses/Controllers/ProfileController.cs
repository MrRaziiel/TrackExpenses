using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using TrackExpenses.Models;
using TrackExpenses.ViewModels;

[Authorize]
public class ProfileController : Controller
{
    private readonly UserManager<Client> userManager;

    public ProfileController(UserManager<Client> userManager)
    {
        this.userManager = userManager;
    }

    // GET: Profile/ViewProfile
    public async Task<IActionResult> Profile()
    {
        var user = await userManager.GetUserAsync(User);
        if (user == null)
        {
            return NotFound("User not found.");
        }

        var model = new ProfileViewModel
        {
            FirstName = user.FirstName,
            FamilyName = user.FamilyName,
            Email = user.Email,
            Password = user.Password
        };

        return View(model);
    }

    // POST: Profile/UpdateProfile
    [HttpPost]

    public async Task<IActionResult> UpdateProfile(ProfileViewModel model)
    {
        if (!ModelState.IsValid)
        {
            return View("ViewProfile", model);
        }

        var user = await userManager.GetUserAsync(User);
        if (user == null)
        {
            return NotFound("User not found.");
        }

        user.FirstName = model.FirstName;
        user.FamilyName = model.FamilyName;
        user.Email = model.Email;
        user.Password = model.Password;

        await userManager.UpdateAsync(user);
        return RedirectToAction("ViewProfile");
    }
}
