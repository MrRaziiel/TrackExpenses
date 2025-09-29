using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TRACKEXPENSES.Server.Data;
using TRACKEXPENSES.Server.Models;

namespace TRACKEXPENSES.Server.Controllers
{
    [ApiController]
    [Route("api/Dashboard")]
    public class DashboardController(
        FinancasDbContext db,
        UserManager<User> userManager
    ) : ControllerBase
    {
        private readonly FinancasDbContext _db = db;

        private async Task<string?> GetUserIdAsync()
        {
            var user = await userManager.GetUserAsync(User);
            return user?.Id;
        }

        private static IEnumerable<(DateOnly Start, DateOnly End, string Label)> Buckets(DateOnly from, DateOnly to, string g)
        {
            var list = new List<(DateOnly, DateOnly, string)>();
            var cur = from;

            if (g == "day")
            {
                while (cur <= to)
                {
                    list.Add((cur, cur, cur.ToString("dd/MM")));
                    cur = cur.AddDays(1);
                }
            }
            else if (g == "week")
            {
                while (cur <= to)
                {
                    int diff = (7 + (cur.DayOfWeek - DayOfWeek.Monday)) % 7;
                    var start = cur.AddDays(-diff);
                    var end = start.AddDays(6);
                    if (end > to) end = to;
                    var week = System.Globalization.ISOWeek.GetWeekOfYear(start.ToDateTime(TimeOnly.MinValue));
                    list.Add((start, end, $"W{week:D2}"));
                    cur = end.AddDays(1);
                }
            }
            else
            {
                while (cur <= to)
                {
                    var start = new DateOnly(cur.Year, cur.Month, 1);
                    var end = start.AddMonths(1).AddDays(-1);
                    if (end > to) end = to;
                    list.Add((start, end, start.ToString("MM/yyyy")));
                    cur = end.AddDays(1);
                }
            }

            return list;
        }

        private IQueryable<EarningInstance> EarningScope(string userId) =>
            _db.EarningInstances
               .Include(i => i.Earning).ThenInclude(e => e.Wallet)
               .Where(i => i.Earning.Wallet.UserId == userId);

        private IQueryable<ExpenseInstance> ExpenseScope(string userId) =>
            _db.ExpenseInstances
               .Include(i => i.Expense).ThenInclude(e => e.Wallet)
               .Where(i => i.Expense.Wallet.UserId == userId);

        [HttpGet("Summary")]
        public async Task<IActionResult> Summary([FromQuery] DateOnly from, [FromQuery] DateOnly to)
        {
            var userId = await GetUserIdAsync() ?? "";

            var ei = EarningScope(userId)
                .Where(i => (i.ExpectedDate ?? i.Earning.Date) >= from.ToDateTime(TimeOnly.MinValue)
                         && (i.ExpectedDate ?? i.Earning.Date) <= to.ToDateTime(TimeOnly.MaxValue));

            var xi = ExpenseScope(userId)
                .Where(i => i.DueDate >= from.ToDateTime(TimeOnly.MinValue)
                         && i.DueDate <= to.ToDateTime(TimeOnly.MaxValue));

            var incExpected = await ei.SumAsync(x => (decimal?)x.Amount) ?? 0m;
            var incReceived = await ei.Where(x => x.IsReceived || x.ReceivedAtUtc != null).SumAsync(x => (decimal?)x.Amount) ?? 0m;

            var expExpected = await xi.SumAsync(x => (decimal?)x.Value) ?? 0m;
            var expPaid = await xi.SumAsync(x => (decimal?)x.PaidAmount) ?? 0m;

            var net = incReceived - expPaid;

            // período anterior com a mesma duração
            var days = to.DayNumber - from.DayNumber + 1;
            var prevFrom = from.AddDays(-days);
            var prevTo = from.AddDays(-1);

            var prevIncome = await EarningScope(userId)
                .Where(i => (i.ExpectedDate ?? i.Earning.Date) >= prevFrom.ToDateTime(TimeOnly.MinValue)
                         && (i.ExpectedDate ?? i.Earning.Date) <= prevTo.ToDateTime(TimeOnly.MaxValue))
                .Where(i => i.IsReceived || i.ReceivedAtUtc != null)
                .SumAsync(i => (decimal?)i.Amount) ?? 0m;

            var prevExpense = await ExpenseScope(userId)
                .Where(i => i.DueDate >= prevFrom.ToDateTime(TimeOnly.MinValue)
                         && i.DueDate <= prevTo.ToDateTime(TimeOnly.MaxValue))
                .SumAsync(i => (decimal?)i.PaidAmount) ?? 0m;

            static double Trend(decimal cur, decimal prev) =>
                prev == 0 ? (cur == 0 ? 0 : 1) : (double)((cur - prev) / prev);

            return Ok(new
            {
                totalIncome = incReceived,
                totalExpense = expPaid,
                net,
                pctIncomeReceived = incExpected == 0 ? 1 : (double)(incReceived / incExpected),
                pctExpensePaid = expExpected == 0 ? 1 : (double)(expPaid / expExpected),
                trends = new
                {
                    income = Trend(incReceived, prevIncome),
                    expense = Trend(expPaid, prevExpense),
                    net = Trend(net, prevIncome - prevExpense)
                }
            });
        }

        [HttpGet("TimeSeries")]
        public async Task<IActionResult> TimeSeries([FromQuery] DateOnly from, [FromQuery] DateOnly to, [FromQuery] string granularity = "month")
        {
            var userId = await GetUserIdAsync() ?? "";
            var data = new List<object>();

            foreach (var b in Buckets(from, to, granularity))
            {
                var inc = await EarningScope(userId)
                    .Where(i => (i.ExpectedDate ?? i.Earning.Date) >= b.Start.ToDateTime(TimeOnly.MinValue)
                             && (i.ExpectedDate ?? i.Earning.Date) <= b.End.ToDateTime(TimeOnly.MaxValue))
                    .Where(i => i.IsReceived || i.ReceivedAtUtc != null)
                    .SumAsync(i => (decimal?)i.Amount) ?? 0m;

                var exp = await ExpenseScope(userId)
                    .Where(i => i.DueDate >= b.Start.ToDateTime(TimeOnly.MinValue)
                             && i.DueDate <= b.End.ToDateTime(TimeOnly.MaxValue))
                    .SumAsync(i => (decimal?)i.PaidAmount) ?? 0m;

                data.Add(new { label = b.Label, income = inc, expense = exp });
            }

            return Ok(data);
        }

        [HttpGet("Categories")]
        public async Task<IActionResult> Categories([FromQuery] DateOnly from, [FromQuery] DateOnly to, [FromQuery] string type = "income")
        {
            var userId = await GetUserIdAsync() ?? "";

            if (type.Equals("expense", StringComparison.OrdinalIgnoreCase))
            {
                var q = await ExpenseScope(userId)
                    .Where(i => i.DueDate >= from.ToDateTime(TimeOnly.MinValue)
                             && i.DueDate <= to.ToDateTime(TimeOnly.MaxValue))
                    .GroupBy(i => i.Expense.Category ?? "Uncategorized")
                    .Select(g => new { category = g.Key, amount = g.Sum(x => x.Value) })
                    .Where(x => x.amount > 0)
                    .OrderByDescending(x => x.amount)
                    .ToListAsync();

                return Ok(q);
            }
            else
            {
                var q = await EarningScope(userId)
                    .Where(i => (i.ExpectedDate ?? i.Earning.Date) >= from.ToDateTime(TimeOnly.MinValue)
                             && (i.ExpectedDate ?? i.Earning.Date) <= to.ToDateTime(TimeOnly.MaxValue))
                    .GroupBy(i => i.Earning.Category ?? "Uncategorized")
                    .Select(g => new { category = g.Key, amount = g.Sum(x => x.Amount) }) 
                    .Where(x => x.amount > 0)
                    .OrderByDescending(x => x.amount)
                    .ToListAsync();

                return Ok(q);
            }
        }

        [HttpGet("StatusSplit")]
        public async Task<IActionResult> StatusSplit([FromQuery] DateOnly from, [FromQuery] DateOnly to,
            [FromQuery] string type = "income", [FromQuery] string groupBy = "month")
        {
            var userId = await GetUserIdAsync() ?? "";
            var data = new List<object>();

            foreach (var b in Buckets(from, to, groupBy))
            {
                if (type == "income")
                {
                    var scope = EarningScope(userId)
                        .Where(i => (i.ExpectedDate ?? i.Earning.Date) >= b.Start.ToDateTime(TimeOnly.MinValue)
                                 && (i.ExpectedDate ?? i.Earning.Date) <= b.End.ToDateTime(TimeOnly.MaxValue));
                    var expected = await scope.SumAsync(i => (decimal?)i.Amount) ?? 0m;
                    var received = await scope.Where(i => i.IsReceived || i.ReceivedAtUtc != null)
                                              .SumAsync(i => (decimal?)i.Amount) ?? 0m;
                    data.Add(new { label = b.Label, expected, received, pending = expected - received });
                }
                else
                {
                    var scope = ExpenseScope(userId)
                        .Where(i => i.DueDate >= b.Start.ToDateTime(TimeOnly.MinValue)
                                 && i.DueDate <= b.End.ToDateTime(TimeOnly.MaxValue));
                    var expected = await scope.SumAsync(i => (decimal?)i.Value) ?? 0m;
                    var paid = await scope.SumAsync(i => (decimal?)i.PaidAmount) ?? 0m;
                    data.Add(new { label = b.Label, expected, paid, pending = expected - paid });
                }
            }

            return Ok(data);
        }

        [HttpGet("WalletBalances")]
        public async Task<IActionResult> WalletBalances([FromQuery] DateOnly from, [FromQuery] DateOnly to)
        {
            var userId = await GetUserIdAsync() ?? "";

            var inc = await EarningScope(userId)
                .Where(i => (i.ExpectedDate ?? i.Earning.Date) >= from.ToDateTime(TimeOnly.MinValue)
                         && (i.ExpectedDate ?? i.Earning.Date) <= to.ToDateTime(TimeOnly.MaxValue))
                .Where(i => i.IsReceived || i.ReceivedAtUtc != null)
                .GroupBy(i => new { i.Earning.WalletId, i.Earning.Wallet.Name })
                .Select(g => new { g.Key.WalletId, g.Key.Name, Amount = g.Sum(x => x.Amount) })
                .ToListAsync();

            var exp = await ExpenseScope(userId)
                .Where(i => i.DueDate >= from.ToDateTime(TimeOnly.MinValue)
                         && i.DueDate <= to.ToDateTime(TimeOnly.MaxValue))
                .GroupBy(i => new { i.Expense.WalletId, i.Expense.Wallet.Name })
                .Select(g => new { g.Key.WalletId, g.Key.Name, Amount = g.Sum(x => x.PaidAmount) })
                .ToListAsync();

            var all = inc.Select(x => x.WalletId!).Union(exp.Select(x => x.WalletId!)).Distinct();

            var result = all.Select(id => new
            {
                walletId = id,
                walletName = inc.FirstOrDefault(x => x.WalletId == id)?.Name
                          ?? exp.FirstOrDefault(x => x.WalletId == id)?.Name ?? "—",
                balance = (inc.FirstOrDefault(x => x.WalletId == id)?.Amount ?? 0m)
                        - (exp.FirstOrDefault(x => x.WalletId == id)?.Amount ?? 0m)
            });

            return Ok(result.OrderByDescending(x => x.balance));
        }
    }
}
