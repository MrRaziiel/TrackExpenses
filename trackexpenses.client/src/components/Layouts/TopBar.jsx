// src/components/Layouts/TopBar.jsx
import React, { useState, useMemo, useContext } from "react";
import { Link } from "react-router-dom";
import { Menu as MenuIcon, Wallet, Settings, LogOut } from "lucide-react";
import { useTheme } from "../../styles/Theme/Theme";
import AuthContext from "../../services/Authentication/AuthContext";
import useLogout from "../../services/Authentication/Logout";
import { useLanguage } from "../../utilis/Translate/LanguageContext";
import { buildAssetUrl } from "../../utilis/url";

export default function TopBar({ title, menuItems = [] }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme } = useTheme();
  const { role, isAuthenticated, auth } = useContext(AuthContext) || {};
  const logout = useLogout();
  const { t } = useLanguage();

  const c = theme?.colors || {};

  // cores
  const topBg = c.background?.default || "#0B1020";
  const topText = c.text?.primary || "#E5E7EB";
  const topBorder = c.menu?.border || "rgba(255,255,255,0.08)";
  const navShadow =
    "0 1px 0 rgba(255,255,255,0.08) inset, " +
    "0 4px 12px rgba(0,0,0,0.18), " +
    "0 4px 16px rgba(255,255,255,0.25)";

  const ddBg = c.background?.paper || "#fff";
  const ddText = c.text?.primary || "#0F172A";
  const ddMuted = c.text?.secondary || "#64748B";
  const ddBorder = c.secondary?.light || "#E5E7EB";
  const ddHover = c.menu?.hoverBg || "rgba(0,0,0,0.06)";
  const iconCol = c.primary?.main || "#2563EB";

  // roles
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
    return ["USERS", "GROUPMEMBER", ""].includes(r) || roles.includes(r);
  };

  const visible = useMemo(
    () => menuItems.filter((i) => i?.visible !== false && canSee(i.role)),
    [menuItems, roles, isAdmin]
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

  // dados da conta
  const pick = (...vals) => vals.find((v) => typeof v === "string" && v.trim())?.trim();

  const fullName =
    pick(
      auth?.name,
      auth?.firstName,
      auth?.FirstName,
      auth?.given_name,
      auth?.givenName,
      auth?.displayName,
      auth?.preferred_username,
      auth?.email,
      auth?.Email
    ) || "";

  const email = auth?.Email || auth?.email || "";

  // URL da foto (se existir) — igual ao SideBar (usa buildAssetUrl)
  const avatar = pick(auth?.path) ? buildAssetUrl(auth.path) : undefined;

  // iniciais fallback
  const initial =
    (fullName || auth?.preferred_username || email || "?").trim()[0]?.toUpperCase() || "?";

  const Section = ({ title, items }) =>
    !items?.length ? null : (
      <div className="py-2 text-center">
        <div
          className="w-full px-2 py-1.5 text-sm font-bold uppercase text-center"
          style={{ color: ddMuted }}
        >
          {title}
        </div>
        {items.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className="flex justify-center items-center gap-3 px-4 py-3 border-t transition-colors"
            style={{ borderColor: ddBorder, color: ddText }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = ddHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            onClick={() => setMobileOpen(false)}
          >
            {Icon && <Icon className="h-5 w-5" style={{ color: iconCol }} />}
            <span className="truncate">{label}</span>
          </Link>
        ))}
      </div>
    );

  return (
    <nav
      className="shadow-lg relative"
      style={{
        backgroundColor: topBg,
        color: topText,
        borderBottom: `1px solid ${topBorder}`,
        boxShadow: navShadow,
      }}
    >
      {/* barra superior */}
      <div className="w-full h-16 flex items-center justify-center relative">
        {/* botão menu mobile */}
        <div className="absolute left-4 md:hidden">
          <button
            className="p-2 rounded-lg"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
          >
            <MenuIcon className="h-6 w-6" style={{ color: topText }} />
          </button>
        </div>

        {/* título centrado */}
        <Link to="/" className="flex items-center gap-2">
          <Wallet className="h-6 w-6" style={{ color: topText }} />
          <span className="font-bold text-xl">{title}</span>
        </Link>
      </div>

      {/* menu mobile */}
      {mobileOpen && (
        <div
          className="md:hidden absolute top-16 left-0 right-0 z-50 shadow-2xl ring-1 text-center"
          style={{ backgroundColor: ddBg }}
        >
          <Section title={t("common.admin")} items={groups.ADMIN} />
          <Section title={t("common.adminGroup")} items={groups.GROUPADMIN} />
          <Section title={t("common.user")} items={groups.USERS} />

          {isAuthenticated && (
            <>
              <div
                className="w-full px-2 py-1.5 text-sm font-bold uppercase"
                style={{ color: ddMuted }}
              >
                {t("common.account")}
              </div>

              <Link
                to="/Settings"
                className="flex justify-center items-center gap-2 px-4 py-3 border-t"
                style={{ borderColor: ddBorder, color: ddText }}
                onClick={() => setMobileOpen(false)}
              >
                <Settings className="h-5 w-5" /> {t("common.settings")}
              </Link>

              <button
                className="w-full flex justify-center items-center gap-2 px-4 py-3 border-t text-center"
                style={{ borderColor: ddBorder, color: ddText }}
                onClick={() => {
                  setMobileOpen(false);
                  logout();
                }}
              >
                <LogOut className="h-5 w-5" /> {t("common.logout")}
              </button>

              {/* bloco perfil no menu mobile (mesma estrutura pedida) */}
              <Link
                to="/Profile"
                className="flex justify-center items-center gap-3 px-4 py-3 border-t"
                style={{ borderColor: ddBorder, color: ddText }}
                onClick={() => setMobileOpen(false)}
              >
                <div className="h-9 w-9 rounded-full overflow-hidden ring-2 ring-gray-300">
                  {avatar ? (
                    <img src={avatar} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div
                      className="h-full w-full flex items-center justify-center font-semibold"
                      style={{ backgroundColor: "#6D28D9", color: "#fff" }}
                    >
                      {initial}
                    </div>
                  )}
                </div>
                <div className="min-w-0 text-left">
                  <div className="text-sm font-semibold truncate">
                    {fullName || "Profile"}
                  </div>
                  <div className="text-xs truncate" style={{ color: ddMuted }}>
                    {email}
                  </div>
                </div>
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
