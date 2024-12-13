using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TrackExpenses.Models;
using System.Threading;
using Microsoft.AspNetCore.Shared;
using TrackExpenses.Data;

namespace TrackExpenses.Controllers
{
    public class ClientsController : Controller
    {
        private readonly FinancasDbContext _context;

        public ClientsController(FinancasDbContext context)
        {
            _context = context;
        }
        [Authorize(Roles = "ADMINISTRATOR")]
        public IActionResult ListClients()
        {
            //List ALL expenses
            var allClients = _context.Clients.ToList();
            if (allClients != null)
            {
                return View(allClients);
            }
            else
            {
                return View();
            }
        }
        

    }
}
