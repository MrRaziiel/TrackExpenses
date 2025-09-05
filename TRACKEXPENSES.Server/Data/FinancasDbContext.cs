
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;
using TRACKEXPENSES.Server.Models;


namespace TRACKEXPENSES.Server.Data
{

    public class FinancasDbContext : IdentityDbContext<User>
    {
        public FinancasDbContext(DbContextOptions<FinancasDbContext> options) : base(options)
        {

        }
        public DbSet<Expense> Expenses { get; set; }
        public DbSet<Models.Group> GroupOfUsers { get; set; }
        public DbSet<User> UsersList { get; set; }

        public DbSet<ImageDB> ImagesDB { get; set; }

        public DbSet<Category> ExpenseCategory { get; set; }
        public DbSet<ExpenseCategoryToShow> ExpenseCategoryToShow { get; set; }
        public DbSet<Earning> Earnings { get; set; }
        public DbSet<ExpenseInstance> ExpenseInstances { get; set; }
        public DbSet<ImageDB> Images { get; set; }

        public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();



        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>()
                .HasMany(u => u.Groups)
                .WithMany(g => g.Users)
                .UsingEntity(j => j.ToTable("UserGroups")); // nome da tabela de junção
        }

    }
}
