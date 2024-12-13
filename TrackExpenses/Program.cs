using Microsoft.EntityFrameworkCore;
using TrackExpenses.Models;
using Microsoft.AspNetCore.Identity;
using TrackExpenses.Data;
using TrackExpenses.Extensions;

namespace TrackExpenses
{
    public class Program
    {
        
        public static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

            builder.Services.AddDbContext<FinancasDbContext>(options =>
            {
                
                options.UseSqlServer(connectionString);
            });

            //lock if Account is not confirmed
            builder.Services.AddIdentityServices();


            builder.Services.AddControllersWithViews();

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
            //    using (var scope = app.Services.CreateScope())
            //    {
            //        //remove production
            //        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<Client>>();
            //        string email = "TESTE12345@MAIL.COM";
            //        string password = "TESTE12345@MAIL.COM";
            //        var client = await userManager.FindByEmailAsync(email);

            //        if (client == null)
            //        {
            //            client = new Client
            //            {

            //                FirstName = email,
            //                FamilyName = email,
            //                Email = email,
            //                UserName = email,
            //                Password = password,
            //            };
            //            var result = await userManager.CreateAsync(client, password);
            //            if (result.Succeeded)
            //            {
            //                // Now assign role after user is created
            //                await userManager.AddToRoleAsync(client, "ADMINISTRATOR");
            //            }
            //            else
            //            {
            //                // Handle creation failure
            //                Console.WriteLine("Failed to create user: " + string.Join(", ", result.Errors.Select(e => e.Description)));
            //            }
            //        }
            //        else
            //        {
            //            Console.WriteLine("User already exists, proceeding to role assignment.");
            //            await userManager.AddToRoleAsync(client, "ADMINISTRATOR");
            //        }
            //}
            app.SetAdmin();
            await app.RunAsync();

        }


    }
}


