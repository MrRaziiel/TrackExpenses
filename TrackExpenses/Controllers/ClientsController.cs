using Microsoft.AspNetCore.Mvc;
using TrackExpenses.App_Start;
using TrackExpenses.Models;

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
        public IActionResult CreateEditClient(string? id)
        {

            {

                if (id != null)
                {
                    //editing  -> load an expense by Id
                    var clientInDB = _context.Clients.SingleOrDefault(client => client.Id == id);
                    return View(clientInDB);

                }
                return View();
            }
        }

        public IActionResult CreateEditClientForm(Client client)
        {

            if (client.Id == null)
            {
                //Create
                _context.Clients.Add(client);
            }
            else
            {
                //Editing
                _context.Clients.Update(client);

            }
            _context.SaveChanges();
            return RedirectToAction("ListClients");

        }
}
}
