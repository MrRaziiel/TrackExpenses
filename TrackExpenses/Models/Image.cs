namespace TrackExpenses.Models
{
    public class Image
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public required string Path { get; set; }
    }
}
