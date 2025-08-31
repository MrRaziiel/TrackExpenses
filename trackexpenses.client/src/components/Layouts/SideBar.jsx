// components/layout/SideBar.jsx
import React, { useEffect, useMemo, useState, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, Settings, LogOut, PencilLine } from "lucide-react";
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
  const { role, isAuthenticated, auth } = useContext(AuthContext);
  const {t} =useLanguage();
  // === perfil local ===
  const [profile, setProfile] = useState(() => ({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    avatarUrl: user?.avatarUrl || "",
  }));

  useEffect(() => {
    setProfile(prev => ({
      ...prev,
      firstName: user?.firstName || prev.firstName || "",
      lastName: user?.lastName || prev.lastName || "",
      email: user?.email || prev.email || "",
      avatarUrl: user?.avatarUrl || prev.avatarUrl || "",
    }));
  }, [user?.firstName, user?.lastName, user?.email, user?.avatarUrl]);

  // === fetch foto ===
  useEffect(() => {
    const email = (auth?.Email || "").trim();
    if (!email) return;
    const controller = new AbortController();
    async function fetchUserProfile() {
      try {
        const res = await apiCall.get(
          `/User/GetPhotoProfileAndName/${encodeURIComponent(email)}`,
          { signal: controller.signal }
        );
        const firstName = res?.data?.FirstName || "";
        const lastName = res?.data?.FamilyName || "";
        const photoPath = res?.data?.PhotoPath;
        let avatarUrl = "";
        if (photoPath && photoPath !== "NoPhoto") {
          const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
          const path = String(photoPath).replace(/^\/+/, "");
          avatarUrl = `${base}/${path}?t=${Date.now()}`;
        }
        setProfile(prev => ({ ...prev, firstName, lastName, avatarUrl, email }));
      } catch (err) {
        if (
          err?.name === "CanceledError" ||
          err?.name === "AbortError" ||
          err?.message === "canceled" ||
          err?.code === "ERR_CANCELED"
        ) return;
        console.error("Erro ao buscar imagem/perfil:", err);
      }
    }
    fetchUserProfile();
    return () => controller.abort();
  }, [auth?.Email]);

  // === cores ===
  const colors = theme?.colors?.menu ?? {
    bg: "#0F172A",
    border: "#1E293B",
    text: "#E5E7EB",
    muted: "#9CA3AF",
    hoverBg: "rgba(255,255,255,0.06)",
    activeBg: "rgba(99,102,241,0.12)",
    activeText: theme?.colors?.primary?.main || "#60A5FA",
  };

  // === roles ===
  const norm = (v) => String(v ?? "").trim().toUpperCase();
  const roles = useMemo(() => {
    if (!role) return [];
    if (Array.isArray(role)) return role.map(norm).filter(Boolean);
    if (typeof role === "string") return role.split(/[,\s]+/).map(norm).filter(Boolean);
    return [];
  }, [role]);
  const isAdmin = roles.includes("ADMINISTRATOR");

  const canSee = (itemRoleRaw) => {
    if (isAdmin) return true;
    const r = norm(itemRoleRaw) || "USERS";
    if (r === "USERS" || r === "GROUPMEMBER" || r === "") return true;
    return roles.includes(r);
  };

  // agrupa
  const visible = useMemo(
    () => items.filter((i) => i?.visible !== false && canSee(i.role)),
    [items, roles, isAdmin]
  );
  const groups = useMemo(() => {
    const g = { ADMIN: [], GROUPADMIN: [], USERS: [] };
    visible.forEach((i) => {
      const r = norm(i.role) || "USERS";
      if (r === "ADMINISTRATOR") g.ADMIN.push(i);
      else if (r === "GROUPADMINISTRATOR") g.GROUPADMIN.push(i);
      else g.USERS.push(i);
    });
    return g;
  }, [visible]);

  // === iniciais ===
  const initials = useMemo(() => {
    const f = profile?.firstName?.[0] || "";
    const l = profile?.lastName?.[0] || "";
    return (f + l).toUpperCase() || "U";
  }, [profile?.firstName, profile?.lastName]);

  // === componente de secção ===
  const Section = ({ title, items }) => {
    if (!items?.length) return null;
    return (
      <div className="mt-2">
        {!collapsed && (
          <div
    className="w-full px-4 py-1.5 text-xs md:text-sm font-semibold uppercase tracking-wide text-center"
    style={{ color: colors.muted }}
  >
            {title}
          </div>
        )}
        {items.map(({ to, icon: Icon, label }) => {
          const active = loc.pathname.toLowerCase().startsWith(to.toLowerCase());
          return (
            <Link
              key={to}
              to={to}
              className="relative mx-2 mb-1 flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
              style={{
                backgroundColor: active ? colors.activeBg : "transparent",
                color: active ? colors.activeText : colors.text,
              }}
              title={collapsed ? label : undefined}
            >
              {active && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r"
                  style={{
                    width: 4,
                    height: 24,
                    background:
                      theme?.colors?.primary?.main ||
                      "linear-gradient(180deg,#60A5FA,#2563EB)",
                  }}
                />
              )}
              {Icon ? (
                <Icon
                  className="h-5 w-5"
                  style={{ color: active ? colors.activeText : colors.muted }}
                />
              ) : null}
              {!collapsed && <span className="text-sm truncate">{label}</span>}
            </Link>
          );
        })}
        {collapsed && <div className="mx-3 my-2 border-t" style={{ borderColor: colors.border }} />}
      </div>
    );
  };

  return (
    <aside
      className={`hidden md:flex flex-col flex-shrink-0 transition-[width] duration-300 ease-in-out ${collapsed ? "w-16" : "w-64"}`}
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {/* topo */}
      <div className="flex items-center justify-end"
           style={{ borderColor: colors.border }}>
        <button
          onClick={onToggle}
          className="p-2 rounded-md transition-colors"
          style={{ color: colors.muted }}
          title={collapsed ? "Expand" : "Collapse"}
          aria-label="toggle sidebar"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* navegação */}
      <nav className="flex-1 overflow-y-auto ">
        <Section title={t("common.admin")} items={groups.ADMIN} />
        <Section title={t("common.adminGroup")} items={groups.GROUPADMIN} />
        <Section title={t("common.user")} items={groups.USERS} />

        {!groups.ADMIN.length && !groups.GROUPADMIN.length && !groups.USERS.length && (
          <div className="px-4 py-2 text-sm" style={{ color: colors.muted }}>
            Sem permissões para navegar.
          </div>
        )}
      </nav>

      {/* ações fixas */}
      <div className="px-2 py-3 border-t" style={{ borderColor: colors.border }}>
        <Link
          to="/Settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
          style={{ color: colors.text }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.hoverBg)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <Settings className="h-4 w-4" style={{ color: colors.muted }} />
          {!collapsed && <span className="text-sm">Settings</span>}
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
          {!collapsed && <span className="text-sm">Logout</span>}
        </button>

        <Link
          to="/Profile/edit"
          className="mt-1 flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
          style={{ color: colors.text }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.hoverBg)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <PencilLine className="h-4 w-4" style={{ color: colors.muted }} />
          {!collapsed && <span className="text-sm">Edit Profile</span>}
        </Link>
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
          {profile?.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt="avatar"
              className="w-9 h-9 rounded-full object-cover ring-1"
              style={{ ringColor: colors.border }}
            />
          ) : (
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-semibold shadow ring-1"
              style={{
                ringColor: colors.border,
                background: "rgba(255,255,255,0.85)",
                color: "#0B1020",
              }}
            >
              {initials}
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
