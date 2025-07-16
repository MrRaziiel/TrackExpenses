namespace TRACKEXPENSES.Server.ViewModels
{
    public class CreateExpenseViewModel
    {
        public int Id { get; set; }
        public string? ClientId { get; set; }
        public DateTime? CreatedDate { get; set; }
        public string? Description { get; set; }
        public string? GroupId { get; set; }
        public string? ImagePath { get; set; }
        public bool? IsPayed { get; set; }
        public required string Name { get; set; }
        public double? PayAmount { get; set; }
        public double Value { get; set; }
    }
}
