import React, { useState, useMemo, useContext } from "react";
import { Link } from "react-router-dom";
import {
  Menu as MenuIcon,
  Wallet,
  Settings,
  LogOut,
  PencilLine,
} from "lucide-react";
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
  const c = theme?.colors || {};
  const { t } = useLanguage();

  // cores (topo igual ao background da página)
  const topBg = c.background?.default || c.background?.paper || "#0B1020";
  const topText = c.text?.primary || "#E5E7EB";
  const topBorder =
    c.menu?.border || c.secondary?.light || "rgba(255,255,255,0.08)";
  const navShadow =
    "0 1px 0 rgba(255,255,255,0.08) inset, " +
    "0 4px 12px rgba(0,0,0,0.18), " + // sombra escura (light)
    "0 4px 16px rgba(255,255,255,0.25)";

  const ddBg = c.background?.paper || "#fff";
  const ddText = c.text?.primary || "#0F172A";
  const ddMuted = c.text?.secondary || "#64748B";
  const ddBorder = c.secondary?.light || "#E5E7EB";
  const ddHover = c.menu?.hoverBg || "rgba(0,0,0,0.06)";
  const iconCol = c.menu?.activeText || c.primary?.main || "#2563EB";

  // roles → secções
  const norm = (v) =>
    String(v ?? "")
      .trim()
      .toUpperCase();
  const roles = useMemo(() => {
    if (!role) return [];
    if (Array.isArray(role)) return role.map(norm).filter(Boolean);
    if (typeof role === "string")
      return role
        .split(/[,\s]+/)
        .map(norm)
        .filter(Boolean);
    return [];
  }, [role]);

  const isAdmin = roles.includes("ADMINISTRATOR");

  const canSee = (itemRoleRaw) => {
    if (isAdmin) return true;
    const r = norm(itemRoleRaw) || "USERS";
    if (r === "USERS" || r === "GROUPMEMBER" || r === "") return true;
    return roles.includes(r);
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

  const Section = ({ title, items }) => {
    if (!items?.length) return null;
    return (
      <div className="py-2">
        <div
          className="w-full px-2 py-1.5 text-xs md:text-sm font-semibold uppercase tracking-wide text-center"
          style={{ color: ddMuted }}
        >
          {title}
        </div>
        {items.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-3 px-4 py-3 border-t transition-colors"
            style={{ borderColor: ddBorder, color: ddText }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = ddHover)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
            onClick={() => setMobileOpen(false)}
          >
            {Icon && <Icon className="h-5 w-5" style={{ color: iconCol }} />}
            <span className="truncate">{label}</span>
          </Link>
        ))}
      </div>
    );
  };

  // dados da conta
  const fullName = `${auth?.firstName || auth?.FirstName || ""} ${
    auth?.lastName || auth?.FamilyName || ""
  }`.trim();
  const email = auth?.Email || auth?.email || "";
  const avatar = auth?.path;

  return (
    <nav
      className="shadow-lg relative"
      style={{
        backgroundColor: topBg,
        color: topText,
        borderBottom: `1px solid ${topBorder}`,
        boxShadow: navShadow, // ⬅️ ADICIONA ISTO
      }}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3">
        {/* Hamburguer (apenas mobile) */}
        <div className="md:hidden">
          <button
            className="p-2 rounded-lg"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <MenuIcon className="h-6 w-6" style={{ color: topText }} />
          </button>
        </div>

        {/* Título centrado */}
        <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
          <Link
            to="/"
            className="flex items-center gap-2 pointer-events-auto"
            style={{ color: topText }}
          >
            <Wallet className="h-6 w-6" style={{ color: topText }} />
            <span className="font-bold text-xl">{title}</span>
          </Link>
        </div>

        {/* (Desktop) — aqui podes manter o ProfileMenu se quiseres */}
        <div className="ml-auto hidden md:flex"></div>
      </div>

      {/* Dropdown NAV + CONTA (só mobile) */}
      {mobileOpen && (
        <div
          className="md:hidden absolute top-16 left-0 right-0 z-50 shadow-2xl ring-1"
          style={{ backgroundColor: ddBg, ringColor: ddBorder }}
        >
          <div
            className="w-full px-2 py-1.5 text-xss md:text-sm font-semibold uppercase tracking-wide text-center"
            style={{ borderColor: ddBorder, color: ddMuted }}
          >
            {t("common.menu")}
          </div>

          <Section title="Admin" items={groups.ADMIN} />
          <Section title="Group Admin" items={groups.GROUPADMIN} />
          <Section title="Users" items={groups.USERS} />

          {/* ——— Secção Conta ——— */}
          {isAuthenticated && (
            <>
              <div
                className="w-full px-2 py-1.5 text-xs md:text-sm font-semibold uppercase tracking-wide text-center"
                style={{ borderColor: ddBorder, color: ddMuted }}
              >
                {t("common.account")}
              </div>

              <Link
                to="/Settings"
                className="flex items-center gap-2 px-4 py-3 border-t transition-colors"
                style={{ borderColor: ddBorder, color: ddText }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = ddHover)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
                onClick={() => setMobileOpen(false)}
              >
                <Settings className="h-5 w-5" /> {t("common.settings")}
              </Link>

              <button
                className="w-full flex items-center gap-2 px-4 py-3 border-t transition-colors text-left"
                style={{ borderColor: ddBorder, color: ddText }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(248,113,113,0.12)";
                  e.currentTarget.style.color = "#ef4444";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = ddText;
                }}
                onClick={() => {
                  setMobileOpen(false);
                  logout();
                }}
              >
                <LogOut className="h-5 w-5" /> {t("common.logout")}
              </button>

              {/* Cabeçalho com avatar/nome/email (atalho para editar perfil) */}
              <Link
                to="/Profile/edit"
                className="flex items-center gap-3 px-4 py-3 border-t"
                style={{ borderColor: ddBorder, color: ddText }}
                onClick={() => setMobileOpen(false)}
              >
                <div
                  className="h-9 w-9 rounded-full overflow-hidden ring-2"
                  style={{ ringColor: ddBorder }}
                >
                  {avatar ? (
                    <img
                      src={avatar}
                      alt="avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className="h-full w-full flex items-center justify-center font-semibold"
                      style={{ backgroundColor: "#6D28D9", color: "#fff" }}
                    >
                      {(auth?.firstName ||
                        auth?.FirstName ||
                        "?")[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">
                    {fullName || "Perfil"}
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
