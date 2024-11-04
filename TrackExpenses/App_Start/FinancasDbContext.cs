
using TrackExpenses.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;

namespace TrackExpenses.App_Start
{

    public class FinancasDbContext : IdentityDbContext<Client>
    {
        public DbSet<Expense> Expenses { get; set; }
        public DbSet<GroupOfClients> GroupOfClients { get; set; }
        public DbSet<Client> Clients { get; set; }
        public FinancasDbContext(DbContextOptions<FinancasDbContext> options) : base(options) 
        {

        }
        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.UseSqlServer("Server=" + Environment.MachineName + "; Database=TRACKEXPENSES;Trusted_Connection=True;TrustServerCertificate=True;");
        }

        // Configure relationships
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
