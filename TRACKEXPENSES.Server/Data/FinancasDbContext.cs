
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;
using TRACKEXPENSES.Server.Models;
using Group = TRACKEXPENSES.Server.Models.Group;


namespace TRACKEXPENSES.Server.Data
{

    public class FinancasDbContext : IdentityDbContext<User>
    {
        public FinancasDbContext(DbContextOptions<FinancasDbContext> options) : base(options)
        {

        }

        public DbSet<Models.Group> GroupOfUsers { get; set; }
        public DbSet<User> UsersList { get; set; }

        public DbSet<ImageDB> ImagesDB { get; set; }

        public DbSet<Category> ExpenseCategory { get; set; }
        public DbSet<ExpenseCategoryToShow> ExpenseCategoryToShow { get; set; }
        public DbSet<ImageDB> Images { get; set; }

        public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
        public DbSet<Group> Groups => Set<Group>();

        public DbSet<Wallet> Wallets => Set<Wallet>();
        public DbSet<ExpenseInstance> ExpenseInstances => Set<ExpenseInstance>();
        public DbSet<InstallmentPlan> InstallmentPlans => Set<InstallmentPlan>();
        public DbSet<Expense> Expenses => Set<Expense>();

        public DbSet<Earning> Earnings => Set<Earning>();
        public DbSet<EarningInstance> EarningInstances => Set<EarningInstance>();

        protected override void OnModelCreating(ModelBuilder model)
        {
            base.OnModelCreating(model);

            model.Entity<Group>()
                .HasOne<User>()
                .WithMany()
                .HasForeignKey(g => g.AdminId)
                .OnDelete(DeleteBehavior.Restrict);

            model.Entity<Group>()
                .HasMany(g => g.Users)
                .WithMany(u => u.Groups)
                .UsingEntity<Dictionary<string, object>>(
                    "UserGroups",
                    j => j.HasOne<User>().WithMany().HasForeignKey("UserId").OnDelete(DeleteBehavior.Cascade),
                    j => j.HasOne<Group>().WithMany().HasForeignKey("GroupId").OnDelete(DeleteBehavior.Cascade),
                    j => { j.HasKey("UserId", "GroupId"); j.ToTable("UserGroups"); }
                );

            model.Entity<Wallet>()
                .HasIndex(w => new { w.UserId, w.IsPrimary })
                .HasFilter("[IsPrimary] = 1")
                .IsUnique();

            model.Entity<Wallet>()
                .HasMany(w => w.Expenses)
                .WithOne(e => e.Wallet)
                .HasForeignKey(e => e.WalletId)
                .OnDelete(DeleteBehavior.Restrict);

            model.Entity<Wallet>()
                .HasMany(w => w.Earnings)
                .WithOne(e => e.Wallet)
                .HasForeignKey(e => e.WalletId)
                .OnDelete(DeleteBehavior.Restrict);

            model.Entity<Expense>()
                .HasOne(e => e.InstallmentPlan)
                .WithOne(p => p.Expense)
                .HasForeignKey<InstallmentPlan>(p => p.ExpenseId);

            model.Entity<Expense>()
                .HasMany(e => e.Instances)
                .WithOne(i => i.Expense)
                .HasForeignKey(i => i.ExpenseId)
                .OnDelete(DeleteBehavior.Cascade);

            model.Entity<ExpenseInstance>()
                .HasOne(i => i.Image)
                .WithMany()
                .HasForeignKey(i => i.ImageId)
                .OnDelete(DeleteBehavior.SetNull);

            model.Entity<Expense>(b =>
            {
                b.Property(x => x.Value).HasColumnType("decimal(18,2)");
                b.Property(x => x.PayAmount).HasColumnType("decimal(18,2)");
            });

            model.Entity<ExpenseInstance>(b =>
            {
                b.Property(x => x.Value).HasColumnType("decimal(18,2)");
                b.Property(x => x.PaidAmount).HasColumnType("decimal(18,2)");
                b.HasIndex(x => new { x.ExpenseId, x.DueDate });
            });

            model.Entity<Expense>(b =>
            {
                b.HasIndex(x => x.UserId);
                b.HasIndex(x => x.WalletId);
                b.HasIndex(x => x.StartDate);
                b.Property(x => x.Category).HasMaxLength(80);
                b.Property(x => x.Periodicity).HasMaxLength(32);
            });

            model.Entity<ImageDB>(b =>
            {
                b.Property(x => x.Name).HasMaxLength(255);
                b.Property(x => x.Extension).HasMaxLength(16);
            });

            model.Entity<Earning>(b =>
            {
                b.Property(x => x.Amount).HasColumnType("decimal(18,2)");
                b.Property(x => x.Currency).HasMaxLength(3);
                b.Property(x => x.Category).HasMaxLength(80).IsRequired();
                b.Property(x => x.Title).HasMaxLength(140);
                b.Property(x => x.Method).HasMaxLength(16);     
                b.Property(x => x.RepeatUnit).HasMaxLength(16);

                b.HasIndex(x => x.UserId);
                b.HasIndex(x => x.WalletId);
                b.HasIndex(x => x.Date);

                b.HasMany(x => x.Instances)
                 .WithOne(i => i.Earning)
                 .HasForeignKey(i => i.EarningId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            model.Entity<EarningInstance>(b =>
            {
                b.Property(x => x.Amount).HasColumnType("decimal(18,2)");
                b.HasIndex(x => new { x.EarningId, x.ExpectedDate });
            });
        }


    }
}
