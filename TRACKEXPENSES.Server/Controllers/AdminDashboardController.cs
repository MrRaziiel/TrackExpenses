using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using TRACKEXPENSES.Server.Data;
using TRACKEXPENSES.Server.Models;

namespace TRACKEXPENSES.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminDashboardController(FinancasDbContext context) : ControllerBase
    {
        private readonly FinancasDbContext _db = context;

        static IEnumerable<(DateOnly Start, DateOnly End, string Label)> Buckets(DateOnly from, DateOnly to, string g)
        {
            var list = new List<(DateOnly, DateOnly, string)>(); var cur = from;
            if (g == "day")
            { while (cur <= to) { list.Add((cur, cur, cur.ToString("dd/MM"))); cur = cur.AddDays(1); } }
            else if (g == "week")
            {
                while (cur <= to)
                {
                    int diff = (7 + (cur.DayOfWeek - DayOfWeek.Monday)) % 7;
                    var start = cur.AddDays(-diff); var end = start.AddDays(6); if (end > to) end = to;
                    list.Add((start, end, $"W{ISOWeek.GetWeekOfYear(start.ToDateTime(TimeOnly.MinValue))}"));
                    cur = end.AddDays(1);
                }
            }
            else
            {
                while (cur <= to)
                {
                    var start = new DateOnly(cur.Year, cur.Month, 1);
                    var end = start.AddMonths(1).AddDays(-1); if (end > to) end = to;
                    list.Add((start, end, start.ToString("MM/yyyy")));
                    cur = end.AddDays(1);
                }
            }
            return list;
        }

        [HttpGet("Summary")]
        public async Task<IActionResult> Summary([FromQuery] DateOnly from, [FromQuery] DateOnly to)
        {
            var ei = _db.EarningInstances.Include(i => i.Earning)
                     .Where(i => (i.ExpectedDate ?? i.Earning.Date) >= from.ToDateTime(TimeOnly.MinValue)
                              && (i.ExpectedDate ?? i.Earning.Date) <= to.ToDateTime(TimeOnly.MaxValue));
            var xi = _db.ExpenseInstances.Include(i => i.Expense)
                     .Where(i => i.DueDate >= from.ToDateTime(TimeOnly.MinValue)
                              && i.DueDate <= to.ToDateTime(TimeOnly.MaxValue));

            var incExpected = await ei.SumAsync(i => (decimal?)i.Amount) ?? 0m;
            var incReceived = await ei.Where(i => i.IsReceived || i.ReceivedAtUtc != null).SumAsync(i => (decimal?)i.Amount) ?? 0m;
            var expExpected = await xi.SumAsync(i => (decimal?)i.Value) ?? 0m;
            var expPaid = await xi.SumAsync(i => (decimal?)i.PaidAmount) ?? 0m;

            var usersActive = await _db.Wallets.Select(w => w.UserId).Distinct().CountAsync();
            var groupsCount = await _db.Set<Group>().CountAsync();
            var walletsAct = await _db.Wallets.Where(w => !w.IsArchived).CountAsync();

            return Ok(new
            {
                totalIncome = incReceived,
                totalExpense = expPaid,
                net = incReceived - expPaid,
                pctIncomeReceived = incExpected == 0 ? 1 : (double)(incReceived / incExpected),
                pctExpensePaid = expExpected == 0 ? 1 : (double)(expPaid / expExpected),
                usersActive,
                groupsCount,
                walletsActive = walletsAct
            });
        }

        // split: none | category | group
        [HttpGet("TimeSeries")]
        public async Task<IActionResult> TimeSeries([FromQuery] DateOnly from, [FromQuery] DateOnly to,
            [FromQuery] string granularity = "month", [FromQuery] string split = "none")
        {
            var buckets = Buckets(from, to, granularity);

            if (split == "none")
            {
                var data = new List<object>();
                foreach (var b in buckets)
                {
                    var inc = await _db.EarningInstances.Include(i => i.Earning)
                        .Where(i => (i.ExpectedDate ?? i.Earning.Date) >= b.Start.ToDateTime(TimeOnly.MinValue)
                                 && (i.ExpectedDate ?? i.Earning.Date) <= b.End.ToDateTime(TimeOnly.MaxValue))
                        .Where(i => i.IsReceived || i.ReceivedAtUtc != null)
                        .SumAsync(i => (decimal?)i.Amount) ?? 0m;

                    var exp = await _db.ExpenseInstances.Include(i => i.Expense)
                        .Where(i => i.DueDate >= b.Start.ToDateTime(TimeOnly.MinValue)
                                 && i.DueDate <= b.End.ToDateTime(TimeOnly.MaxValue))
                        .SumAsync(i => (decimal?)i.PaidAmount) ?? 0m;

                    data.Add(new { label = b.Label, income = inc, expense = exp });
                }
                return Ok(data);
            }

            if (split == "category")
            {
                // devolve top 5 categorias por valor e bucket
                var catInc = await _db.EarningInstances.Include(i => i.Earning)
                    .Where(i => (i.ExpectedDate ?? i.Earning.Date) >= from.ToDateTime(TimeOnly.MinValue)
                             && (i.ExpectedDate ?? i.Earning.Date) <= to.ToDateTime(TimeOnly.MaxValue))
                    .Where(i => i.IsReceived || i.ReceivedAtUtc != null)
                    .GroupBy(i => i.Earning.Category)
                    .Select(g => new { category = g.Key, amount = g.Sum(x => x.Amount) })
                    .OrderByDescending(x => x.amount).Take(5).Select(x => x.category).ToListAsync();

                var catExp = await _db.ExpenseInstances.Include(i => i.Expense)
                    .Where(i => i.DueDate >= from.ToDateTime(TimeOnly.MinValue)
                             && i.DueDate <= to.ToDateTime(TimeOnly.MaxValue))
                    .GroupBy(i => i.Expense.Category!)
                    .Select(g => new { category = g.Key, amount = g.Sum(x => x.PaidAmount) })
                    .OrderByDescending(x => x.amount).Take(5).Select(x => x.category).ToListAsync();

                var topCats = catInc.Union(catExp).Distinct().Take(6).ToList();

                var data = new List<Dictionary<string, object>>();
                foreach (var b in buckets)
                {
                    var row = new Dictionary<string, object> { ["label"] = b.Label };
                    foreach (var c in topCats)
                    {
                        var inc = await _db.EarningInstances.Include(i => i.Earning)
                            .Where(i => (i.ExpectedDate ?? i.Earning.Date) >= b.Start.ToDateTime(TimeOnly.MinValue)
                                     && (i.ExpectedDate ?? i.Earning.Date) <= b.End.ToDateTime(TimeOnly.MaxValue))
                            .Where(i => (i.IsReceived || i.ReceivedAtUtc != null) && i.Earning.Category == c)
                            .SumAsync(i => (decimal?)i.Amount) ?? 0m;

                        var exp = await _db.ExpenseInstances.Include(i => i.Expense)
                            .Where(i => i.DueDate >= b.Start.ToDateTime(TimeOnly.MinValue)
                                     && i.DueDate <= b.End.ToDateTime(TimeOnly.MaxValue)
                                     && i.Expense.Category == c)
                            .SumAsync(i => (decimal?)i.PaidAmount) ?? 0m;

                        row[$"inc:{c}"] = inc;
                        row[$"exp:{c}"] = exp;
                    }
                    data.Add(row);
                }
                return Ok(data);
            }

            if (split == "group")
            {
                // Top 5 grupos por volume no período
                var top = await _db.ExpenseInstances.Include(i => i.Expense)
                    .Where(i => i.DueDate >= from.ToDateTime(TimeOnly.MinValue)
                             && i.DueDate <= to.ToDateTime(TimeOnly.MaxValue))
                    .Join(_db.Set<Dictionary<string, object>>("UserGroups"),
                          i => i.Expense.Wallet.UserId,
                          ug => EF.Property<string>(ug, "UserId"),
                          (i, ug) => new { i, groupId = EF.Property<string>(ug, "GroupId") })
                    .GroupBy(x => x.groupId)
                    .Select(g => new { groupId = g.Key, amount = g.Sum(x => x.i.PaidAmount) })
                    .OrderByDescending(x => x.amount).Take(5).Select(x => x.groupId).ToListAsync();

                var data = new List<Dictionary<string, object>>();
                foreach (var b in buckets)
                {
                    var row = new Dictionary<string, object> { ["label"] = b.Label };
                    foreach (var g in top)
                    {
                        var inc = await _db.EarningInstances.Include(i => i.Earning)
                            .Join(_db.Set<Dictionary<string, object>>("UserGroups"),
                                  i => i.Earning.Wallet.UserId,
                                  ug => EF.Property<string>(ug, "UserId"),
                                  (i, ug) => new { i, groupId = EF.Property<string>(ug, "GroupId") })
                            .Where(x => x.groupId == g)
                            .Where(x => (x.i.ExpectedDate ?? x.i.Earning.Date) >= b.Start.ToDateTime(TimeOnly.MinValue)
                                     && (x.i.ExpectedDate ?? x.i.Earning.Date) <= b.End.ToDateTime(TimeOnly.MaxValue))
                            .Where(x => x.i.IsReceived || x.i.ReceivedAtUtc != null)
                            .SumAsync(x => (decimal?)x.i.Amount) ?? 0m;

                        var exp = await _db.ExpenseInstances.Include(i => i.Expense)
                            .Join(_db.Set<Dictionary<string, object>>("UserGroups"),
                                  i => i.Expense.Wallet.UserId,
                                  ug => EF.Property<string>(ug, "UserId"),
                                  (i, ug) => new { i, groupId = EF.Property<string>(ug, "GroupId") })
                            .Where(x => x.groupId == g)
                            .Where(x => x.i.DueDate >= b.Start.ToDateTime(TimeOnly.MinValue)
                                     && x.i.DueDate <= b.End.ToDateTime(TimeOnly.MaxValue))
                            .SumAsync(x => (decimal?)x.i.PaidAmount) ?? 0m;

                        row[$"inc:{g}"] = inc;
                        row[$"exp:{g}"] = exp;
                    }
                    data.Add(row);
                }
                return Ok(data);
            }

            return BadRequest("split inválido");
        }

        [HttpGet("WalletsTop")]
        public async Task<IActionResult> WalletsTop([FromQuery] DateOnly from, [FromQuery] DateOnly to, [FromQuery] int take = 10)
        {
            var inc = await _db.EarningInstances.Include(i => i.Earning).ThenInclude(e => e.Wallet)
                .Where(i => (i.ExpectedDate ?? i.Earning.Date) >= from.ToDateTime(TimeOnly.MinValue)
                         && (i.ExpectedDate ?? i.Earning.Date) <= to.ToDateTime(TimeOnly.MaxValue))
                .Where(i => i.IsReceived || i.ReceivedAtUtc != null)
                .GroupBy(i => new { i.Earning.WalletId, i.Earning.Wallet.Name })
                .Select(g => new { g.Key.WalletId, g.Key.Name, Amount = g.Sum(x => x.Amount) })
                .ToListAsync();

            var exp = await _db.ExpenseInstances.Include(i => i.Expense).ThenInclude(e => e.Wallet)
                .Where(i => i.DueDate >= from.ToDateTime(TimeOnly.MinValue) && i.DueDate <= to.ToDateTime(TimeOnly.MaxValue))
                .GroupBy(i => new { i.Expense.WalletId, i.Expense.Wallet.Name })
                .Select(g => new { g.Key.WalletId, g.Key.Name, Amount = g.Sum(x => x.PaidAmount) })
                .ToListAsync();

            var all = inc.Select(x => x.WalletId!).Union(exp.Select(x => x.WalletId!)).Distinct();
            var result = all.Select(id => new {
                walletId = id,
                walletName = inc.FirstOrDefault(x => x.WalletId == id)?.Name
                           ?? exp.FirstOrDefault(x => x.WalletId == id)?.Name ?? "—",
                balance = (inc.FirstOrDefault(x => x.WalletId == id)?.Amount ?? 0m)
                        - (exp.FirstOrDefault(x => x.WalletId == id)?.Amount ?? 0m)
            })
            .OrderByDescending(x => x.balance)
            .Take(take);

            return Ok(result);
        }
    }
}
