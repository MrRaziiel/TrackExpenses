using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;


namespace TRACKEXPENSES.Server.Models
{
    public enum QrFormat { Unknown = 0, EPC_SEPA = 1, EMVCo = 2, Multibanco = 3, CustomText = 9 }

    public class ExpenseQrMetadata
    {
        [Key] public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required] public string ExpenseId { get; set; }
        [ForeignKey(nameof(ExpenseId))] public Expense Expense { get; set; }

        public QrFormat Format { get; set; }

        // payload original para auditoria
        public string RawPayload { get; set; }

        // campos “normalizados” (preenchidos quando existirem no QR)
        public string? MerchantName { get; set; }    // EPC: Name; EMVCo: merchant name
        public string? Iban { get; set; }            // EPC
        public string? Bic { get; set; }             // EPC (opcional)
        public string? Reference { get; set; }       // EPC remittance / MB Reference
        public string? Entity { get; set; }          // MB Entity
        public decimal? Amount { get; set; }         // EPC amount / EMVCo 54 / MB value
        public string? Currency { get; set; }        // EPC: “EUR”; EMVCo: 53/58 context
        public DateTime? DueDate { get; set; }       // quando existir no QR
    }
}
