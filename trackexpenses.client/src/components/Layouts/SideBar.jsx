// src/components/Layouts/SideBar.jsx
import React, { useEffect, useMemo, useState, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, Settings, LogOut, DollarSign  } from "lucide-react";
import { useTheme } from "../../styles/Theme/Theme";
import useLogout from "../../services/Authentication/Logout";
import apiCall from "../../services/ApiCallGeneric/apiCall";
import AuthContext from "../../services/Authentication/AuthContext";
import { useLanguage } from "../../utilis/Translate/LanguageContext";

export default function SideBar({
  items = [],
  collapsed = false,
  onToggle,
  user = {},
}) {
  const { theme } = useTheme();
  const loc = useLocation();
  const logout = useLogout();
  const { role, auth } = useContext(AuthContext);
  const { t } = useLanguage();

  // ---------------- perfil ----------------
  const [profile, setProfile] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    avatarUrl: user?.avatarUrl || "",
  });

  const shallowEqual = (a, b) => {
    const ak = Object.keys(a);
    const bk = Object.keys(b);
    if (ak.length !== bk.length) return false;
    for (const k of ak) if (a[k] !== b[k]) return false;
    return true;
  };

  useEffect(() => {
    const next = {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
      avatarUrl: user?.avatarUrl ?? "",
    };
    setProfile((p) => (shallowEqual(p, next) ? p : next));
  }, [user?.firstName, user?.lastName, user?.email, user?.avatarUrl]);

  useEffect(() => {
    if (auth?.path && auth.path !== profile.avatarUrl) {
      setProfile((p) => ({ ...p, avatarUrl: auth.path }));
    }
  }, [auth?.path, profile.avatarUrl]);

  useEffect(() => {
    const email = auth?.Email?.trim();
    if (!email) return;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await apiCall.get(
          `/User/GetPhotoProfileAndName/${encodeURIComponent(email)}`,
          { signal: controller.signal, validateStatus: () => true }
        );
        const fn = res?.data?.FirstName ?? res?.data?.firstName ?? "";
        const ln = res?.data?.FamilyName ?? res?.data?.familyName ?? "";
        const photoPath = res?.data?.PhotoPath ?? res?.data?.photoPath ?? "";
        let avatarUrl = "";
        if (photoPath && photoPath !== "NoPhoto") {
          const base = (
            import.meta.env.VITE_FILES_BASE_URL ||
            import.meta.env.VITE_API_BASE_URL ||
            ""
          ).replace(/\/+$/, "");
          avatarUrl = `${base}/${String(photoPath).replace(/^\/+/, "")}?t=${Date.now()}`;
        }
        setProfile((p) => ({
          ...p,
          firstName: p.firstName || fn,
          lastName: p.lastName || ln,
          email,
          avatarUrl: avatarUrl || p.avatarUrl,
        }));
      } catch {}
    })();
    return () => controller.abort();
  }, [auth?.Email]);

  // ---------------- cores ----------------
  const colors =
    theme?.colors?.menu ?? {
      bg: "#0F172A",
      border: "#1E293B",
      text: "#E5E7EB",
      muted: "#9CA3AF",
      hoverBg: "rgba(255,255,255,0.06)",
      activeBg: "rgba(99,102,241,0.12)",
      activeText: theme?.colors?.primary?.main || "#60A5FA",
    };

  // ---------------- roles & grupos ----------------
  const N = (v) => String(v ?? "").trim().toUpperCase();

  const userRoles = useMemo(() => {
    if (!role) return [];
    if (Array.isArray(role)) return role.map(N).filter(Boolean);
    if (typeof role === "string")
      return role
        .split(/[,\s]+/)
        .map(N)
        .filter(Boolean);
    return [];
  }, [role]);

  const isAdmin = userRoles.includes("ADMINISTRATOR");

  const normalizeRole = (rawRole) => {
    let r = N(rawRole);
    if (!r) r = "USER";
    if (r.startsWith("ADMIN")) r = "ADMINISTRATOR";
    if (r.startsWith("GROUP")) r = "GROUPADMINISTRATOR";
    if (["GROUP-ADMIN", "GROUP_ADMIN"].includes(r)) r = "GROUPADMINISTRATOR";
    return r;
  };

  const canSee = (rawRole) => {
    if (isAdmin) return true;
    const r = normalizeRole(rawRole);
    return r === "USER" || userRoles.includes(r);
  };

  // label helper: se vier key tipo "common.dashboard", traduz
  const tr = (s) => {
    try {
      return s && s.includes(".") ? t(s) : s;
    } catch {
      return s;
    }
  };

  const groups = useMemo(() => {
    const g = { ADMIN: [], GROUPADMIN: [], USER: [] };
    items.forEach((i) => {
      if (!i || i.visible === false) return;
      if (!canSee(i.role)) return;
      const r = normalizeRole(i.role);
      if (r === "ADMINISTRATOR") g.ADMIN.push(i);
      else if (r === "GROUPADMINISTRATOR") g.GROUPADMIN.push(i);
      else g.USER.push(i);
    });
    return g;
  }, [items, userRoles, isAdmin]);

  // ---------------- UI ----------------
const Section = ({ title, list, first = false }) => {
  if (!list?.length) return null;
  return (
    <div
      className={first ? "" : "mt-3 pt-2 border-t"}
      style={{ borderColor: colors.border }}
    >
      {!collapsed && (
        <div
          className="px-4 pb-2 text-base font-bold uppercase tracking-wide text-center"
          style={{ color: colors.muted }}
        >
          {title}
        </div>
      )}

      {list.map(({ to, icon: Icon, label }) => {
        const active = loc.pathname.toLowerCase().startsWith(to.toLowerCase());
        return (
          <Link
            key={to}
            to={to}
            className="relative mx-2 mb-1 flex items-center gap-3 px-3 py-2 rounded transition-colors"
            style={{
              backgroundColor: active ? colors.activeBg : "transparent",
              color: active ? colors.activeText : colors.text,
            }}
            title={collapsed ? tr(label) : undefined}
          >
            {active && (
              <span
                className="absolute left-0 top-0 bottom-0 my-1 rounded-r"
                style={{
                  width: 4,
                  background: theme?.colors?.primary?.main || "#60A5FA",
                }}
              />
            )}
            {Icon && (
              <Icon
                className="h-5 w-5 shrink-0"
                style={{ color: active ? colors.activeText : colors.muted }}
              />
            )}
            {!collapsed && <span className="text-sm truncate">{tr(label)}</span>}
          </Link>
        );
      })}
    </div>
  );
};


  const avatarUrl = auth?.path || profile.avatarUrl;

  return (
    <aside
      className={`hidden md:flex flex-col flex-shrink-0 transition-[width] duration-300 ease-in-out ${
        collapsed ? "w-14" : "w-64"
      }`}
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {/* topo / toggle */}
      <div className="flex items-center justify-end h-12 px-2 border-b" style={{ borderColor: colors.border }}>
        <button
          onClick={onToggle}
          className="p-2 rounded-md"
          style={{ color: colors.muted }}
          title={collapsed ? "Expand" : "Collapse"}
          aria-label="toggle sidebar"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* navegação */}
      <nav className="flex-1 overflow-y-auto py-2">
        <Section title={t("common.admin") || "Admin"} list={groups.ADMIN} first />
        <Section title={t("common.adminGroup") || "Group Admin"} list={groups.GROUPADMIN} />
        <Section title={t("common.user") || "User"} list={groups.USER} />
        {!groups.ADMIN.length && !groups.GROUPADMIN.length && !groups.USER.length && !collapsed && (
          <div className="px-4 py-2 text-sm" style={{ color: colors.muted }}>
            {t("common.no_permissions") || "No items available."}
          </div>
        )}
      </nav>

      {/* ações */}
      <div className="px-2 py-3 border-t" style={{ borderColor: colors.border }}>
        <Link
          to="/Premium"
          className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
          style={{ color: colors.text }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.hoverBg)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <DollarSign  className="h-4 w-4" style={{ color: colors.muted }} />
          {!collapsed && <span className="text-sm">{t("common.premium") || "Settings"}</span>}
        </Link>
        <Link
          to="/Settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
          style={{ color: colors.text }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.hoverBg)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <Settings className="h-4 w-4" style={{ color: colors.muted }} />
          {!collapsed && <span className="text-sm">{t("common.settings") || "Settings"}</span>}
        </Link>

        <button
          onClick={logout}
          className="w-full mt-1 flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left"
          style={{ color: colors.text }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(248,113,113,0.12)";
            e.currentTarget.style.color = "#fca5a5";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = colors.text;
          }}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="text-sm">{t("common.logout") || "Logout"}</span>}
        </button>
      </div>

      {/* perfil */}
      <Link
        to="/Profile"
        className="border-t px-4 py-3 transition-colors"
        style={{ borderColor: colors.border }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.hoverBg)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-start"} gap-3`}>
          {avatarUrl ? (
            <img
              key={avatarUrl}
              src={avatarUrl}
              alt="avatar"
              className="w-9 h-9 rounded-full object-cover ring-1"
              style={{ ringColor: colors.border }}
            />
          ) : (
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-semibold shadow ring-1"
              style={{ ringColor: colors.border, background: "rgba(255,255,255,0.85)", color: "#0B1020" }}
            >
              {(profile?.firstName?.[0] || "U").toUpperCase()}
              {(profile?.lastName?.[0] || "").toUpperCase()}
            </div>
          )}
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <p className="text-sm font-semibold truncate" style={{ color: colors.text }}>
                {(profile.firstName || "") + " " + (profile.lastName || "")}
              </p>
              <p className="text-xs truncate" style={{ color: colors.muted }}>
                {profile.email}
              </p>
            </div>
          )}
        </div>
      </Link>
    </aside>
  );
}
