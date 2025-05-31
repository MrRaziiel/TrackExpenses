using Microsoft.EntityFrameworkCore;
using System.Text;
using TRACKEXPENSES.Server.Data;
using TRACKEXPENSES.Server.Extensions;


var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<FinancasDbContext>(options =>
{
    options.UseSqlServer(connectionString);
});


builder.Services.AddIdentityServices();
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]);
builder.Services.AddAuthentications(builder);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.Preserve;
        options.JsonSerializerOptions.WriteIndented = true;
    });


builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();


var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();

if (app.Environment.IsDevelopment())
{
    await using(var serviceScope = app.Services.CreateAsyncScope())
    await using(var dbContext = serviceScope.ServiceProvider.GetRequiredService<FinancasDbContext>())
    {
       await dbContext.Database.EnsureCreatedAsync();

    }
    app.UseSwagger();
    app.UseSwaggerUI();
}


app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapFallbackToFile("/index.html");

await app.SetRoles();
await app.SetAdmin();
app.Run();
