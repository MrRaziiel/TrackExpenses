using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using TrackExpenses.Data;
using TrackExpenses.Models;

namespace TrackExpenses.Controllers
{
    public class IncomesController : Controller
    {
        
            // GET: Expenses
            private readonly FinancasDbContext _context;
            private readonly UserManager<Client> _userManager;


            public IncomesController(FinancasDbContext context, UserManager<Client> userManager)
            {
                _context = context;
                _userManager = userManager;

            }
        }
}
