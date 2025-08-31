// pages/Administrador/Dashboard.jsx
import React from "react";
import Card from "../../components/UI/Card";
import StatCard from "../../components/UI/StatCard";
import Button from "../../components/Buttons/Button";
import { TrendingUp, PiggyBank, Wallet, Plus } from "lucide-react";
import { useTheme } from "../../styles/Theme/Theme";

export default function Dashboard() {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* KPIs */}
      <StatCard icon={TrendingUp} title="Total Gasto (Mês)" value="€ 1.245,40" trend="+8.3%" trendColor={c.success?.main} />
      <StatCard icon={PiggyBank}   title="Poupança"          value="€ 320,00"   trend="+2.1%" trendColor={c.success?.main} />
      <StatCard icon={Wallet}      title="Receitas"          value="€ 2.100,00" trend="-1.8%" trendColor={c.error?.main} />

      {/* Gráfico/Lista recente dentro de Card */}
      <div className="lg:col-span-2">
        <Card
          title="Despesas Recentes"
          actions={
            <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
              Nova Despesa
            </Button>
          }
        >
          {/* aqui entra o teu gráfico/lista existente */}
          <div style={{ color: c.text?.secondary }} className="text-sm">
            (coloca aqui o teu componente de gráfico ou tabela)
          </div>
        </Card>
      </div>

      <Card title="Resumo Mensal">
        <div className="space-y-2 text-sm" style={{ color: c.text?.secondary }}>
          <div className="flex justify-between"><span>Alimentação</span><span>€ 430,00</span></div>
          <div className="flex justify-between"><span>Transportes</span><span>€ 120,00</span></div>
          <div className="flex justify-between"><span>Habitação</span><span>€ 420,00</span></div>
        </div>
      </Card>
    </div>
  );
}
