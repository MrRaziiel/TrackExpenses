import React, { useEffect, useRef, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Settings, LogOut, PencilLine } from "lucide-react";
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
    function onDocClick(e) {
      if (!open) return;
      if (btnRef.current?.contains(e.target)) return;
      if (popRef.current?.contains(e.target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  if (!isAuthenticated) return null;

  const c = theme.colors;
  const avatarSrc = auth?.path;
  const first =
    (auth?.firstName || auth?.FirstName || "")?.[0]?.toUpperCase() || "?";
  const headerText = `${auth?.firstName || auth?.FirstName || ""} ${
    auth?.lastName || auth?.FamilyName || ""
  }`.trim();
  const email = auth?.Email || auth?.email || "";

  const bg = c.background?.paper || "#fff";
  const text = c.text?.primary || "#0F172A";
  const muted = c.text?.secondary || "#64748B";
  const border = c.secondary?.light || "#E5E7EB";
  const hover = c.menu?.hoverBg || "rgba(0,0,0,0.04)";

  return (
    <div className="relative">
      {/* Botão do avatar (toggle) */}
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-10 w-10 rounded-full overflow-hidden border-2"
        style={{ borderColor: c.primary?.light }}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt="Perfil"
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="h-full w-full flex items-center justify-center font-semibold"
            style={{ backgroundColor: "#6D28D9", color: "#fff" }}
          >
            {first}
          </div>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          ref={popRef}
          role="menu"
          className="absolute right-0 mt-2 w-64 rounded-xl shadow-2xl ring-1 z-50 overflow-hidden"
          style={{ backgroundColor: bg, color: text, ringColor: border }}
        >
          {/* Cabeçalho com nome/email + atalho para editar perfil */}
          <button
            className="w-full text-left px-4 py-3 border-b"
            style={{ borderColor: border }}
            onClick={() => {
              setOpen(false);
              navigate("/Profile/edit");
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="h-9 w-9 rounded-full overflow-hidden ring-2"
                style={{ ringColor: border }}
              >
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt="avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="h-full w-full flex items-center justify-center font-semibold"
                    style={{ backgroundColor: "#6D28D9", color: "#fff" }}
                  >
                    {first}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">
                  {headerText || "Perfil"}
                </div>
                <div className="text-xs truncate" style={{ color: muted }}>
                  {email}
                </div>
              </div>
            </div>
          </button>

          {/* Itens */}
          <Link
            to="/Profile/edit"
            className="flex items-center gap-2 px-4 py-2.5 text-sm"
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = hover)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
            onClick={() => setOpen(false)}
          >
            <PencilLine className="h-4 w-4" /> Edit Profile
          </Link>

          <Link
            to="/Settings"
            className="flex items-center gap-2 px-4 py-2.5 text-sm"
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = hover)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
            onClick={() => setOpen(false)}
          >
            <Settings className="h-4 w-4" /> Settings
          </Link>

          <div className="border-t my-1" style={{ borderColor: border }} />

          <button
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(248,113,113,0.12)";
              e.currentTarget.style.color = "#ef4444";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = text;
            }}
            onClick={() => {
              setOpen(false);
              logout();
            }}
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      )}
    </div>
  );
}
