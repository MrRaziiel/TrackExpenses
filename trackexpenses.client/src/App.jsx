import React, { useEffect, useContext, useState, useMemo } from "react";
import { Routes, Route } from "react-router-dom";
import { useTheme } from "./styles/Theme/Theme";
import { useLanguage } from "./utilis/Translate/LanguageContext";
import AuthContext from "./services/Authentication/AuthContext";
import apiCall from "./services/ApiCallGeneric/apiCall";

import AppShell from "./components/Layouts/AppShell";
import SessionPopup from "./Pages/Autentication/SessionPopup";

import RequireAuth from "./services/Authentication/Require";
import NotRequireAuth from "./services/Authentication/NotRequire";
import { AuthTimer_resume } from "./services/MicroServices/AuthTime";

// icons
import {
  LayoutDashboard,
  PiggyBank,
  Wallet,
  Users as UsersIcon,
  Calendar, BookUser,
} from "lucide-react";

// pages
import Welcome from "./Pages/Welcome";
import Dashboard from "./Pages/Administrador/Dashboard";
import UsersList from "./Pages/Administrador/ListClients";
import EditUser from "./Pages/Administrador/EditUser";
import EditUserProfile from "./Pages/Administrador/EditUser";
import ListExpenses from "./Pages/Expenses/AllExpenses";
import AddExpense from "./Pages/Expenses/AddExpenses";
import EditExpense from "./Pages/Expenses/EditExpense";
import CalendarExpenses from "./Pages/Expenses/CalendarExpenses";
import EarningsList from "./Pages/Earnings/EarningList";
import AddEditEarning from "./Pages/Earnings/AddEditEarning";
import Login from "./Pages/Autentication/Login";
import SignIn from "./Pages/Autentication/SignIn";
import ForgotPassword from "./Pages/Autentication/ForgotPassword";
import RecoverPassword from "./Pages/Autentication/RecoverPassword";
import SettingsPage from "./Pages/Settings";
import ProfilePage from "./Pages/User/Profile";
import PremiumChoicePage from "./Pages/Premium/Prices";
import AddUser from "./Pages/Administrador/AddUser";
import RequireRoles from "./services/Authentication/RequireRoles";
import GroupAdminPage from "./Pages/GroupAdmin/GroupAdminPage";
import GroupsList from "./Pages/GroupAdmin/GroupsList";


export default function App() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { roles, isAuthenticated } = useContext(AuthContext);

  // ---- estado local do utilizador para a sidebar/topbar  ----
  const [userState, setUser] = useState({
    email: "",
    firstName: "",
    lastName: "",
    avatarUrl: "",
  });

  useEffect(() => {
    AuthTimer_resume({ earlyMs: 30_000, graceMs: 5000 });
  }, []);

  // Menu com traduções e visibilidade por role
  const items = useMemo(
    () => [
      { to: "/Users",            icon: UsersIcon,       label: "common.users",     role: "ADMINISTRATOR", section: "ADMIN" },
  { to: "/GroupAdminPage",            icon: BookUser,        label: "common.group_admin",  role: "PREMIUM", section: "GROUPS" },
  { to: "/GroupsList",            icon: BookUser,        label: "common.group_list",  role: "PREMIUM", section: "GROUPS" },

  { to: "/Dashboard",        icon: LayoutDashboard, label: "common.dashboard", role: "USER", section: "Groups" },
  { to: "/Expenses",         icon: PiggyBank,       label: "common.expenses",  role: "USER", section: "Groups" },
  { to: "/Earnings",         icon: Wallet,          label: "common.earnings",  role: "USER", section: "Groups" },
  { to: "/CalendarExpenses", icon: Calendar,        label: "common.calendar",  role: "USER", section: "Groups" },
    ],
    [t, roles]
  );

  return (
    <AppShell
      topbarTitle={"TRACKEXPENSES"}
      sidebarItems={items}
      sidebarVisible={isAuthenticated}
      bg={theme?.colors?.background?.default || "#F9FAFB"}
    >
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
        <Route element={<RequireRoles allow={["PREMIUM", "GROUPADMINISTRATOR"]} />}>
      <Route path="/GroupAdminPage" element={<GroupAdminPage />} />

    </Route>

        <Route element={<RequireAuth />}>
      <Route path="/GroupsList" element={<GroupsList />} />

          <Route path="/Dashboard" element={<Dashboard />} />
          <Route path="/Earnings" element={<EarningsList />} />
          <Route path="/Earnings/add" element={<AddEditEarning />} />
          <Route path="/Expenses" element={<ListExpenses />} />
          <Route path="/expenses/add" element={<AddExpense />} />
          <Route path="/Expenses/Edit/:id" element={<EditExpense />} />
          <Route path="/CalendarExpenses" element={<CalendarExpenses />} />
          <Route path="/Users" element={<UsersList />} />
          <Route path="/Users/edit/:id" element={<EditUser />} />
          <Route path="/users/edit/:id/:email" element={<EditUserProfile />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/Profile" element={<ProfilePage />} />
          <Route path="/Premium" element={<PremiumChoicePage />} />
          <Route path="/users/new" element={<AddUser />} />

        </Route>
      </Routes>
    </AppShell>
  );
}
