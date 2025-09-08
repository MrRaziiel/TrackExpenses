// src/pages/Groups/GroupsList.jsx
import React, { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Title from "../../components/Titles/TitlePage";
import { useTheme } from "../../styles/Theme/Theme";
import { useLanguage } from "../../utilis/Translate/LanguageContext";
import apiCall from "../../services/ApiCallGeneric/apiCall";
import AuthContext from "../../services/Authentication/AuthContext";

export default function GroupsList() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { auth } = useContext(AuthContext) || {};

  const c = theme?.colors || {};
  const paper = c.background?.paper || "#111827";
  const border = c.menu?.border || "rgba(255,255,255,0.12)";
  const text = c.text?.primary || "#E5E7EB";
  const muted = c.text?.secondary || "#94A3B8";
  const hover = c.menu?.hoverBg || "rgba(255,255,255,0.06)";
  const accent = c.primary?.main || "#3B82F6";
  const errorCol = c.error?.main || "#EF4444";

  const tr = (k, fb) => { try { return k?.includes(".") ? t(k) : (k ?? fb); } catch { return fb ?? k; } };
  const norm = (s) => String(s || "").trim().toLowerCase();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // roles
  const roles = useMemo(() => {
    const r = (auth?.Roles ?? auth?.Role ?? auth?.roles ?? auth?.role) ?? [];
    return (Array.isArray(r) ? r : [r]).map((x) => String(x || "").toUpperCase());
  }, [auth]);
  const hasGroupAdminRole = roles.includes("GROUPADMINISTRATOR");

  // helpers para dados
  const unwrap = (v) => (Array.isArray(v) ? v : (v?.$values ?? []));
  const getMembers = (g) => unwrap(g?.members ?? g?.Members);
  const getAdmin = (g) => g?.admin ?? g?.Admin ?? null;

  const isMine = (g, myEmail) => {
    const me = norm(myEmail);
    if (!me) return false;

    const a = getAdmin(g);
    const adminEmail = norm(a?.email ?? a?.Email ?? "");
    if (adminEmail && adminEmail === me) return true;

    for (const m of getMembers(g)) {
      const em = norm(m?.email ?? m?.Email ?? "");
      if (em && em === me) return true;
    }
    return false;
  };

  const canEditDelete = (g) => {
    if (!hasGroupAdminRole) return false;
    const a = getAdmin(g);
    const adminId = String(a?.id ?? a?.Id ?? "");
    const adminEmail = norm(a?.email ?? a?.Email ?? "");
    const meId = String(auth?.Id || "");
    const meEmail = norm(auth?.Email || "");
    return (meId && adminId === meId) || (meEmail && adminEmail === meEmail);
  };

  // load
  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const email = auth?.Email || "";
      const res = await apiCall.get("/Group/List", {
        params: email ? { email } : undefined,
        validateStatus: () => true
      });

      if (res?.status >= 200 && res?.status < 300) {
        const raw = res?.data;
        const list = Array.isArray(raw) ? raw : (raw?.$values ?? []);
        // fallback: filtro no cliente para garantir
        const mine = (list || []).filter((g) => isMine(g, email));
        setGroups(mine);
      } else {
        setErr(res?.data?.message || tr("groups.list_error", "Could not load groups."));
      }
    } catch (e) {
      console.error("[GET /Group/List] error:", e);
      setErr(tr("groups.list_error", "Could not load groups."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [auth?.Email]);

  // ações
  const confirm = (msg) => window.confirm(msg);

  const handleEdit = (g) => {
    const id = g?.id ?? g?.Id;
    if (!id) return;
    navigate(`/Groups/Edit/${id}`);
  };

  const handleDelete = async (g) => {
    const id = g?.id ?? g?.Id;
    if (!id) return;
    if (!confirm(tr("groups.confirm_delete", "Are you sure you want to delete this group?"))) return;

    try {
      const res = await apiCall.delete("/Group/Delete", { params: { id }, validateStatus: () => true });
      if (res?.status >= 200 && res?.status < 300) {
        await load();
      } else {
        window.alert(res?.data?.message || tr("groups.delete_failed", "Could not delete the group."));
      }
    } catch (e) {
      console.error("[DELETE /Group/Delete] error:", e);
      window.alert(tr("groups.delete_failed", "Could not delete the group."));
    }
  };

  const handleLeave = async (g) => {
    const id = g?.id ?? g?.Id;
    if (!id) return;
    if (!confirm(tr("groups.confirm_leave", "Leave this group?"))) return;

    try {
      const res = await apiCall.delete("/Group/Leave", {
        params: { id },
        validateStatus: () => true
      });
      if (res?.status >= 200 && res?.status < 300) {
        await load();
      } else {
        window.alert(res?.data?.message || tr("groups.leave_failed", "Could not leave the group."));
      }
    } catch (e) {
      console.error("[DELETE /Group/Leave] error:", e);
      window.alert(tr("groups.leave_failed", "Could not leave the group."));
    }
  };

  // UI atoms
  const Tile = ({ dashed = false, onClick, children }) => (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      className={`w-full rounded-2xl p-10 ${onClick ? "cursor-pointer hover:-translate-y-0.5 transition-transform" : ""}`}
      style={{ backgroundColor: paper, border: `${dashed ? "1px dashed" : "1px solid"} ${border}`, minHeight: 220 }}
    >
      {children}
    </div>
  );

  const IconButton = ({ title, onClick, danger = false, children }) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm"
      style={{
        backgroundColor: hover,
        color: danger ? errorCol : text,
        border: `1px solid ${danger ? `${errorCol}55` : border}`
      }}
    >
      {children}
    </button>
  );

  const CreateTile = () => (
    <Tile dashed onClick={() => navigate("/CreateGroup")}>
      <div className="w-full h-full flex flex-col items-center justify-center text-center">
        <div
          className="flex items-center justify-center rounded-full mb-4"
          style={{ width: 64, height: 64, backgroundColor: hover, border: `1px solid ${border}` }}
        >
          <span style={{ fontSize: 28, color: accent, lineHeight: 0 }}>+</span>
        </div>
        <div className="text-lg font-semibold" style={{ color: text }}>
          {tr("common.createGroup", "Create group")}
        </div>
        <div className="text-sm mt-1" style={{ color: muted }}>
          {tr("groups.tap_to_create", "Tap to create")}
        </div>
      </div>
    </Tile>
  );

  const GroupTile = ({ g }) => {
    const id = g?.id ?? g?.Id;
    const name = g?.name ?? g?.Name ?? "—";
    const admin = getAdmin(g);
    const members = getMembers(g);

    const adminName = admin?.fullName ?? admin?.FullName ?? "";
    const adminEmail = admin?.email ?? admin?.Email ?? "";

    const iCanEditDelete = canEditDelete(g);

    return (
      <Tile>
        {/* header */}
        <div className="flex items-start justify-between mb-4 gap-4">
          <div className="text-xl font-semibold" style={{ color: text }}>{name}</div>

          <div className="flex items-center gap-2">
            {iCanEditDelete ? (
              <>
                {/* edit (✎) */}
                <IconButton title={tr("common.edit", "Edit")} onClick={() => handleEdit(g)}>
                  {/* pen glyph */}
                  <span aria-hidden>✎</span>
                </IconButton>

                {/* delete (×) */}
                <IconButton title={tr("common.delete", "Delete")} onClick={() => handleDelete(g)} danger>
                  <span aria-hidden>×</span>
                </IconButton>
              </>
            ) : (
              // membro normal → sair
              <IconButton title={tr("groups.leave", "Leave")} onClick={() => handleLeave(g)}>
                <span style={{ marginRight: 6 }} aria-hidden>🚪</span>
                {tr("groups.leave", "Leave")}
              </IconButton>
            )}
          </div>
        </div>

        {/* admin */}
        {admin && (
          <div className="text-sm mb-2" style={{ color: muted }}>
            <span className="opacity-80">{tr("groups.admin", "Admin")}:</span>{" "}
            <span style={{ color: text }}>
              {adminName || adminEmail || "—"}{adminEmail ? ` — ${adminEmail}` : ""}
            </span>
          </div>
        )}

        {/* members */}
        <div className="text-sm" style={{ color: text }}>
          <div className="opacity-80 mb-1">{tr("groups.members", "Members")}:</div>
          {Array.isArray(members) && members.length ? (
            <ul className="list-disc ml-6">
              {members.map((m, i) => {
                const nm = m?.fullName ?? m?.FullName ?? "";
                const em = m?.email ?? m?.Email ?? "";
                const key = m?.id ?? m?.Id ?? `${em}-${i}`;
                return <li key={key}>{nm || em || "—"}{em ? ` — ${em}` : ""}</li>;
              })}
            </ul>
          ) : (
            <div className="opacity-70">—</div>
          )}
        </div>
      </Tile>
    );
  };

  return (
    <div className="mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Title text={tr("groups.title", "Groups list")} />
      </div>

      {err && (
        <div
          className="mb-4 rounded-lg p-3 text-sm"
          style={{ backgroundColor: `${errorCol}1a`, color: errorCol, border: `1px solid ${errorCol}55` }}
        >
          {err}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl p-10 animate-pulse" style={{ backgroundColor: paper, border: `1px solid ${border}`, minHeight: 220 }}>
          <div className="h-6 w-48 mb-4 rounded" style={{ backgroundColor: hover }} />
          <div className="h-4 w-72 mb-2 rounded" style={{ backgroundColor: hover }} />
          <div className="h-4 w-64 rounded" style={{ backgroundColor: hover }} />
        </div>
      ) : (
        <>
          {groups?.length > 0 && (
            <div className="space-y-6 mb-6">
              {groups.map((g) => {
                const id = g?.id ?? g?.Id ?? Math.random().toString(36);
                return <GroupTile key={id} g={g} />;
              })}
            </div>
          )}

          {/* tile de criação, sempre com o mesmo look/spacing */}
          {groups?.length === 0 ? (
            <CreateTile />
          ) : (
            <div className="mt-2">
              <CreateTile />
            </div>
          )}
        </>
      )}
    </div>
  );
}
