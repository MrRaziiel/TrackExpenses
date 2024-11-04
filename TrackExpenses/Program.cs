using Microsoft.EntityFrameworkCore;
using TrackExpenses.App_Start;
using System;
using TrackExpenses.Models;
using Microsoft.AspNetCore.Identity;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();

builder.Services.AddDbContext<FinancasDbContext>(options => options.UseSqlServer("Server=" + Environment.MachineName +
    "; Database=TRACKEXPENSES;Trusted_Connection=True;TrustServerCertificate=True;"));

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
    .AddDefaultTokenProviders()
    ;
var computerName = Environment.MachineName;
Console.WriteLine(computerName);
//builder.Services.AddDbContext<FinancasDbContext>(options => options.UseInMemoryDatabase("FinancasDbContext"));
//builder.Services.AddDbContext<FinancasDbContext>(options => 
//    options.UseSqlServer("Server="+ Environment.MachineName+"; Database=TRACKEXPENSES;Trusted_Connection=True;TrustServerCertificate=True;"
//    ));
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

app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
