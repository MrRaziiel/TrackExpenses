using TrackExpenses.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
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

        public IActionResult ListExpenses()
        {
            //List ALL expenses
            
        var allExpenses  = _context.Expenses.ToList();
            if (allExpenses != null)
                {
                return View(allExpenses);
            }
            else
            {
                return View();
            }
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
            _context.Expenses.Remove(expenseInDB);
            _context.SaveChanges();
            return RedirectToAction("ListExpenses");
        }

        public async Task<IActionResult> CreateEditExpenseForm(Expense model)
        {
            if(model.Id == 0)
            {
                //Create
                _context.Expenses.Add(model);

                var user = await _userManager.GetUserAsync(User);

                if (user != null)
                {
                    user?.Expenses.Add(model);

                }
            }
            else{
                //Editing
                _context.Expenses.Update(model);

            }
            _context.SaveChanges();
            return RedirectToAction("ListExpenses");
        }
        
    }
}
