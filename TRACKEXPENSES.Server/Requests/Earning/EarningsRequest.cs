using Microsoft.EntityFrameworkCore;
using TRACKEXPENSES.Server.Models;

namespace TRACKEXPENSES.Server.Requests.Earning
{
    public record EarningCreateRequest(
        string Name, decimal Amount, DateTime Date, string WalletId,
        RecurrenceKind RecurrenceKind = RecurrenceKind.None, int? RepeatCount = null, string? RRule = null,
        string? Category = null
    );
}
