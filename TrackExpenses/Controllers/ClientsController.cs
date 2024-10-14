using Microsoft.AspNetCore.Mvc;
using TrackExpenses.App_Start;

namespace TrackExpenses.Controllers
{
    public class ClientsController : Controller
    {
        private readonly FinancasDbContext _context;

        public ClientsController(FinancasDbContext context)
        {
            _context = context;
        }
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
        public IActionResult CreateEditClient(int? id)
        {

            if (id != null)
            {
                //editing  -> load an expense by Id
                var expenseInDB = _context.Clients.SingleOrDefault(expense => expense.Id == id);
                return View(expenseInDB);

            }
            return View();
        }
    }
}
