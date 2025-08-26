
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

        public DbSet<Category> ExpenseCategory { get; set; }
        public DbSet<ExpenseCategoryToShow> ExpenseCategoryToShow { get; set; }
        public DbSet<Earning> Earnings { get; set; }
        public DbSet<ExpenseInstance> ExpenseInstances { get; set; }
        public DbSet<ImageDB> Images { get; set; }

        public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();



        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>()
            .HasOne(c => c.GroupOfUsers)
            .WithMany(g => g.Users)
            .HasForeignKey(c => c.GroupId);

            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<RefreshToken>(e =>
            {
                e.HasKey(x => x.Id);
                e.Property(x => x.TokenHash).IsRequired();
                e.HasIndex(x => x.TokenHash).IsUnique();
                e.HasOne(x => x.User)
                 .WithMany(u => u.RefreshTokens)
                 .HasForeignKey(x => x.UserId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // Call the base method to ensure any default behavior is applied
            base.OnModelCreating(modelBuilder);
        }

    }
}
