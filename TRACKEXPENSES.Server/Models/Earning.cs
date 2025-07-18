namespace TRACKEXPENSES.Server.Models
{
    public class Earning
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public decimal Amount { get; set; }
        public DateTime Date { get; set; }
        public string? Category { get; set; }
        public string UserId { get; set; }
        public string? GroupId { get; set; }
        public string Periodicity { get; set; } 
        public int? RepeatCount { get; set; }

        public bool IsActive { get; set; }
    }
}
