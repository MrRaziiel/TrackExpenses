using TRACKEXPENSES.Server.Models;
using Microsoft.EntityFrameworkCore;


namespace TRACKEXPENSES.Server.Services.Expenses
{
    public interface IRecurrenceService
    {
        IEnumerable<DateTime> GenerateOccurrences(DateTime start, DateTime? end, RecurrenceKind kind, int? count, string? rrule = null);
    }
}
