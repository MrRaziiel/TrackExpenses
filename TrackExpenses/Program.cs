using Microsoft.EntityFrameworkCore;
using TrackExpenses.App_Start;
using TrackExpenses.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.VisualStudio.Web.CodeGenerators.Mvc.Templates.BlazorIdentity.Pages.Manage;
using Microsoft.Extensions.Options;
namespace TrackExpenses
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.
            

            builder.Services.AddDbContext<FinancasDbContext>(options => options.UseSqlServer("Server=" + Environment.MachineName +
                "; Database=TRACKEXPENSES;Trusted_Connection=True;TrustServerCertificate=True;"));

            //lock if Account is not confirmed
            builder.Services.AddIdentity<Client, IdentityRole>(options =>
            {
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequiredLength = 8;
                options.Password.RequireUppercase = true;
                options.Password.RequireLowercase = false;
                options.User.RequireUniqueEmail = true;
                options.SignIn.RequireConfirmedPhoneNumber = false;
                options.SignIn.RequireConfirmedEmail = false;

            })
                .AddEntityFrameworkStores<FinancasDbContext>()
                .AddRoles<IdentityRole>()
                .AddDefaultTokenProviders();

            builder.Services.AddControllersWithViews();

            var computerName = Environment.MachineName;
            Console.WriteLine(computerName);
            var app = builder.Build();
            // Configure the HTTP request pipeline.
            if (!app.Environment.IsDevelopment())
            {
                app.UseExceptionHandler("/Home/Error");
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }

            app.UseHttpsRedirection();
            app.UseStaticFiles();
            app.UseRouting();
            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllerRoute(
                name: "default",
                pattern: "{controller=Home}/{action=Index}/{id?}");

            // Role initialization
            using (var scope = app.Services.CreateScope())
            {
                var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
                var roles = new[] { "ADMINISTRATOR", "GROUPADMINISTRATOR", "USER", "MEMBER" };
            
                foreach (var role in roles)
                {
                    if (!await roleManager.RoleExistsAsync(role))
                        await roleManager.CreateAsync(new IdentityRole(role));
                }
            }
            // User initialization
            using (var scope = app.Services.CreateScope())
            {
                var userManager = scope.ServiceProvider.GetRequiredService<UserManager<Client>>();
                string email = "TESTE@MAIL.COM";
                string password = "Test1234";
                Console.WriteLine(userManager);
                var client = await userManager.FindByEmailAsync(email);
                if (client == null)
                {
                    client = new Client
                    {

                        FirstName = email,
                        LastName = email,
                        Email = email,
                        UserName = email,
                        Password = password,
                    };

                    var result = await userManager.CreateAsync(client, password);
                    if (result.Succeeded)
                    {
                        // Now assign role after user is created
                        await userManager.AddToRoleAsync(client, "ADMINISTRATOR");
                    }
                    else
                    {
                        // Handle creation failure
                        Console.WriteLine("Failed to create user: " + string.Join(", ", result.Errors.Select(e => e.Description)));
                    }
                }
                else
                {
                    Console.WriteLine("User already exists, proceeding to role assignment.");
                    await userManager.AddToRoleAsync(client, "ADMINISTRATOR");
                }
        }
            await app.RunAsync();

        }


    }
}


