using TRACKEXPENSES.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace TRACKEXPENSES.Server.Services.Expenses
{
    public sealed class InstallmentService : IInstallmentService
    {
        public InstallmentCalculationResult Calculate(InstallmentPlan plan)
        {
            if (plan is null) throw new ArgumentNullException(nameof(plan));
            if (plan.Principal <= 0) throw new ArgumentOutOfRangeException(nameof(plan.Principal));
            if (plan.Installments <= 0) throw new ArgumentOutOfRangeException(nameof(plan.Installments));

            var r = GetPeriodRate(plan.AnnualInterestRate, plan.Frequency); // ex.: anual/12
            var n = plan.Installments;
            var P = plan.Principal;

            decimal pmt;
            if (r == 0m)
            {
                pmt = Round2(P / n);
            }
            else
            {
                // PMT = P * r / (1 - (1+r)^-n)
                var denom = 1m - (decimal)Math.Pow((double)(1m + r), -n);
                pmt = Round2(P * r / denom);
            }

            var lines = new List<InstallmentLine>(n);
            var balance = P;
            for (int k = 1; k <= n; k++)
            {
                var due = AddPeriod(plan.FirstDueDate, plan.Frequency, k - 1);

                var interest = Round2(balance * r);
                var amort = Round2(pmt - interest);

                // Ajuste da última prestação para eliminar resíduo de arredondamento
                if (k == n)
                {
                    amort = balance;
                    pmt = Round2(interest + amort);
                }

                balance = Round2(balance - amort);

                lines.Add(new InstallmentLine
                {
                    Number = k,
                    DueDate = due,
                    Interest = interest,
                    Amortization = amort,
                    Payment = pmt,
                    Balance = balance
                });
            }

            var totalPaid = Round2(lines.Sum(l => l.Payment));
            return new InstallmentCalculationResult
            {
                Principal = P,
                AnnualInterestRate = plan.AnnualInterestRate,
                Installments = n,
                PeriodRate = r,
                Payment = pmt,
                TotalPaid = totalPaid,
                TotalInterest = Round2(totalPaid - P),
                FirstDueDate = plan.FirstDueDate,
                LastDueDate = lines.Last().DueDate,
                Lines = lines
            };
        }

        public IEnumerable<ExpenseInstance> GenerateInstallmentInstances(Expense expense, InstallmentPlan plan)
        {
            if (expense is null) throw new ArgumentNullException(nameof(expense));
            var calc = Calculate(plan);

            foreach (var line in calc.Lines)
            {
                yield return new ExpenseInstance
                {
                    Id = Guid.NewGuid().ToString(),
                    Expense = expense,
                    DueDate = line.DueDate,
                    Value = line.Payment,     // parcela (juros embutidos)
                    IsPaid = false,
                    PaidAmount = 0m
                };
            }
        }

        // ----------------- helpers -----------------

        private static decimal GetPeriodRate(decimal annualRate, Frequency freq)
        {
            if (annualRate <= 0m) return 0m;

            return freq switch
            {
                Frequency.Daily => annualRate / 360m,
                Frequency.Weekly => annualRate / 52m,
                Frequency.Monthly => annualRate / 12m,
                Frequency.Quarterly => annualRate / 4m,
                Frequency.Yearly => annualRate,
                _ => annualRate / 12m,
            };
        }

        private static DateTime AddPeriod(DateTime start, Frequency freq, int k)
        {
            return freq switch
            {
                Frequency.Daily => start.Date.AddDays(k),
                Frequency.Weekly => start.Date.AddDays(7 * k),
                Frequency.Monthly => SafeAddMonths(start.Date, k),
                Frequency.Quarterly => SafeAddMonths(start.Date, 3 * k),
                Frequency.Yearly => SafeAddMonths(start.Date, 12 * k),
                _ => SafeAddMonths(start.Date, k),
            };
        }

        // preserva “fim de mês” (28/29/30/31) corretamente
        private static DateTime SafeAddMonths(DateTime date, int months)
        {
            var target = date.AddMonths(months);
            var lastDay = DateTime.DaysInMonth(target.Year, target.Month);
            var day = Math.Min(date.Day, lastDay);
            return new DateTime(target.Year, target.Month, day, date.Hour, date.Minute, date.Second, date.Kind);
        }

        private static decimal Round2(decimal v) => Math.Round(v, 2, MidpointRounding.AwayFromZero);
    }
}
