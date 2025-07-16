namespace TRACKEXPENSES.Server.ViewModels
{
    public class CategoryCreateViewModel
    {
        public string UserId { get; set; }
        public string Name { get; set; }
        public string? ParentCategory { get; set; } 
    }

    public class CategoryResponse
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public List<SubcategoryResponse> Subcategories { get; set; } = new();
    }

    public class SubcategoryResponse
    {
        public int Id { get; set; }
        public string Name { get; set; }
    }
}
