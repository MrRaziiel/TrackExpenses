import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from "recharts";
import { Calendar, Wallet as WalletIcon } from "lucide-react";

import Title from "../../components/Titles/TitlePage";
import StatCard from "../../components/UI/StatCard";
import apiCall from "../../services/ApiCallGeneric/apiCall";
import { useTheme } from "../../styles/Theme/Theme";
import { useLanguage } from "../../utilis/Translate/LanguageContext";
import { useRequireWallet } from "../../services/Authentication/useRequireWallet";

const toISO = (d) => d.toISOString().slice(0, 10);
const firstDayOfMonth = (d=new Date()) => new Date(d.getFullYear(), d.getMonth(), 1);
const lastDayOfMonth  = (d=new Date()) => new Date(d.getFullYear(), d.getMonth()+1, 0);
const A = (x) => (Array.isArray(x) ? x : x?.$values ? x.$values : []);
const N = (v) => (v == null ? 0 : Number(v));
const pct = (p,t) => (N(t) > 0 ? N(p) / N(t) : 0);
const fmtCurrency = (v, cur="EUR") =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: cur }).format(N(v));

function Segmented({ items=[], value, onChange, className="" }) {
  return (
    <div className={`inline-flex rounded-xl overflow-hidden border ${className}`}>
      {items.map((it, i) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            aria-pressed={active}
            onClick={() => onChange(it.value)}
            className={`px-3 py-2 text-sm transition whitespace-nowrap
              ${active ? "bg-indigo-600 text-white" : "bg-transparent"}
              ${i > 0 ? "border-l" : ""}`}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

function PieBlock({ title, data, currency="EUR", good=false }) {
  const colors = good
    ? ["#2563eb","#4f46e5","#7c3aed","#0891b2","#0ea5e9","#22c55e","#14b8a6","#a855f7"]
    : ["#ef4444","#f97316","#eab308","#22c55e","#06b6d4","#3b82f6","#8b5cf6","#f43f5e"];
  return (
    <div className="min-w-0">
      <div className="text-sm mb-2 opacity-80">{title}</div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={A(data)} dataKey="amount" nameKey="category" outerRadius={90} innerRadius={50} paddingAngle={2}>
              {A(data).map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
            </Pie>
            <Legend />
            <Tooltip formatter={(v) => fmtCurrency(v, currency)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const BASE = "AdminDashboard";

  const { theme } = useTheme();
  const { t } = useLanguage();

  const [from, setFrom] = useState(firstDayOfMonth());
  const [to, setTo] = useState(lastDayOfMonth());
  const [granularity, setGranularity] = useState("month");
  const [type, setType] = useState("both");

  const [wallets, setWallets] = useState([]);
  const [walletId, setWalletId] = useState("");

  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [series, setSeries] = useState([]);
  const [statusIncome, setStatusIncome] = useState([]);
  const [statusExpense, setStatusExpense] = useState([]);
  const [catsIncome, setCatsIncome] = useState([]);
  const [catsExpense, setCatsExpense] = useState([]);
  const [walletBalances, setWalletBalances] = useState([]);
  const [currency, setCurrency] = useState("EUR");
  const [error, setError] = useState("");

  const c = theme.colors;
  const primary = c?.primary?.main || "#3b82f6";
  const success = c?.success?.main || "#16a34a";
  const danger  = c?.error?.main   || "#ef4444";
  const border  = c?.secondary?.light || "#334155";
  const bg      = c?.background?.paper;

  const showIncome = type === "both" || type === "income";
  const showExpense = type === "both" || type === "expense";

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        // Se tiveres endpoint específico para wallets no admin, troca aqui.
        const r = await apiCall.get("wallets", { params: { includeArchived: false } });
        const list = A(r?.data);
        if (cancel) return;
        setWallets(list);
        setWalletId(list[0]?.id || "");
        if (list[0]?.currency) setCurrency(list[0].currency);
      } catch {}
    })();
    return () => { cancel = true; };
  }, []);

  const params = useMemo(() => {
    const p = { from: toISO(from), to: toISO(to), granularity };
    if (walletId) p.walletId = walletId;
    return p;
  }, [from, to, granularity, walletId]);

  useEffect(() => {
    let canceled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [
          sumRes, tsRes, stIncRes, stExpRes, ciRes, ceRes, wbRes
        ] = await Promise.all([
          apiCall.get(`${BASE}/Summary`,       { params }),
          apiCall.get(`${BASE}/TimeSeries`,    { params }),
          apiCall.get(`${BASE}/StatusSplit`,   { params: { ...params, type: "income",  groupBy: granularity } }),
          apiCall.get(`${BASE}/StatusSplit`,   { params: { ...params, type: "expense", groupBy: granularity } }),
          apiCall.get(`${BASE}/Categories`,    { params: { ...params, type: "income" } }),
          apiCall.get(`${BASE}/Categories`,    { params: { ...params, type: "expense" } }),
          apiCall.get(`${BASE}/WalletBalances`,{ params }),
        ]);

        if (canceled) return;

        setSummary(sumRes?.data ?? null);
        setSeries(A(tsRes?.data).map(r => ({ label: r?.label ?? "", income: N(r?.income), expense: N(r?.expense) })));
        setStatusIncome(A(stIncRes?.data));
        setStatusExpense(A(stExpRes?.data));
        setCatsIncome(A(ciRes?.data).map(x => ({ category: x?.category ?? "—", amount: N(x?.amount) })));
        setCatsExpense(A(ceRes?.data).map(x => ({ category: x?.category ?? "—", amount: N(x?.amount) })));
        setWalletBalances(A(wbRes?.data).map(x => ({ walletName: x?.walletName ?? "—", balance: N(x?.balance) })));
        if (sumRes?.data?.currency) setCurrency(sumRes.data.currency);
      } catch (err) {
        if (!canceled) setError(err?.response?.data?.message || err?.message || "Failed");
      } finally {
        if (!canceled) setLoading(false);
      }
    })();
    return () => { canceled = true; };
  }, [params, granularity]);

  const statusMerged = useMemo(() => {
    const map = new Map();
    A(statusIncome).forEach(i => {
      const k = i.label ?? "";
      map.set(k, {
        label: k,
        incomeReceived: pct(i.received, i.expected),
        incomePending:  pct(i.pending,  i.expected),
        expensesPaid: 0,
        expensesPending: 0
      });
    });
    A(statusExpense).forEach(e => {
      const k = e.label ?? "";
      const row = map.get(k) || { label: k, incomeReceived: 0, incomePending: 0, expensesPaid: 0, expensesPending: 0 };
      row.expensesPaid    = pct(e.paid,    e.expected);
      row.expensesPending = pct(e.pending, e.expected);
      map.set(k, row);
    });
    return Array.from(map.values());
  }, [statusIncome, statusExpense]);

  return (
    <div className="space-y-6 min-h-screen">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Title text={t("dashboard.title")} subText={t("dashboard.subtitle")} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-3">
        <StatCard title={t("dashboard.kpis.totalIncome")}
          value={fmtCurrency(summary?.totalIncome, currency)}
          trend={`${Math.round((summary?.trends?.income ?? 0) * 100)}%`}
          trendColor={(summary?.trends?.income ?? 0) >= 0 ? theme.colors.success?.main : theme.colors.error?.main}
        />
        <StatCard title={t("dashboard.kpis.totalExpense")}
          value={fmtCurrency(summary?.totalExpense, currency)}
          trend={`${Math.round((summary?.trends?.expense ?? 0) * 100)}%`}
          trendColor={(summary?.trends?.expense ?? 0) >= 0 ? theme.colors.error?.main : theme.colors.success?.main}
        />
        <StatCard title={t("dashboard.kpis.net")}
          value={fmtCurrency(summary?.net, currency)}
          trend={`${Math.round((summary?.trends?.net ?? 0) * 100)}%`}
          trendColor={(summary?.trends?.net ?? 0) >= 0 ? theme.colors.success?.main : theme.colors.error?.main}
        />
        <StatCard title={t("dashboard.kpis.progress")}
          value={`${Math.round((summary?.pctIncomeReceived ?? 0) * 100)}% / ${Math.round((summary?.pctExpensePaid ?? 0) * 100)}%`}
          trend={t("dashboard.kpis.progress_hint")}
          trendColor={theme.colors.text?.secondary}
        />
        <StatCard title={t("dashboard.kpis.walletBalance")}
          value={fmtCurrency((summary?.totalIncome ?? 0) - (summary?.totalExpense ?? 0), currency)}
          trend={t("dashboard.kpis.walletBalance_hint")}
          trendColor={theme.colors.text?.secondary}
          icon={WalletIcon}
        />
      </div>

      {/* Filtros */}
      <div className="grid gap-3 items-stretch grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1 flex items-center gap-2 border rounded-xl px-3 py-2 min-w-0"
             style={{ borderColor: border, background: bg }}>
          <WalletIcon className="w-4 h-4 shrink-0" />
          <select
            value={walletId}
            onChange={(e) => setWalletId(e.target.value)}
            className="bg-transparent outline-none w-full text-sm md:text-base truncate"
            style={{ WebkitAppearance: "none", appearance: "none" }}
          >
            {wallets.map(w => (
              <option key={w.id} value={w.id}>
                {w.name}{w.isPrimary ? ` (${t("dashboard.filters.wallet_primary")})` : ""}
              </option>
            ))}
            <option value="">{t("dashboard.filters.wallet_all")}</option>
          </select>
        </div>

        <div className="flex items-center gap-2 border rounded-xl px-3 py-2"
             style={{ borderColor: border, background: bg }}>
          <Calendar className="w-4 h-4 shrink-0" />
          <input type="date" value={toISO(from)} onChange={e => setFrom(new Date(e.target.value))}
                 className="bg-transparent outline-none w-full" />
        </div>

        <div className="flex items-center gap-2 border rounded-xl px-3 py-2"
             style={{ borderColor: border, background: bg }}>
          <Calendar className="w-4 h-4 shrink-0" />
          <input type="date" value={toISO(to)} onChange={e => setTo(new Date(e.target.value))}
                 className="bg-transparent outline-none w-full" />
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
          <Segmented
            value={granularity}
            onChange={setGranularity}
            items={[
              { value: "day",   label: t("dashboard.filters.day") },
              { value: "week",  label: t("dashboard.filters.week") },
              { value: "month", label: t("dashboard.filters.month") },
            ]}
            className="border-slate-600"
          />
          <Segmented
            value={type}
            onChange={setType}
            items={[
              { value: "both",   label: t("dashboard.filters.type_both") },
              { value: "income", label: t("dashboard.filters.type_income") },
              { value: "expense",label: t("dashboard.filters.type_expense") },
            ]}
            className="border-slate-600"
          />
        </div>
      </div>

      {/* Evolução */}
      <div className="rounded-2xl border p-4" style={{ borderColor: border, background: bg }}>
        <div className="mb-3 font-medium">{t("dashboard.charts.evolution")}</div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke={border} />
              <XAxis dataKey="label" stroke={theme.colors.text?.secondary} />
              <YAxis stroke={theme.colors.text?.secondary} />
              <Tooltip contentStyle={{ background: bg, borderColor: border }}
                formatter={(v) => fmtCurrency(v, currency)} />
              {showIncome  && <Line type="monotone" dataKey="income"  stroke={success} strokeWidth={2} dot={false} />}
              {showExpense && <Line type="monotone" dataKey="expense" stroke={danger}  strokeWidth={2} dot={false} />}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Categorias + Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="rounded-2xl border p-4 lg:col-span-2" style={{ borderColor: border, background: bg }}>
          <div className="mb-3 font-medium">{t("dashboard.charts.categories")}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <PieBlock title={t("dashboard.charts.income")}  data={catsIncome}  currency={currency} good />
            <PieBlock title={t("dashboard.charts.expenses")} data={catsExpense} currency={currency} />
          </div>
        </div>

        <div className="rounded-2xl border p-4 min-w-0" style={{ borderColor: border, background: bg }}>
          <div className="mb-3 font-medium">{t("dashboard.charts.status")}</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusMerged}>
                <CartesianGrid strokeDasharray="3 3" stroke={border} />
                <XAxis dataKey="label" stroke={theme.colors.text?.secondary} />
                <YAxis stroke={theme.colors.text?.secondary} tickFormatter={(v) => `${Math.round(v * 100)}%`} />
                <Tooltip formatter={(v) => `${Math.round(v * 100)}%`} contentStyle={{ background: bg, borderColor: border }} />
                <Legend />
                {showIncome && (
                  <>
                    <Bar dataKey="incomeReceived" stackId="inc" name={t("dashboard.legend.incomeReceived")} fill={success} />
                    <Bar dataKey="incomePending"  stackId="inc" name={t("dashboard.legend.incomePending")}  fill={primary} />
                  </>
                )}
                {showExpense && (
                  <>
                    <Bar dataKey="expensesPaid"    stackId="exp" name={t("dashboard.legend.expensesPaid")}    fill={danger} />
                    <Bar dataKey="expensesPending" stackId="exp" name={t("dashboard.legend.expensesPending")} fill={border} />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Wallet balances */}
      <div className="rounded-2xl border p-4" style={{ borderColor: border, background: bg }}>
        <div className="mb-3 font-medium">{t("dashboard.charts.wallets")}</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={walletBalances} layout="vertical" margin={{ left: 80, right: 20, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={border} />
              <XAxis type="number" stroke={theme.colors.text?.secondary} tickFormatter={(v) => fmtCurrency(v, currency)} />
              <YAxis type="category" dataKey="walletName" stroke={theme.colors.text?.secondary} width={120} />
              <Tooltip contentStyle={{ background: bg, borderColor: border }} formatter={(v) => fmtCurrency(v, currency)} />
              <Bar dataKey="balance" fill={primary} radius={[4,4,4,4]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {error && (
        <div className="rounded-xl p-4 border" style={{ borderColor: danger, background: bg }}>
          <div className="font-medium" style={{ color: danger }}>{t("dashboard.error_title")}</div>
          <div className="text-sm opacity-80">{error}</div>
        </div>
      )}
      {loading && <div className="text-sm opacity-70">{t("common.loading")}…</div>}
    </div>
  );
}
