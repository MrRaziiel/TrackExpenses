using Microsoft.AspNetCore.Mvc;

namespace TrackExpenses.Controllers
{
    public class AccountController : Controller
    {
        public IActionResult Login()
        {
            return View();
        }
    }
}
