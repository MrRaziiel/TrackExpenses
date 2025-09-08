using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;


namespace TRACKEXPENSES.Server.Models
{
    public enum RecurrenceKind { None, Daily, Weekly, Monthly, Quarterly, Yearly, RRule }
    public enum Frequency { Daily, Weekly, Monthly, Quarterly, Yearly }

    public class InstallmentPlan
    {
        [Key] public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required] public string ExpenseId { get; set; }
        [ForeignKey(nameof(ExpenseId))] public Expense Expense { get; set; }

        // Valor financiado (principal), taxa anual (ex.: 0.12 = 12%)
        [Range(0, double.MaxValue)] public decimal Principal { get; set; }
        [Range(0, 1)] public decimal AnnualInterestRate { get; set; }

        // Nº de parcelas e frequência (normalmente Monthly)
        [Range(1, 480)] public int Installments { get; set; } = 12;
        public Frequency Frequency { get; set; } = Frequency.Monthly;

        public DateTime FirstDueDate { get; set; }

        // Se true, gera Instances com valor PMT (juros embutidos)
        public bool GenerateInstances { get; set; } = true;

        // Snapshot do cálculo (PMT e totais) p/ caching
        public decimal? CalculatedInstallmentAmount { get; set; }
        public decimal? TotalInterest { get; set; }
        public DateTime? CalculatedAt { get; set; }
    }

    public sealed class InstallmentCalculationResult
    {
        public decimal Principal { get; init; }
        public decimal AnnualInterestRate { get; init; }
        public int Installments { get; init; }
        public decimal PeriodRate { get; init; }         // ex.: mensal = anual/12

        public decimal Payment { get; init; }            // PMT (valor da prestação)
        public decimal TotalPaid { get; init; }          // Payment * Installments
        public decimal TotalInterest { get; init; }      // TotalPaid - Principal

        public DateTime FirstDueDate { get; init; }
        public DateTime LastDueDate { get; init; }

        public IReadOnlyList<InstallmentLine> Lines { get; init; } = Array.Empty<InstallmentLine>();
    }

    public sealed class InstallmentLine
    {
        public int Number { get; init; }                 // 1..n
        public DateTime DueDate { get; init; }
        public decimal Interest { get; init; }           // juros do período
        public decimal Amortization { get; init; }       // principal abatido no período
        public decimal Payment { get; init; }            // Interest + Amortization (≈ PMT)
        public decimal Balance { get; init; }            // saldo após pagamento
    }
}
