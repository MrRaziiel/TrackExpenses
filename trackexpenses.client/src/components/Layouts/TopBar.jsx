// components/layout/TopBar.jsx
import React, { useState, useMemo, useContext } from "react";
import { Link } from "react-router-dom";
import { Menu as MenuIcon, Wallet } from "lucide-react";
import { useTheme } from "../../styles/Theme/Theme";
import AuthContext from "../../services/Authentication/AuthContext";

export default function TopBar({ title, menuItems = [] }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme } = useTheme();
  const { role } = useContext(AuthContext) || {};
  const c = theme?.colors || {};

  const norm = (v) => String(v ?? "").trim().toUpperCase();

  // Roles do utilizador -> ARRAY UPPERCASE
  const roles = useMemo(() => {
    if (!role) return [];
    if (Array.isArray(role)) return role.map(norm).filter(Boolean);
    if (typeof role === "string") return role.split(/[,\s]+/).map(norm).filter(Boolean);
    return [];
  }, [role]);

  const isAdmin = roles.includes("ADMINISTRATOR");

  // Admin vê tudo; senão:
  //  - itens sem role / USERS / GROUPMEMBER -> vê sempre
  //  - restantes só se tiver o role
  const canSee = (itemRoleRaw) => {
    if (isAdmin) return true;
    const itemRole = norm(itemRoleRaw) || "USERS";
    if (itemRole === "USERS" || itemRole === "GROUPMEMBER" || itemRole === "") return true;
    return roles.includes(itemRole);
  };

  // Filtra visíveis primeiro
  const visible = menuItems.filter(i => i?.visible !== false && canSee(i.role));

  // Agrupa em 3 secções (qualquer role desconhecido vai para USERS)
  const groups = { ADMIN: [], GROUPADMIN: [], USERS: [] };
  visible.forEach((i) => {
    const r = norm(i.role) || "USERS";
    if (r === "ADMINISTRATOR") groups.ADMIN.push(i);
    else if (r === "GROUPADMINISTRATOR") groups.GROUPADMIN.push(i);
    else groups.USERS.push(i); // USERS, GROUPMEMBER, vazio, ou qualquer outro => USERS
  });

  const Section = ({ title, items }) => {
    if (!items?.length) return null;
    return (
      <div className="py-2">
        <div
          className="px-4 py-1 text-xs font-semibold uppercase tracking-wide"
          style={{ color: c.text?.secondary }}
        >
          {title}
        </div>
        {items.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-3 px-4 py-2 text-sm border-t"
            style={{ borderColor: c.secondary?.light, color: c.text?.primary }}
            onClick={() => setMobileOpen(false)}
          >
            {Icon && <Icon className="h-5 w-5" style={{ color: c.primary?.main }} />}
            <span className="truncate">{label}</span>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <nav className="text-white shadow-lg relative" style={{ backgroundColor: c.primary?.main }}>
      <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center h-16">
        {/* Botão (só mobile) */}
        <div className="flex items-center gap-3 md:hidden">
          <button className="p-2 rounded-lg" onClick={() => setMobileOpen(v => !v)} aria-label="Menu">
            <MenuIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Título */}
        <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
          <Link to="/" className="flex items-center gap-2 pointer-events-auto">
            <Wallet className="h-6 w-6" />
            <span className="font-bold text-xl">{title}</span>
          </Link>
        </div>
      </div>

      {/* Dropdown mobile */}
      {mobileOpen && (
        <div
          className="md:hidden absolute top-16 left-0 right-0 z-50 shadow-2xl ring-1"
          style={{ backgroundColor: c.background?.paper, ringColor: c.secondary?.light }}
        >
          <Section title="ADMIN" items={groups.ADMIN} />
          <Section title="GROUP ADMIN" items={groups.GROUPADMIN} />
          <Section title="USERS" items={groups.USERS} />

          {!groups.ADMIN.length && !groups.GROUPADMIN.length && !groups.USERS.length && (
            <div className="px-4 py-4 text-sm" style={{ color: c.text?.secondary }}>
              Sem permissões para navegar
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
