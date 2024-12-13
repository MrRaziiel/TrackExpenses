using System.ComponentModel.DataAnnotations;

namespace TrackExpenses.Models
{
    public class Expense
    {
        [Key]
        public int Id { get; set; }
        public required string Name { get; set; }
        public string? Description { get; set; }
        public  double Value {  get; set; }

        public string? UserId { get; set; }
    }
}
