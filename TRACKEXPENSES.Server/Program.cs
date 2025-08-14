using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using System.Text;
using TRACKEXPENSES.Server.Data;
using TRACKEXPENSES.Server.Extensions;
using TRACKEXPENSES.Server.Services;


var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<FinancasDbContext>(options =>
{
    options.UseSqlServer(connectionString);
});

builder.Services.AddIdentityServices();
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
builder.Services.AddAuthentications(jwtSettings);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("https://localhost:64306") // Porta do front-end
             .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials(); 
    });
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.Preserve;
        options.JsonSerializerOptions.WriteIndented = true;
        options.JsonSerializerOptions.PropertyNamingPolicy = null;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

builder.Services.Configure<SmtpOptions>(
    builder.Configuration.GetSection("Smtp")); 
builder.Services.AddScoped<TRACKEXPENSES.Server.Services.IEmailSender, SmtpEmailSender>();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddAuthorization();
builder.Services.AddScoped<JwtService>();

var app = builder.Build();
app.UseDefaultFiles();

//Set FileProvider to Client APP (AKA front)
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "Images")),
    RequestPath = "/Images"
});

if (app.Environment.IsDevelopment())
{
    await using (var serviceScope = app.Services.CreateAsyncScope())
    await using (var dbContext = serviceScope.ServiceProvider.GetRequiredService<FinancasDbContext>())
    {
        await dbContext.Database.EnsureCreatedAsync();
    }

    app.UseSwagger();
    app.UseSwaggerUI();

    app.UseDeveloperExceptionPage(); 
}

app.UseCors("AllowFrontend");

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();


await app.SetRoles();
await app.SetAdmin();
await app.SetCategories();
app.Run();