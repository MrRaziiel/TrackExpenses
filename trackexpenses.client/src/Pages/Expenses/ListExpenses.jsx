import React, { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Title from "../../components/Titles/TitlePage";
import Button from "../../components/Buttons/Button";
import GenericFilter from "../../components/Tables/GenericFilter";
import GenericTable from "../../components/Tables/GenericTable";
import StatCard from "../../components/UI/StatCard";
import Card from "../../components/UI/Card";
import { useTheme } from "../../styles/Theme/Theme";
import { useLanguage } from "../../utilis/Translate/LanguageContext";
import apiCall from "../../services/ApiCallGeneric/apiCall";
import AuthContext from "../../services/Authentication/AuthContext";

const EP_LIST     = "Expenses/ListExpenses";
const EP_DELETE   = "Expenses/DeleteExpense";
const EP_WALLETS  = "/wallets?includeArchived=true";          
const ROUTE_EDIT  = (id) => `/Expenses/Edit/${id}`;

const unwrap = (v) => (Array.isArray(v) ? v : (v?.$values ?? []));
const N = (v) => (v ?? "").toString().trim();

function Chip({ children }) {
  return (
    <span
      className="inline-block px-2 py-1 rounded-full text-xs"
      style={{ background: "rgba(148,163,184,0.18)", color: "#94A3B8", whiteSpace: "nowrap" }}
    >
      {children}
    </span>
  );
}

export default function ListExpenses() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { auth } = useContext(AuthContext) || {};

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorSubmit, setErrorSubmit] = useState(null);

  // NEW: wallets para mostrar e filtrar
  const [wallets, setWallets] = useState([]);
  const walletMap = useMemo(() => {
    const map = {};
    (wallets || []).forEach(w => { map[w.Id ?? w.id] = N(w.Name ?? w.name); });
    return map;
  }, [wallets]);
  const walletOptions = useMemo(() => ([
    { value: "all", label: t?.("wallets.all") || "All wallets" },
    ...wallets.map(w => ({ value: w.Id ?? w.id, label: N(w.Name ?? w.name) }))
  ]), [wallets, t]);

  // filtros
  const [flt, setFlt] = useState({ q: "", category: "all", wallet: "all", paid: "all" });

  // carregar despesas
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErrorSubmit(null);
        const email = auth?.Email || "";
        if (!email) return;
        const res = await apiCall.get(EP_LIST, {
          params: { userEmail: email },
          validateStatus: () => true,
        });
        if (res?.status >= 200 && res?.status < 300) {
          const list = Array.isArray(res.data) ? res.data : unwrap(res.data);
          if (alive) setItems(list || []);
        } else if (alive) {
          setErrorSubmit(res?.data?.message || "Could not load expenses.");
        }
      } catch {
        if (alive) setErrorSubmit("Could not load expenses.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [auth?.Email]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await apiCall.get(EP_WALLETS, { validateStatus: () => true });
        if (!alive) return;
        const list = (r?.status >= 200 && r?.status < 300)
          ? (Array.isArray(r.data) ? r.data : unwrap(r.data))
          : [];
        setWallets(list || []);
      } catch {/* ignore */}
    })();
    return () => { alive = false; };
  }, []);

  // opções de categoria
  const categoryOptions = useMemo(() => {
    const names = new Set((items || []).map((x) => N(x?.Category)).filter(Boolean));
    return [
      { value: "all", label: t?.("common.allCategories") || "All categories" },
      ...[...names].sort((a, b) => a.localeCompare(b)).map((v) => ({ value: v, label: v })),
    ];
  }, [items, t]);

  // aplicar filtros
  const filtered = useMemo(() => {
    const q = (flt.q || "").toLowerCase().trim();
    const c = (flt.category || "all").toLowerCase();
    const w = (flt.wallet || "all");
    const paidFilter = (flt.paid || "all").toLowerCase();

    return (items || [])
      .map((e) => ({ ...e, _instances: unwrap(e?.Instances) }))
      .filter((e) => {
        const name = N(e?.Name).toLowerCase();
        const desc = N(e?.Description).toLowerCase();
        const cat  = N(e?.Category).toLowerCase();
        const matchesText = !q || name.includes(q) || desc.includes(q) || cat.includes(q);
        const matchesCat  = c === "all" || cat === c;

        //  filtro por carteira
        const matchesWallet = w === "all" || (e?.WalletId && String(e.WalletId) === String(w));

        const paidCount = e._instances.filter(i => i.IsPaid).length;
        const totalCount = e._instances.length || 0;
        const isFullyPaid = totalCount > 0 && paidCount === totalCount;
        const matchesPaid =
          paidFilter === "all" ||
          (paidFilter === "paid" && isFullyPaid) ||
          (paidFilter === "unpaid" && !isFullyPaid);

        return matchesText && matchesCat && matchesWallet && matchesPaid;
      });
  }, [items, flt]);

  // KPIs
  const totalPlanned     = useMemo(() => filtered.reduce((acc, e) => acc + Number(e?.Value || 0), 0), [filtered]);
  const totalAlreadyPaid = useMemo(() => filtered.reduce((acc, e) => acc + Number(e?.PayAmount || 0), 0), [filtered]);
  const remaining        = Math.max(0, totalPlanned - totalAlreadyPaid);

  // colunas (inclui Wallet)
  const columns = [
    { key: "name", headerKey: "name", accessor: (e) => N(e?.Name) || "-" },
    {
      key: "wallet",
      headerKey: "wallet",
      accessor: (e) => {
        const nm = walletMap[e?.WalletId] || "-";
        return nm !== "-" ? <Chip>{nm}</Chip> : "-";
      },
    },
    { key: "category", headerKey: "category", accessor: (e) => N(e?.Category) ? <Chip>{N(e?.Category)}</Chip> : "-" },
    {
      key: "value",
      headerKey: "amount",
      accessor: (e) => (
        <span style={{ color: theme.colors.error.main, fontWeight: 600 }}>
          {Number(e?.Value || 0).toLocaleString(undefined, { style: "currency", currency: "EUR" })}
        </span>
      ),
    },
    {
      key: "paid",
      headerKey: "paid",
      accessor: (e) => {
        const inst = unwrap(e?.Instances);
        const paid = inst.filter(i => i.IsPaid).length;
        const tot  = inst.length || 0;
        return tot ? `${paid}/${tot}` : "0/0";
      },
    },
    {
      key: "next",
      headerKey: "date",
      accessor: (e) => {
        const next = unwrap(e?.Instances)
          .filter(i => !i.IsPaid)
          .sort((a,b)=> new Date(a.DueDate)-new Date(b.DueDate))[0];
        return next?.DueDate ? new Date(next.DueDate).toLocaleDateString() : "-";
      },
    },
  ];

  return (
    <div className="space-y-6 min-h-screen">
      {/* Header + criar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Title text={t?.("expenses.list") || "Expenses"} />
        <Button onClick={() => navigate("/CreateExpense")}>
          {t?.("expenses.new") || "New expense"}
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title={t?.("expenses.kpis.planned") || "Planned (all)"} value={totalPlanned.toLocaleString(undefined,{style:"currency",currency:"EUR"})} />
        <StatCard title={t?.("expenses.kpis.paid")    || "Already paid"}   value={totalAlreadyPaid.toLocaleString(undefined,{style:"currency",currency:"EUR"})} />
        <StatCard title={t?.("expenses.kpis.remain")  || "Remaining"}      value={remaining.toLocaleString(undefined,{style:"currency",currency:"EUR"})} />
      </div>

      {/* Filtros (1 linha) */}
      <Card padding="sm" className="p-4">
              <GenericFilter
        forceOneLine // << garante tudo numa linha
        className="mt-2 [&_input]:h-11 [&_select]:h-11 [&_button]:h-11"
        value={flt}
        onChange={setFlt}
        t={t}
        theme={theme}
        searchPlaceholder={t("expenses.searchPlaceholder")}
        filters={[
          { key: "category", type: "select", options: categoryOptions },
          { key: "wallet",   type: "select", options: walletOptions },
          {
            key: "paid",
            type: "select",
            options: [
              { value: "all",    label: t("common.all") },
              { value: "paid",   label: t("expenses.filter.fullyPaid") },
              { value: "unpaid", label: t("expenses.filter.notPaid") },
            ],
          },
        ]}
      />

      </Card>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="relative overflow-x-auto">
          <GenericTable
            filteredData={filtered}
            columns={columns}
            theme={theme}
            t={t}
            loading={loading}
            rowKey={(e) => e?.Id}
            stickyHeader
            truncateKeys={["name", "category", "wallet"]}
            minTableWidth="76rem"
            headClassName="bg-gray-50"
            emptyMessage={t?.("common.noResults") || "No results"}
            edit={{ enabled: true, onEdit: (e) => navigate(ROUTE_EDIT(e?.Id)) }}
            remove={{
              enabled: true,
              confirmMessage: t?.("expenses.deleteConfirm") || "Delete this expense (and all its instances)?",
              doDelete: async (e) => {
                const res = await apiCall.post(EP_DELETE, { Id: e?.Id }, { validateStatus: () => true });
                if (res?.status >= 200 && res?.status < 300) {
                  setItems((prev) => prev.filter((x) => x.Id !== e.Id));
                  return true;
                }
                return false;
              },
              onError: (err) => setErrorSubmit(err?.message || (t?.("errors.deleteExpense") || "Could not delete expense.")),
            }}
          />
        </div>
      </div>

      {errorSubmit && <div className="text-sm text-red-600">{errorSubmit}</div>}
    </div>
  );
}
