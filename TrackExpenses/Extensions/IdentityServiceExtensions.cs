using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using TrackExpenses.Data;
using TrackExpenses.Models;

namespace TrackExpenses.Extensions
{
    public static class IdentityServiceExtensions
    {
        public static IServiceCollection AddIdentityServices(this IServiceCollection services)
        {
            services.AddIdentity<Client, IdentityRole>(options =>
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

            return services;
        }
    }

}
