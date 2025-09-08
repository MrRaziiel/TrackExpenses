using TRACKEXPENSES.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace TRACKEXPENSES.Server.Services.Expenses
{
    public interface IInstallmentService
    {
        InstallmentCalculationResult Calculate(InstallmentPlan plan);
        IEnumerable<ExpenseInstance> GenerateInstallmentInstances(Expense expense, InstallmentPlan plan);
    }
}
