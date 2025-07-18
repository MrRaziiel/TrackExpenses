namespace TRACKEXPENSES.Server.ViewModels
{
    public class AddEarningsViewModel
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public decimal Amount { get; set; }
        public DateTime Date { get; set; }
        public string? Category { get; set; }
        public string UserEmail { get; set; }
        public string Periodicity { get; set; }
        public int? RepeatCount { get; set; }

        public bool IsActive { get; set; }
    }
}
