using TrackExpenses.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using TrackExpenses.Data;



namespace TrackExpenses.Controllers
{
    public class ExpensesController : Controller
    {
        // GET: Expenses
        private readonly FinancasDbContext _context;
        private readonly UserManager<Client> _userManager;


        public ExpensesController(FinancasDbContext context, UserManager<Client> userManager)
        {
            _context = context;
            _userManager = userManager;

        }

        //REVIEW THIS PART TO NOT NEED SQL PROCEDURES
        public IActionResult ListExpenses()
        {
            //List ALL expenses
            var user = _context.Clients.FirstOrDefault(userToFind => userToFind.Email == User.Identity.Name);
            if (user == null) return View();

            var updateExpenses = _context?.Expenses?.ToList();
            var client = _context.Clients.FirstOrDefault(x => x.Email == user.Email);
            if (client == null) return View();

            return View(client.Expenses);



        }



        public IActionResult CreateGroupClient()
        {
            return View();
        }
        public IActionResult CreateEditExpense(int? id)
        {

            if (id != null) 
            {
                //editing  -> load an expense by Id
                var expenseInDB = _context.Expenses.SingleOrDefault(expense => expense.Id == id);
                
                return View(expenseInDB);

            }
            return View();
        }

        public IActionResult DeleteExpense(int id)
        {
            //Deleat expense by Id
            var expenseInDB = _context.Expenses.SingleOrDefault(expense => expense.Id == id);
            if (expenseInDB == null) return View();
            _context.Expenses.Remove(expenseInDB);
            _context.SaveChanges();
            return RedirectToAction("ListExpenses");
        }
        [HttpPost]
        public async Task<IActionResult> CreateEditExpenseForm(Expense model)
        {
 
            if(model.Id == 0)
            {
                //Create
                _context.Expenses.Add(model);

                var user = await _userManager.GetUserAsync(User);
                
                if (user == null) return RedirectToAction("ListExpenses");

                var client = _context.Clients.FirstOrDefault(x => x.Email == user.Email);
                if (client == null) return RedirectToAction("ListExpenses");
                model.ClientId = client.Id;
                model.GroupId = client.GroupId;
                client.Expenses.Add(model);
                _context.Clients.Update(client);

            }
            try
            {
                var result = await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                throw;
            }
            return RedirectToAction("ListExpenses");
        }
        
    }
}
