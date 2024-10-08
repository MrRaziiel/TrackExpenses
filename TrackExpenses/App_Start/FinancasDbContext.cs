
using TrackExpenses.Models;
using Microsoft.EntityFrameworkCore;

namespace TrackExpenses.App_Start
{
    public class FinancasDbContext : DbContext
    {
        public DbSet<Expense> Expenses { get; set; }

        public FinancasDbContext(DbContextOptions<FinancasDbContext> options)
            : base(options) 
        {

        }    
        
    }
}
