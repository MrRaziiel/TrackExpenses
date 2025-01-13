
using TrackExpenses.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using System.Security.Claims;
using Microsoft.Extensions.Options;


namespace TrackExpenses.Data
{

    public class FinancasDbContext : IdentityDbContext<Client>
    {
        public DbSet<Expense> Expenses { get; set; }
        public DbSet<GroupOfClients> GroupOfClients { get; set; }
        public DbSet<Client> Clients { get; set; }

        public DbSet<ExpenseCategory> ExpenseCategory { get; set; }
        public FinancasDbContext(DbContextOptions<FinancasDbContext> options) : base(options)
        {

        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Client>()
            .HasOne(c => c.GroupOfClients)
            .WithMany(g => g.Clients)
            .HasForeignKey(c => c.GroupId);

            // Call the base method to ensure any default behavior is applied
            base.OnModelCreating(modelBuilder);
        }

    }
}
