using Microsoft.EntityFrameworkCore;

namespace TRACKEXPENSES.Server.ViewModels
{
    public sealed class ExpenseCreateRequestViewModel
    {
        public string UserEmail { get; set; } = default!;
        public string Name { get; set; } = default!;
        public string? Description { get; set; }
        public decimal Value { get; set; }
        public decimal? PayAmount { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int? RepeatCount { get; set; }
        public bool ShouldNotify { get; set; }
        public string? Periodicity { get; set; }
        public string? Category { get; set; }

        public string WalletId { get; set; } = default!;

        // upload
        public string? UploadType { get; set; }
        public IFormFile? Image { get; set; }
    }



}
