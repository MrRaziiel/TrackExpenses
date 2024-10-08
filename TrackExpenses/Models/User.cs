using System.ComponentModel.DataAnnotations;

namespace TrackExpenses.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }
        public required string Name { get; set; }
        public DateTime Birtday { get; set; }
        public double Mountant { get; set; }
        
        public List<Expense>? AllExpenses { get; set; }
    }
}
