import React, { useMemo, useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";

import GenericTable from "../../components/Tables/GenericTable";
import GenericFilter from "../../components/Tables/GenericFilter";
import Title from "../../components/Titles/TitlePage";

import apiCall from "../../services/ApiCallGeneric/apiCall";
import { useLanguage } from "../../utilis/Translate/LanguageContext";
import AuthContext from "../../services/Authentication/AuthContext";
import { useTheme } from "../../styles/Theme/Theme";
import { Plus } from "lucide-react";

export default function UsersTable() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorSubmit, setErrorSubmit] = useState(null);

  const navigate = useNavigate();
  const { t } = useLanguage();
  const { auth, isAuthenticated, role } = useContext(AuthContext);
  const { theme } = useTheme();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await apiCall.get("Administrator/User/GetAllUsers");
        const list = res?.data?.ListUsers?.$values ?? [];
        if (alive) setUsers(list);
      } catch (e) {
        if (alive) setErrorSubmit(e.message || "Erro ao carregar utilizadores.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // filtro
  const [flt, setFlt] = useState({ q: "", group: "all" });

  const groupOptions = useMemo(() => {
    const s = new Set(
      (users || []).map(u => (u?.GroupOfUsers?.Name || "").trim()).filter(Boolean)
    );
    return [
      { value: "all", label: t ? t("common.all") : "Todos" },
      ...Array.from(s).map(g => ({ value: g, label: g })),
    ];
  }, [users, t]);

  const filteredUsers = useMemo(() => {
    const q = (flt.q || "").toLowerCase().trim();
    return (users || []).filter(u => {
      const name  = `${u?.FirstName || ""} ${u?.FamilyName || ""}`.toLowerCase();
      const email = (u?.Email || "").toLowerCase();
      const group = (u?.GroupOfUsers?.Name || "").toLowerCase();
      const matchesText  = !q || name.includes(q) || email.includes(q) || group.includes(q);
      const matchesGroup = flt.group === "all" || group === flt.group.toLowerCase();
      return matchesText && matchesGroup;
    });
  }, [users, flt]);

  const columns = [
    { key: "fullName", headerKey: "fullName", accessor: (u) => `${u.FirstName || ""} ${u.FamilyName || ""}`.trim() || "-" },
    { key: "email",    headerKey: "email",    accessor: (u) => u.Email },
    { key: "group",    headerKey: "group",    accessor: (u) => u.GroupOfUsers?.Name || "-" },
    { key: "birthday", headerKey: "birthday", accessor: (u) => (u.Birthday ? new Date(u.Birthday).toLocaleDateString() : "-") },
  ];

  const canDelete = () =>
    (typeof isAuthenticated === "boolean" ? isAuthenticated : !!auth?.Email) &&
    (role ? role === "ADMINISTRATOR" : auth?.Role === "ADMINISTRATOR");

   return (
        <div className="space-y-6">


      {/* header igual ao Expenses: título + botão a direita */}
      <div className="flex justify-between items-center">
        <Title text={t("common.users")} />

        <button
          onClick={() => navigate('/Register')} // usa a rota que já tens
          className="inline-flex items-center px-4 py-2 rounded-lg text-white"
          style={{ backgroundColor: theme?.colors?.primary?.main }}
        >
          <Plus className="h-5 w-5 mr-2" />
          {t('common.add')} {t('common.user') || 'User'}
        </button>
      </div>

      {/* barra de pesquisa fora do cartão (igual ao Expenses) */}
      <GenericFilter
        className="
        mt-2
        grid items-center gap-3
        grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto_auto]
        [&_input]:h-11 [&_select]:h-11 [&_button]:h-11
      "
        value={flt}
        onChange={setFlt}
        t={t}
        theme={theme}
        searchPlaceholder={t ? t("common.searchUsers") : "Search users..."}
        filters={[{ key: "group", type: "select", options: groupOptions }]}
      />

      {/* cartão com a tabela */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="relative overflow-x-auto">
          <GenericTable
            filteredData={filteredUsers}
            columns={columns}
            theme={theme}
            t={t}
            loading={loading}
            rowKey={(u) => u.Id || u.Email}
            stickyHeader
            truncateKeys={["fullName", "email"]}
            minTableWidth="56rem"
            headClassName="bg-gray-50"
            headerCellClassName="px-6 py-3 text-xs font-medium text-left uppercase tracking-wider"
            emptyMessage={t ? t("common.noResults") : "Sem resultados"}
            edit={{
              enabled: true,
              navigate,
              navigateTo: (u) => `/users/edit/${u.Id}/${u.Email}`,
            }}
            remove={{
              enabled: true,
              confirmMessage:
                t?.("common.confirmDelete") || "Tens a certeza que queres apagar este utilizador?",
              doDelete: async (u) => {
                if (!canDelete()) return false;
                const res = await apiCall.post("Administrator/User/DeleteUser", u.Id);
                if (res?.status === 200) {
                  setUsers(prev => prev.filter(x => x.Id !== u.Id));
                  return true;
                }
                return false;
              },
              onError: (err) => setErrorSubmit(err?.message || "Erro ao apagar utilizador."),
            }}
          />
        </div>
      </div>

      {errorSubmit && <div className="text-sm text-red-600">{errorSubmit}</div>}
    </div>
  );
}