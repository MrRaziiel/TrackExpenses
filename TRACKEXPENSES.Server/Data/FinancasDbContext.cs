
using TRACKEXPENSES.Server.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;


namespace TRACKEXPENSES.Server.Data
{

    public class FinancasDbContext : IdentityDbContext<User>
    {
        public FinancasDbContext(DbContextOptions<FinancasDbContext> options) : base(options)
        {

        }
        public DbSet<Expense> Expenses { get; set; }
        public DbSet<GroupOfUsers> GroupOfUsers { get; set; }
        public DbSet<User> UsersList { get; set; }

        public DbSet<ImageDB> ImagesDB { get; set; }

        public DbSet<ExpenseCategory> ExpenseCategory { get; set; }
        public DbSet<ExpenseCategoryToShow> ExpenseCategoryToShow { get; set; }



        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>()
            .HasOne(c => c.GroupOfUsers)
            .WithMany(g => g.Users)
            .HasForeignKey(c => c.GroupId);

            // Call the base method to ensure any default behavior is applied
            base.OnModelCreating(modelBuilder);
        }

    }
}
