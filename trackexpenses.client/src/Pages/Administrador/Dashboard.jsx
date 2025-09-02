import React from "react";
import Card from "../../components/UI/Card";
import StatCard from "../../components/UI/StatCard";
// import Button from "../../components/Buttons/Button"; // removido para evitar conflito
import { TrendingUp, PiggyBank, Wallet, Plus } from "lucide-react";
import { useTheme } from "../../styles/Theme/Theme";

export default function Dashboard() {
  const { theme } = useTheme();
  const c = theme?.colors || {};

  const success = c?.success?.main || "#16a34a"; // fallback verde
  const error = c?.error?.main || "#dc2626";     // fallback vermelho
  const textSecondary = c?.text?.secondary || "#6b7280";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* KPIs */}
      <StatCard icon={TrendingUp} title="Total Gasto (Mês)" value="€ 1.245,40" trend="+8,3%" />
      <StatCard icon={PiggyBank} title="Poupança" value="€ 320,00" trend="+2,1%" />
      <StatCard icon={Wallet} title="Receitas" value="€ 2.100,00" trend="-1,8%" />

      {/* Lista/Gráfico recente dentro de Card */}
      <div className="lg:col-span-2">
        <Card
          title="Despesas Recentes"
          actions={
            // Se tiveres o teu Button, volta a usar e remove este <button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium shadow-sm border border-gray-200 hover:bg-gray-50"
            >
              <Plus className="h-4 w-4" />
              Nova Despesa
            </button>
          }
        >
          {/* coloca aqui o teu gráfico/lista existente */}
          <div style={{ color: textSecondary }} className="text-sm">
            (coloca aqui o teu componente de gráfico ou tabela)
          </div>
        </Card>
      </div>

      <Card title="Resumo Mensal">
        <div className="space-y-2 text-sm" style={{ color: textSecondary }}>
          <div className="flex justify-between">
            <span>Alimentação</span>
            <span>€ 430,00</span>
          </div>
          <div className="flex justify-between">
            <span>Transportes</span>
            <span>€ 120,00</span>
          </div>
          <div className="flex justify-between">
            <span>Habitação</span>
            <span>€ 420,00</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
