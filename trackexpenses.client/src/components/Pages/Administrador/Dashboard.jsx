import React from "react";
import { theme } from "../../Theme/Theme";

const Dashboard = () => {
  return (
    <div className="p-6 bg-[theme.colors.background] text-[theme.colors.text]">
      {/* Título */}
      <h1 className="text-2xl font-bold mb-4">Quick Overview</h1>
      <p className="text-[theme.colors.textSecondary] mb-6">
        Welcome to your personal e-banking dashboard.
      </p>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {[
          { label: "Total Balance", value: "$112,768" },
          { label: "Income", value: "$6,840" },
          { label: "Expenses", value: "$4,725" },
        ].map((card, index) => (
          <div
            key={index}
            className="p-4 bg-white shadow-md rounded-lg border border-[theme.colors.border]"
          >
            <p className="text-sm text-[theme.colors.textSecondary]">{card.label}</p>
            <h2 className="text-xl font-semibold">{card.value}</h2>
          </div>
        ))}
      </div>

      {/* Tabela de Transações */}
      <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
      <div className="bg-white shadow-md rounded-lg p-4 border border-[theme.colors.border]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              {[
                "Date",
                "Account",
                "Description",
                "Category",
                "Amount",
                "Actions",
              ].map((header, index) => (
                <th
                  key={index}
                  className="py-2 text-[theme.colors.textSecondary]"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              {
                date: "2023-07-10",
                account: "Savings (****5420)",
                description: "Pharmacy",
                category: "Healthcare",
                amount: "-$120.00",
              },
              {
                date: "2023-07-09",
                account: "Current (****9877)",
                description: "Salary Bonus",
                category: "Bonus",
                amount: "+$1,500.00",
              },
            ].map((transaction, index) => (
              <tr key={index} className="border-b">
                <td className="py-2">{transaction.date}</td>
                <td>{transaction.account}</td>
                <td>{transaction.description}</td>
                <td>{transaction.category}</td>
                <td
                  className={
                    transaction.amount.startsWith("+")
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {transaction.amount}
                </td>
                <td>
                  <button className="px-3 py-1 bg-[theme.colors.button] text-white rounded hover:bg-[theme.colors.buttonHover]">
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;