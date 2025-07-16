using System.ComponentModel.DataAnnotations;

namespace TRACKEXPENSES.Server.Models
{
    public class ExpenseCategory
    {
        [Key]
        public int Id { get; set; }

        public string Name { get; set; }

        // Usuário que criou esta categoria
        public string UserId { get; set; }

        // Referência opcional para a categoria pai
        public int ParentCategoryId { get; set; }
        public virtual ExpenseCategory ParentCategory { get; set; }

        // Lista de subcategorias (um nível)
        public virtual List<ExpenseCategory> Subcategories { get; set; } = new List<Models.ExpenseCategory>();
    }
}
