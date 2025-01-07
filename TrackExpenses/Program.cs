using Microsoft.EntityFrameworkCore;
using TrackExpenses.Models;
using Microsoft.AspNetCore.Identity;
using TrackExpenses.Data;
using TrackExpenses.Extensions;
using Microsoft.Extensions.DependencyInjection;
using System;

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


            builder.Services.AddControllersWithViews().AddRazorRuntimeCompilation();

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

                var usermanager = scope.ServiceProvider.GetRequiredService<UserManager<Client>>();
                string email = "Teste12345@mail.com";

                var client = await usermanager.FindByEmailAsync(email);

                if (client == null)
                {

                    client = new Client
                    {

                        FirstName = email,
                        FamilyName = email,
                        Email = email,
                        UserName = email,
                        Password = email,
                    };

                    var result = await usermanager.CreateAsync(client, email);
                    if (result.Succeeded)
                    {
                        // now assign role after user is created
                        await usermanager.AddToRoleAsync(client, "administrator");
                    }
                    //else
                    //{
                    //    // handle creation failure
                    //    /*console.writeline("failed to create user: */" + string.join(", ", result.errors.select(e => e.description)));
                    //}
                }
                else
                {
                    //console.writeline("user already exists, proceeding to role assignment.");
                    await usermanager.AddToRoleAsync(client, "administrator");
                }
            }

                
            app.SetAdmin();
            await app.RunAsync();

    }


}
}


