using TRACKEXPENSES.Server.Models;
using Microsoft.EntityFrameworkCore;


namespace TRACKEXPENSES.Server.Requests.Expenses
{
    public record ExpenseCreateRequest(
        string Name, decimal Value, DateTime StartDate, string WalletId,
        RecurrenceKind RecurrenceKind = RecurrenceKind.None, int? RepeatCount = null, string? RRule = null,
        bool ShouldNotify = false, string? Category = null, string? Description = null,
        InstallmentPlanRequest? Installment = null
    );

    public record InstallmentPlanRequest(decimal Principal, decimal AnnualInterestRate, int Installments, DateTime FirstDueDate, Frequency Frequency = Frequency.Monthly);
}
