// components/auth/ProfileMenu.jsx
import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { Settings, LogOut } from "lucide-react";
import { useLanguage } from "../../utilis/Translate/LanguageContext";
import { useTheme } from "../../styles/Theme/Theme";
import AuthContext from "../../services/Authentication/AuthContext";
import useLogout from "../../services/Authentication/Logout";

export default function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { isAuthenticated, auth } = useContext(AuthContext);
  const logout = useLogout();

  if (!isAuthenticated) {
    return <Link to="/Login" className="hover:text-blue-100">{t?.("common.login") ?? "Login"}</Link>;
  }

  const first = auth?.firstName?.[0]?.toUpperCase();

  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <Link to="/Profile">
        {auth?.path ? (
          <img src={auth.path} alt="Perfil" className="h-10 w-10 rounded-full object-cover border-2 border-blue-500 cursor-pointer" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-semibold border-2 border-blue-500 cursor-pointer">
            {first || "?"}
          </div>
        )}
      </Link>

      {open && (
        <div className="absolute right-0 w-40 bg-white rounded shadow z-20">
          <Link
            to="/settings"
            className="flex items-center px-4 py-2 text-sm rounded hover:bg-gray-100"
            style={{ color: theme?.colors?.text?.primary }}
          >
            <Settings className="h-4 w-4 mr-2" /> {t?.("common.settings") ?? "Settings"}
          </Link>
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-2 text-sm rounded hover:bg-gray-100"
            style={{ color: theme?.colors?.text?.primary }}
          >
            <LogOut className="h-4 w-4 mr-2" /> {t?.("common.logout") ?? "Logout"}
          </button>
        </div>
      )}
    </div>
  );
}
