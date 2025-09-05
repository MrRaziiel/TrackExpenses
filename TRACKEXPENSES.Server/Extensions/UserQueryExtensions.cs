using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using TRACKEXPENSES.Server.Models;

namespace TRACKEXPENSES.Server.Extensions
{
    public static class UserQueryExtensions
    {
        // só prepara a query (podes continuar a compor filtros, paginação, etc.)
        public static IQueryable<User> WithGroups(this IQueryable<User> query) =>
            query
                .Include(u => u.Groups);

        // atalhos já prontos que executam (async)
        public static Task<List<User>> ToListWithGroupsAsync(this IQueryable<User> query, CancellationToken ct = default) =>
            query.WithGroups().ToListAsync(ct);

        public static Task<User?> FirstOrDefaultWithGroupsAsync(this IQueryable<User> query, Expression<Func<User, bool>> pred, CancellationToken ct = default) =>
            query.WithGroups().FirstOrDefaultAsync(pred, ct);
    }

}
