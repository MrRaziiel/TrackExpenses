using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
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
        options.JsonSerializerOptions.PropertyNamingPolicy = null;
    });


builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        builder => builder
            .AllowAnyHeader()
            .AllowAnyMethod()
            .WithOrigins("http://localhost:3000"));
});


var app = builder.Build();

app.UseDefaultFiles();
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
}
app.UseDeveloperExceptionPage();    
app.UseCors("AllowFrontend");

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapFallbackToFile("/index.html");

await app.SetRoles();
await app.SetAdmin();
await app.SetCategories();
app.Run();