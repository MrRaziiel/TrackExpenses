import React, { useState, useMemo, useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu as MenuIcon, Wallet, Settings, LogOut, DollarSign } from "lucide-react";
import { useTheme } from "../../styles/Theme/Theme";
import AuthContext from "../../services/Authentication/AuthContext";
import useLogout from "../../services/Authentication/Logout";
import { useLanguage } from "../../utilis/Translate/LanguageContext";
import apiCall from "../../services/ApiCallGeneric/apiCall";

export default function TopBar({ title = "TRACKEXPENSES", menuItems = [] }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { roles: ctxRoles, isAuthenticated, auth } = useContext(AuthContext) || {};
  const logout = useLogout();

  const c = theme?.colors || {};
  const topBg = c.background?.default || "#0B1020";
  const topText = c.text?.primary || "#E5E7EB";
  const ddBg = c.background?.paper || "#fff";
  const ddText = c.text?.primary || "#0F172A";
  const ddMuted = c.text?.secondary || "#64748B";
  const ddBorder = c.menu?.border || "#E5E7EB";
  const ddHover = c.menu?.hoverBg || "rgba(0,0,0,0.06)";
  const iconCol = c.primary?.main || "#2563EB";

  // helper para tradução
  const tr = (s) => {
    try {
      return s && s.includes(".") ? (t ? t(s) : s) : s;
    } catch {
      return s;
    }
  };

const topBorder = c.menu?.border || "rgba(255,255,255,0.08)";
const navShadow =
  "0 1px 0 rgba(255,255,255,0.08) inset, " +
  "0 4px 12px rgba(0,0,0,0.18), " +
  "0 4px 16px rgba(255,255,255,0.25)";
  // ---- roles + grupos ----
  const userRoles = useMemo(
    () => (Array.isArray(ctxRoles) ? ctxRoles : typeof ctxRoles === "string" ? ctxRoles.split(/[,\s]+/) : []),
    [ctxRoles]
  );

  const hasAnyRole = (need) => {
    const list = Array.isArray(need) ? need : [need];
    if (!list.length || list.includes("USER")) return true;
    return list.some((r) => userRoles.includes(r));
  };

  const sectionOf = (allow) => {
    const r = Array.isArray(allow) ? allow[0] : allow;
    switch (r) {
      case "ADMINISTRATOR": return "ADMIN";
      case "GROUPADMINISTRATOR": return "GROUPADMIN";
      case "PREMIUM": return "PREMIUM";
      case "GROUPMEMBER": return "GROUP";
      case "USER":
      default: return "USER";
    }
  };

  const groups = useMemo(() => {
    const g = { ADMIN: [], GROUPADMIN: [], PREMIUM: [], GROUP: [], USER: [] };
    (menuItems || []).forEach((i) => {
      if (!i || i.visible === false) return;
      const sec = sectionOf(i.role);
      if (sec === "USER") g.USER.push(i);
      else if (hasAnyRole(i.role)) g[sec].push(i);
    });
    return g;
  }, [menuItems, userRoles]);

  // ---- perfil igual ao sidebar ----
  const [profile, setProfile] = useState({ firstName: "", lastName: "", email: "", avatarUrl: "" });
  useEffect(() => {
    const email = (auth?.Email || auth?.email || "").trim();
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
          const base = (import.meta.env.VITE_FILES_BASE_URL || import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
          avatarUrl = `${base}/${String(photoPath).replace(/^\/+/, "")}?t=${Date.now()}`;
        }
        setProfile({ firstName: fn, lastName: ln, email, avatarUrl });
      } catch {}
    })();
    return () => controller.abort();
  }, [auth?.Email, auth?.email]);

  const initials = useMemo(() => {
    const f = profile?.firstName?.[0] || "";
    const l = profile?.lastName?.[0] || "";
    return ((f + l) || (profile.email?.[0] || "?")).toUpperCase();
  }, [profile]);

  const Section = ({ title, items }) =>
    !items?.length ? null : (
      <div className="py-2 text-center">
        <div className="w-full px-2 py-1.5 text-sm font-bold uppercase text-center" style={{ color: ddMuted }}>
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
            <span className="truncate">{tr(label)}</span>
          </Link>
        ))}
      </div>
    );

  return (
    <nav className="shadow-lg relative z-[200]"
  style={{
    backgroundColor: topBg,
    color: topText,
    borderBottom: `1px solid ${topBorder}`,
    boxShadow: navShadow,
  }}
>
      {/* barra superior */}
      <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center h-16">
        {/* menu mobile */}
        <div className="flex items-center gap-3">
          <button
            className="md:hidden p-2 rounded-lg transition-colors"
            style={{ color: topText }}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = ddHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <MenuIcon className="h-6 w-6" />
          </button>
        </div>

        {/* título centrado */}
        <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
          <Link to="/" className="flex items-center gap-2 pointer-events-auto">
            <Wallet className="h-6 w-6" />
            <span className="font-bold text-xl">{title}</span>
          </Link>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 z-[210] shadow-2xl ring-1 text-center"
          style={{ backgroundColor: ddBg, borderColor: ddBorder }}
        >
          <Section title={t?.("common.admin")} items={groups.ADMIN} />
          <Section title={t?.("common.adminGroup")} items={groups.GROUPADMIN} />
          <Section title={t?.("common.premium")} items={groups.PREMIUM} />
          <Section title={t?.("common.groupMember")} items={groups.GROUP} />
          <Section title={t?.("common.user")} items={groups.USER} />

          {isAuthenticated && (
            <>
              <div className="w-full px-2 py-1.5 text-sm font-bold uppercase" style={{ color: ddMuted }}>
                {t?.("common.account") ?? "Account"}
              </div>

              <Link
                to="/Premium"
                className="flex justify-center items-center gap-2 px-4 py-3 border-t"
                style={{ borderColor: ddBorder, color: ddText }}
                onClick={() => setMobileOpen(false)}
              >
                <DollarSign className="h-5 w-5" /> {t?.("common.premium") ?? "Premium"}
              </Link>

              <Link
                to="/Settings"
                className="flex justify-center items-center gap-2 px-4 py-3 border-t"
                style={{ borderColor: ddBorder, color: ddText }}
                onClick={() => setMobileOpen(false)}
              >
                <Settings className="h-5 w-5" /> {t?.("common.settings") ?? "Settings"}
              </Link>

              <button
                className="w-full flex justify-center items-center gap-2 px-4 py-3 border-t text-center"
                style={{ borderColor: ddBorder, color: ddText }}
                onClick={() => {
                  setMobileOpen(false);
                  logout();
                }}
              >
                <LogOut className="h-5 w-5" /> {t?.("common.logout") ?? "Logout"}
              </button>

              <Link
                to="/Profile"
                className="flex justify-center items-center gap-3 px-4 py-3 border-t"
                style={{ borderColor: ddBorder, color: ddText }}
                onClick={() => setMobileOpen(false)}
              >
                <div className="h-9 w-9 rounded-full overflow-hidden ring-2 ring-gray-300">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div
                      className="h-full w-full flex items-center justify-center font-semibold"
                      style={{ backgroundColor: "#6D28D9", color: "#fff" }}
                    >
                      {initials}
                    </div>
                  )}
                </div>
                <div className="min-w-0 text-left">
                  <div className="text-sm font-semibold truncate">
                    {(profile.firstName && profile.lastName) ? `${profile.firstName} ${profile.lastName}` : (auth?.preferred_username || profile.email || "Profile")}
                  </div>
                  <div className="text-xs truncate" style={{ color: ddMuted }}>
                    {profile.email}
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