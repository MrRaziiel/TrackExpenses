// App.jsx
import React, { useContext, useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import {
  Wallet, PiggyBank, Users, LogIn, Menu as MenuIcon, X,
  LayoutDashboard, ChevronLeft, ChevronRight, Settings, LogOut
} from "lucide-react";
import { useTheme } from "./styles/Theme/Theme";
import { useLanguage } from "./utilis/Translate/LanguageContext";
import AuthContext from "./services/Authentication/AuthContext";
import apiCall from "./services/ApiCallGeneric/apiCall";

import SessionPopup from "./Pages/Autentication/SessionPopup";
import { AuthTimer_resume } from "./services/MicroServices/AuthTime";

// Pages
import Welcome from "./Pages/Welcome";
import UsersList from "./Pages/Administrador/ListClients";
import EditUser from "./Pages/Administrador/EditUser";
import EditUserProfile from "./Pages/Administrador/EditUser";
import ProfilePage from "./Pages/Profile";
import SettingsPage from "./Pages/Settings";

import Login from "./Pages/Autentication/Login";
import SignIn from "./Pages/Autentication/SignIn";
import useLogout from "./services/Authentication/Logout";
import RequireAuth from "./services/Authentication/Require";
import NotRequireAuth from "./services/Authentication/NotRequire";

import ForgotPassword from "./Pages/Autentication/ForgotPassword";
import RecoverPassword from "./Pages/Autentication/RecoverPassword";

import Dashboard from "./Pages/Administrador/Dashboard";

import ListExpenses from "./Pages/Expenses/AllExpenses";
import AddExpense from "./Pages/Expenses/AddExpenses";
import CalendarExpenses from "./Pages/Expenses/CalendarExpenses";
import EditExpense from "./Pages/Expenses/EditExpense";

import EarningsList from "./Pages/Earnings/EarningList";
import AddEditEarning from "./Pages/Earnings/AddEditEarning";

import PremiumChoicePage from "./Pages/Premium/Prices";

const hasSession = () => {
  try { return !!JSON.parse(localStorage.getItem("auth") || "{}")?.user?.accessToken; }
  catch { return false; }
};



function App() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthMenuOpen, setIsAuthMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { isAuthenticated, auth, setAuth, role, loading } = useContext(AuthContext);
  const logout = useLogout();

  useEffect(() => {
  const onExpired = () => logout();
  window.addEventListener("token-expired", onExpired);
  return () => window.removeEventListener("token-expired", onExpired);
}, [logout]);

  // retoma o contador no arranque
 useEffect(() => {
    AuthTimer_resume({
      baseUrl: import.meta.env.VITE_API_BASE_URL,
      earlyMs: 30 * 1000
    });
  }, []);

  useEffect(() => {
    const kickIfAuthed = () => {
      if (location.pathname.toLowerCase().includes("login") && hasSession()) {
        const to = location.state?.from?.pathname || "/Dashboard";
        navigate(to, { replace: true });
      }
    };
    kickIfAuthed();
    window.addEventListener("token-refreshed", kickIfAuthed);
    window.addEventListener("storage", kickIfAuthed);
    return () => {
      window.removeEventListener("token-refreshed", kickIfAuthed);
      window.removeEventListener("storage", kickIfAuthed);
    };
  }, [location.pathname, location.state, navigate]);

  // foto / primeira letra
  useEffect(() => {
    if (!auth?.email) return;
    const fetchUserPhoto = async () => {
      try {
        const res = await apiCall.get(`/User/GetPhotoProfile/${auth.email}`);
        const photoPath = res.data?.photoPath;
        const firstName = res.data?.firstName;
        if (photoPath && photoPath !== "NoPhoto") {
          const imageUrl = `${import.meta.env.VITE_API_BASE_URL}/${photoPath}?t=${Date.now()}`;
          setAuth(prev => ({ ...prev, path: imageUrl }));
        }
        if (firstName) {
          setAuth(prev => ({ ...prev, firstName: firstName[0]?.toUpperCase() }));
        }
      } catch (err) {
        console.error("Erro ao buscar imagem de perfil:", err);
      }
    };
    fetchUserPhoto();
  }, [auth?.email, setAuth]);

  const ProfileMenu = () => {
    const [open, setOpen] = useState(false);

    if (!isAuthenticated) {
      return (
        <Link to="/Login" className="flex items-center space-x-1 hover:text-blue-100">
          <span>Login</span>
        </Link>
      );
    }

    return (
      <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
        <Link to="/Profile">
          {auth?.path ? (
            <img
              src={auth.path}
              alt="Perfil"
              className="h-10 w-10 rounded-full object-cover border-2 border-blue-500 cursor-pointer"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-semibold border-2 border-blue-500 cursor-pointer">
              {(auth?.firstName && auth.firstName) || ""}
            </div>
          )}
        </Link>

        {open && (
          <div className="absolute right-0 w-36 bg-white rounded shadow z-20">
            <Link
              to="/Premium"
              className="flex items-center px-4 py-2 text-sm rounded hover:bg-gray-100"
              style={{ color: theme.colors.text.primary }}
            >
              <Settings className="h-4 w-4 mr-2" />
              {t("common.premium")}
            </Link>
            <Link
              to="/settings"
              className="flex items-center px-4 py-2 text-sm rounded hover:bg-gray-100"
              style={{ color: theme.colors.text.primary }}
            >
              <Settings className="h-4 w-4 mr-2" />
              {t("common.settings")}
            </Link>
            <button
              onClick={logout}
              className="flex items-center w-full px-4 py-2 text-sm rounded hover:bg-gray-100"
              style={{ color: theme.colors.text.primary }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t("common.logout")}
            </button>
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col text-base" style={{ backgroundColor: theme?.colors?.background?.default || "#F9FAFB" }}>
      {/* NAVBAR */}
      <nav style={{ backgroundColor: theme?.colors?.primary?.main || "#3B82F6" }} className="text-white shadow-lg">
        <div className="w-full px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Wallet className="h-6 w-6" />
            <span className="font-bold text-xl hidden sm:inline">TRACKEXPENSES</span>
          </Link>

          <div className="flex items-center space-x-2">
            {!isAuthenticated && (
              <div className="relative md:hidden">
                <button
                  onClick={() => setIsAuthMenuOpen(!isAuthMenuOpen)}
                  className="p-2 rounded-lg hover:bg-blue-600 transition-colors"
                  style={{ backgroundColor: theme?.colors?.primary?.light }}
                >
                  <LogIn className="h-6 w-6" />
                </button>

                {isAuthMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-1"
                    style={{ backgroundColor: theme?.colors?.primary?.main }}
                  >
                    <Link
                      to="/Login"
                      className="block px-4 py-2 hover:bg-blue-600 transition-colors"
                      onClick={() => setIsAuthMenuOpen(false)}
                    >
                      {t("common.login")}
                    </Link>
                  </div>
                )}
              </div>
            )}

            {isAuthenticated && (
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-blue-600 transition-colors"
                style={{ backgroundColor: theme?.colors?.primary?.dark }}
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
              </button>
            )}

            <div className="hidden md:flex items-center space-x-4">
              <ProfileMenu />
            </div>
          </div>
        </div>

        {/* MENU MOBILE */}
        {isMenuOpen && isAuthenticated && (
          <div className="md:hidden pb-4 space-y-2">
            <Link
              to="/Expenses"
              className="flex items-center space-x-2 py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              onClick={() => setIsMenuOpen(false)}
              style={{ backgroundColor: theme?.colors?.primary?.dark }}
            >
              <PiggyBank className="h-5 w-5" />
              <span>{t("common.expenses")}</span>
            </Link>
            <Link
              to="/Earnings"
              className="flex items-center space-x-2 py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              onClick={() => setIsMenuOpen(false)}
              style={{ backgroundColor: theme?.colors?.primary?.dark }}
            >
              <Wallet className="h-5 w-5" />
              <span>{t("common.earning")}</span>
            </Link>
            <Link
              to="/Users"
              className="flex items-center space-x-2 py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              onClick={() => setIsMenuOpen(false)}
              style={{ backgroundColor: theme?.colors?.primary?.dark }}
            >
              <Users className="h-5 w-5" />
              <span>{t("common.users")}</span>
            </Link>
            <button
              onClick={() => { setIsMenuOpen(false); logout(); }}
              className="flex items-center space-x-2 py-2 px-4 w-full text-left rounded-lg hover:bg-blue-600 transition-colors"
              style={{ backgroundColor: theme?.colors?.primary?.dark }}
            >
              <LogIn className="h-5 w-5" />
              <span>{t("common.logout")}</span>
            </button>
          </div>
        )}
      </nav>

      {/* MAIN */}
      <div className="flex flex-col md:flex-row flex-1 overflow-x-hidden">
        {isAuthenticated && (
          <aside
            className={`
              hidden md:flex flex-col flex-shrink-0
              transition-[width] duration-300 ease-in-out
              ${isSidebarCollapsed ? "w-16" : "w-60"}
              bg-white shadow-lg
            `}
            style={{ backgroundColor: theme?.colors?.background?.paper }}
          >
            {/* topo da sidebar – só o botão, sem "ADMINISTRATOR" */}
            <div className="flex items-center justify-end h-12 px-2 border-b">
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                title={isSidebarCollapsed ? "Expandir" : "Colapsar"}
                aria-label="Alternar sidebar"
              >
                {isSidebarCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronLeft className="h-4 w-4 text-gray-600" />
                )}
              </button>
            </div>

            {/* navegação */}
            <nav className="flex-1 overflow-y-auto py-2">
              {role === "ADMINISTRATOR" && !isSidebarCollapsed && (
                <div className="px-3 pb-2 pt-1 text-xs font-semibold text-gray-600">ADMIN</div>
              )}

              {role === "ADMINISTRATOR" && (
                <Link to="/Users" className="mx-2 mb-1 flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-50">
                  <Users className="h-5 w-5 text-gray-600" />
                  {!isSidebarCollapsed && <span className="text-sm">{t("common.users")}</span>}
                </Link>
              )}

              {!isSidebarCollapsed && (
                <div className="px-3 pb-2 pt-3 text-xs font-semibold text-gray-600">{t("common.options")}</div>
              )}

              <Link to="/Dashboard" className="mx-2 mb-1 flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-50">
                <LayoutDashboard className="h-5 w-5 text-gray-600" />
                {!isSidebarCollapsed && <span className="text-sm">{t("common.dashboard")}</span>}
              </Link>

              <Link to="/Expenses" className="mx-2 mb-1 flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-50">
                <PiggyBank className="h-5 w-5 text-gray-600" />
                {!isSidebarCollapsed && <span className="text-sm">{t("common.expenses")}</span>}
              </Link>

              <Link to="/Earnings" className="mx-2 mb-1 flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-50">
                <Wallet className="h-5 w-5 text-gray-600" />
                {!isSidebarCollapsed && <span className="text-sm">{t("common.earning")}</span>}
              </Link>

              <Link to="/CalendarExpenses" className="mx-2 mb-1 flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-50">
                <Wallet className="h-5 w-5 text-gray-600" />
                {!isSidebarCollapsed && <span className="text-sm">{t("common.calendar")}</span>}
              </Link>
            </nav>
          </aside>
        )}

        {/* conteúdo */}
        <main className={`flex-1 min-w-0 ${isAuthenticated ? "p-4 md:p-8" : "py-8 px-4"} min-h-[calc(100vh-4rem)]`}>
          <SessionPopup />
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="*" element={<Welcome />} />

            <Route element={<NotRequireAuth />}>
              <Route path="/Login" element={<Login />} />
              <Route path="/Register" element={<SignIn />} />
              <Route path="/ForgotPassword" element={<ForgotPassword />} />
              <Route path="/RecoverPassword" element={<RecoverPassword />} />
            </Route>

            <Route element={<RequireAuth />}>
              <Route path="/users/edit/:id/:email" element={<EditUserProfile />} />
              <Route path="/Dashboard" element={<Dashboard />} />
              <Route path="/Earnings" element={<EarningsList />} />
              <Route path="/Earnings/add" element={<AddEditEarning />} />
              <Route path="/Premium" element={<PremiumChoicePage />} />
              <Route path="/Expenses" element={<ListExpenses />} />
              <Route path="/expenses/add" element={<AddExpense />} />
              <Route path="/CalendarExpenses" element={<CalendarExpenses />} />
              <Route path="/Expenses/Edit/:id" element={<EditExpense />} />
              <Route path="/Users" element={<UsersList />} />
              <Route path="/Users/edit/:id" element={<EditUser />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/Profile" element={<ProfilePage />} />
            </Route>
          </Routes>
        </main>
      </div>

      <footer className="bg-white shadow-lg mt-auto" style={{ backgroundColor: theme?.colors?.background?.paper }}>
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-gray-500 text-sm" style={{ color: theme?.colors?.text?.secondary }}>
              © 2025 TRACKEXPENSES. {t("common.allRightsReserved")}
            </div>
            <div className="flex flex-wrap gap-4">
              <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">{t("common.privacyPolicy")}</a>
              <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">{t("common.termsOfService")}</a>
              <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">{t("common.contact")}</a>
              <button
                onClick={logout}
                className="flex items-center w-full px-4 py-2 text-sm rounded hover:bg-gray-100"
                style={{ color: theme?.colors?.text?.primary }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t("common.logout")}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
