import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

import Title from "../../components/Titles/TitlePage";
import Button from "../../components/Buttons/Button";
import Card from "../../components/UI/Card";
import GenericFilter from "../../components/Tables/GenericFilter";
import GenericTable from "../../components/Tables/GenericTable";
import { useTheme } from "../../styles/Theme/Theme";
import { useLanguage } from "../../utilis/Translate/LanguageContext";
import apiCall from "../../services/ApiCallGeneric/apiCall";

function Badge({ children, tone = "info" }) {
  const map = {
    ok:   { bg: "rgba(16,185,129,0.15)", fg: "#10B981" }, // verde
    err:  { bg: "rgba(239,68,68,0.15)", fg: "#EF4444" },  // vermelho
    info: { bg: "rgba(59,130,246,0.15)", fg: "#3B82F6" }, // azul
    warn: { bg: "rgba(245,158,11,0.15)", fg: "#F59E0B" }, // laranja
  }[tone] || { bg: "rgba(59,130,246,0.15)", fg: "#3B82F6" };

  return (
    <span
      className="inline-block px-2 py-1 rounded-full text-xs"
      style={{ background: map.bg, color: map.fg, whiteSpace: "nowrap" }}
    >
      {children}
    </span>
  );
}

export default function ListWallets() {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorSubmit, setErrorSubmit] = useState(null);

  const navigate = useNavigate();
  const { t } = useLanguage();
  const { theme } = useTheme();

  const [flt, setFlt] = useState({ q: "", status: "all" });

  const fetchWallets = async () => {
    try {
      setLoading(true);
      const res = await apiCall.get("/wallets?includeArchived=true");
      const data = res?.data ?? res;
      const list = Array.isArray(data) ? data : data?.$values ?? [];
      setWallets(list);
    } catch (e) {
      setErrorSubmit(e?.message || "Erro ao carregar carteiras.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  const statusOptions = useMemo(
    () => [
      { value: "all", label: t?.("common.all") || "Todos" },
      { value: "active", label: t?.("common.active") || "Ativas" },
      { value: "archived", label: t?.("common.archived") || "Arquivadas" },
      { value: "primary", label: t?.("common.primary") || "Primária" },
    ],
    [t]
  );

  const filteredWallets = useMemo(() => {
    const q = (flt.q || "").toLowerCase().trim();
    const status = (flt.status || "all").toLowerCase();

    return (wallets || []).filter((w) => {
      const name = (w?.name || "").toLowerCase();
      const currency = (w?.currency || "EUR").toLowerCase();
      const isArchived = !!w?.isArchived;
      const isPrimary = !!w?.isPrimary;

      const matchesText = !q || name.includes(q) || currency.includes(q);
      const matchesStatus =
        status === "all" ||
        (status === "active" && !isArchived) ||
        (status === "archived" && isArchived) ||
        (status === "primary" && isPrimary);

      return matchesText && matchesStatus;
    });
  }, [wallets, flt]);

const columns = [
  {
    key: "name",
    headerKey: "name",
    accessor: (w) => (
      <div className="flex items-center gap-2">
        <span className="font-medium">{w?.name || "-"}</span>
        {w?.isPrimary && <Badge tone="info">{t?.("common.primary") || "Primary"}</Badge>}
      </div>
    ),
  },
  {
    key: "currency",
    headerKey: "currency",
    accessor: () => <Badge tone="info">EUR (€)</Badge>,
  },
  {
    key: "status",
    headerKey: "status",
    accessor: (w) =>
      w?.isArchived
        ? <Badge tone="err">{t?.("common.archived") || "Archived"}</Badge>
        : <Badge tone="ok">{t?.("common.active") || "Active"}</Badge>,
  },
];
  return (
    <div className="space-y-6 min-h-screen">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Title text={t?.("wallets.list") || "Carteiras"} />
        <Button
          variant="primary"
          size="md"
          fullWidth={false}
          onClick={() => navigate("/CreateWallet")}
          className="shrink-0"
        >
          <span className="inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t?.("wallets.new") || "Nova Wallet"}
          </span>
        </Button>
      </div>

      <GenericFilter
        className="
          mt-2
          grid items-center gap-3
          grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto]
          [&_input]:h-11 [&_select]:h-11 [&_button]:h-11
        "
        value={flt}
        onChange={setFlt}
        t={t}
        theme={theme}
        searchPlaceholder={t?.("wallets.searchPlaceholder") || "Pesquisar carteiras..."}
        filters={[{ key: "status", type: "select", options: statusOptions }]}
      />

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="relative overflow-x-auto overflow-hidden">
          <GenericTable
            filteredData={filteredWallets}
            columns={columns}
            theme={theme}
            t={t}
            loading={loading}
            rowKey={(w) => w?.id}
            stickyHeader
            truncateKeys={["name"]}
            minTableWidth="48rem"
             headClassName="bg-gray-50 !rounded-none"
            headerCellClassName="!rounded-none"
            emptyMessage={t?.("common.noResults") || "Sem resultados"}
            edit={{
              enabled: true,
              navigate,
              navigateTo: (w) => `/EditWallet/${w.id}`,
            }}
            remove={{
              enabled: true,
              confirmMessage:
                t?.("common.confirmDelete") ||
                "Tens a certeza que queres apagar esta carteira?",
              doDelete: async (w) => {
                try {
                  await apiCall.delete(`/wallets/${w.id}`);
                  setWallets((prev) => prev.filter((x) => x.id !== w.id));
                  return true;
                } catch {
                  return false;
                }
              },
              onError: (err) =>
                setErrorSubmit(err?.message || "Erro ao apagar carteira."),
            }}
          />
        </div>
      </div>

      {errorSubmit && (
        <div className="text-sm text-red-600" role="alert">
          {errorSubmit}
        </div>
      )}
    </div>
  );
}
