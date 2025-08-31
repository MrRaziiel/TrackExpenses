// components/auth/ProfileMenu.jsx
import React, { useEffect, useRef, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Settings, LogOut, PencilLine, User } from "lucide-react";
import { useTheme } from "../../styles/Theme/Theme";
import AuthContext from "../../services/Authentication/AuthContext";
import useLogout from "../../services/Authentication/Logout";

export default function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const popRef = useRef(null);
  const { theme } = useTheme();
  const { isAuthenticated, auth } = useContext(AuthContext);
  const logout = useLogout();
  const navigate = useNavigate();

  // fecha ao clicar fora
  useEffect(() => {
    const onDoc = (e) => {
      if (!open) return;
      if (btnRef.current?.contains(e.target)) return;
      if (popRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!isAuthenticated) {
    return <Link to="/Login" className="hover:opacity-80">Login</Link>;
  }

  const c = theme.colors;
  const first = auth?.firstName?.[0]?.toUpperCase() || "?";
  const bg = c.background?.paper || "#fff";
  const text = c.text?.primary || "#111";
  const hover = c.menu?.hoverBg || "#F1F5F9";
  const border = c.secondary?.light || "#E5E7EB";

  return (
    <div className="relative">
      {/* botão do avatar (toggle por clique) */}
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        className="h-10 w-10 rounded-full overflow-hidden border-2"
        style={{ borderColor: c.primary?.light }}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {auth?.path ? (
          <img src={auth.path} alt="Perfil" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center font-semibold"
               style={{ backgroundColor: "#6D28D9", color: "#fff" }}>
            {first}
          </div>
        )}
      </button>

      {open && (
        <div
          ref={popRef}
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-xl shadow-xl ring-1 z-50 overflow-hidden"
          style={{ backgroundColor: bg, color: text, ringColor: border }}
        >
          <div className="px-4 py-3 border-b" style={{ borderColor: border }}>
            <div className="text-sm font-semibold truncate">
              {(auth?.firstName || "") + " " + (auth?.lastName || "")}
            </div>
            <div className="text-xs truncate" style={{ color: c.text?.secondary }}>
              {auth?.Email || auth?.email}
            </div>
          </div>

          <button
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm"
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = hover)}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
            onClick={() => { setOpen(false); navigate("/Profile"); }}
          >
            <User className="h-4 w-4" /> Perfil
          </button>

          <Link
            to="/Settings"
            className="flex items-center gap-2 px-4 py-2.5 text-sm"
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = hover)}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
            onClick={() => setOpen(false)}
          >
            <Settings className="h-4 w-4" /> Settings
          </Link>

          <Link
            to="/Profile/edit"
            className="flex items-center gap-2 px-4 py-2.5 text-sm"
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = hover)}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
            onClick={() => setOpen(false)}
          >
            <PencilLine className="h-4 w-4" /> Edit Profile
          </Link>

          <div className="border-t my-1" style={{ borderColor: border }} />

          <button
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm"
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = "rgba(248,113,113,0.12)";
              e.currentTarget.style.color = "#ef4444";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = text;
            }}
            onClick={() => { setOpen(false); logout(); }}
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      )}
    </div>
  );
}
