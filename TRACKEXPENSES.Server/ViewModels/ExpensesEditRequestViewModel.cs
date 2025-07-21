using System.Text.Json.Serialization;

public class ExpensesEditRequestViewModel
{
    [JsonPropertyName("id")]
    public string Id { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; }

    [JsonPropertyName("category")]
    public string? Category { get; set; }

    [JsonPropertyName("description")]
    public string Description { get; set; }

    [JsonPropertyName("value")]
    public decimal Value { get; set; }

    [JsonPropertyName("payAmount")]
    public decimal? PayAmount { get; set; }

    [JsonPropertyName("startDate")]
    public DateTime StartDate { get; set; }

    [JsonPropertyName("endDate")]
    public DateTime? EndDate { get; set; }

    [JsonPropertyName("periodicity")]
    public string? Periodicity { get; set; }

    [JsonPropertyName("repeatCount")]
    public int? RepeatCount { get; set; }

    [JsonPropertyName("shouldNotify")]
    public bool ShouldNotify { get; set; }

    [JsonPropertyName("groupId")]
    public string? GroupId { get; set; }

    [JsonPropertyName("imageId")]
    public string? ImageId { get; set; }

    [JsonPropertyName("userId")]
    public string? UserId { get; set; }
}