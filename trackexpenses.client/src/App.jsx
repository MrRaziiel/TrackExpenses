import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Wallet, PiggyBank, Users, LogIn, Menu, X, LayoutDashboard, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from './components/Theme/Theme';
import { useLanguage } from './utilis/Translate/LanguageContext';
// Pages
import Welcome from './components/Pages/Welcome';
import UsersList from './components/Pages/Administrador/ListClients';
import Login from './components/Pages/Login';
import SignIn from './components/Pages/SignIn';
import Dashboard from './components/Pages/Administrador/Dashboard';
import Expenses from './components/Pages/Expenses/AllExpenses';
import Incomes from './components/Pages/Incomes/AllIncomes';
import AddExpense from './components/Pages/Expenses/AddExpenses';
import AddIncome from './components/Pages/Incomes/AddIncomes';
import EditUser from './components/Pages/Administrador/EditUser';
import SettingsPage from './components/Pages/Settings';


function App() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthMenuOpen, setIsAuthMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: theme?.colors?.background?.default || '#F9FAFB' }}>
      {/* Top Navigation */}
      <nav style={{ backgroundColor: theme?.colors?.primary?.main || '#3B82F6' }} className="text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <Wallet className="h-6 w-6" />
              <span className="font-bold text-xl hidden sm:inline">FinanceTracker</span>
            </Link>

            <div className="flex items-center space-x-2">
              {/* Auth Menu Button (Mobile) */}
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
                        {t('common.login')}
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Menu Button (Mobile) */}
              {isAuthenticated && (
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="md:hidden p-2 rounded-lg hover:bg-blue-600 transition-colors"
                  style={{ backgroundColor: theme?.colors?.primary?.dark }}
                >
                  {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              )}

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-4">
                {!isAuthenticated ? (
                  <Link to="/Login" className="flex items-center space-x-1 hover:text-blue-100">
                    <LogIn className="h-5 w-5" />
                    <span>{t('common.login')}</span>
                  </Link>
                ) : (
                  <button
                    onClick={() => setIsAuthenticated(false)}
                    className="flex items-center space-x-1 hover:text-blue-100"
                  >
                    <LogIn className="h-5 w-5" />
                    <span>{t('common.logout')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && isAuthenticated && (
            <div className="md:hidden pb-4 space-y-2">
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
                style={{ backgroundColor: theme?.colors?.primary?.dark }}
              >
                <LayoutDashboard className="h-5 w-5" />
                <span>{t('common.dashboard')}</span>
              </Link>
              <Link
                to="/expenses"
                className="flex items-center space-x-2 py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
                style={{ backgroundColor: theme?.colors?.primary?.dark }}
              >
                <PiggyBank className="h-5 w-5" />
                <span>{t('common.expenses')}</span>
              </Link>
              <Link
                to="/incomes"
                className="flex items-center space-x-2 py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
                style={{ backgroundColor: theme?.colors?.primary?.dark }}
              >
                <Wallet className="h-5 w-5" />
                <span>{t('common.incomes')}</span>
              </Link>
              <Link
                to="/users"
                className="flex items-center space-x-2 py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
                style={{ backgroundColor: theme?.colors?.primary?.dark }}
              >
                <Users className="h-5 w-5" />
                <span>{t('common.users')}</span>
              </Link>
              <Link
                to="/settings"
                className="flex items-center space-x-2 py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
                style={{ backgroundColor: theme?.colors?.primary?.dark }}
              >
                <Settings className="h-5 w-5" />
                <span>{t('common.settings')}</span>
              </Link>
              <button
                onClick={() => {
                  setIsAuthenticated(false);
                  setIsMenuOpen(false);
                }}
                className="flex items-center space-x-2 py-2 px-4 w-full text-left rounded-lg hover:bg-blue-600 transition-colors"
                style={{ backgroundColor: theme?.colors?.primary?.dark }}
              >
                <LogIn className="h-5 w-5" />
                <span>{t('common.logout')}</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="flex flex-col md:flex-row flex-1">
        {/* Sidebar Navigation (only visible when authenticated) */}
        {isAuthenticated && (
          <aside 
            className={`hidden md:flex md:flex-col transition-all duration-300 ease-in-out min-h-[calc(100vh-4rem)] ${
              isSidebarCollapsed ? 'w-12' : 'w-48'
            } bg-white shadow-lg`}
            style={{ backgroundColor: theme?.colors?.background?.paper }}
          >
            <div className="flex justify-end p-1">
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {isSidebarCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronLeft className="h-4 w-4 text-gray-500" />
                )}
              </button>
            </div>
            <nav className="flex-1 p-2 space-y-1">
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 px-2 py-1.5 text-gray-700 hover:bg-blue-50 rounded-lg"
              >
                <LayoutDashboard className="h-4 w-4" />
                {!isSidebarCollapsed && <span className="text-sm">{t('common.dashboard')}</span>}
              </Link>
              <Link
                to="/expenses"
                className="flex items-center space-x-2 px-2 py-1.5 text-gray-700 hover:bg-blue-50 rounded-lg"
              >
                <PiggyBank className="h-4 w-4" />
                {!isSidebarCollapsed && <span className="text-sm">{t('common.expenses')}</span>}
              </Link>
              <Link
                to="/incomes"
                className="flex items-center space-x-2 px-2 py-1.5 text-gray-700 hover:bg-blue-50 rounded-lg"
              >
                <Wallet className="h-4 w-4" />
                {!isSidebarCollapsed && <span className="text-sm">{t('common.incomes')}</span>}
              </Link>
              <Link
                to="/users"
                className="flex items-center space-x-2 px-2 py-1.5 text-gray-700 hover:bg-blue-50 rounded-lg"
              >
                <Users className="h-4 w-4" />
                {!isSidebarCollapsed && <span className="text-sm">{t('common.users')}</span>}
              </Link>
            </nav>
            <div className="p-2 border-t">
              <Link
                to="/settings"
                className="flex items-center space-x-2 px-2 py-1.5 text-gray-700 hover:bg-blue-50 rounded-lg"
              >
                <Settings className="h-4 w-4" />
                {!isSidebarCollapsed && <span className="text-sm">{t('common.settings')}</span>}
              </Link>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <div className={`flex-1 ${isAuthenticated ? 'p-4 md:p-8' : 'py-8 px-4'} min-h-[calc(100vh-4rem)]`}>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path='/Login' element={< Login />} />
            <Route path="/Register" element={<SignIn />} />
            <Route path="/Dashboard" element={<Dashboard />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/expenses/add" element={<AddExpense />} />
            <Route path="/incomes" element={<Incomes />} />
            <Route path="/incomes/add" element={<AddIncome />} />
            <Route path="/users" element={<UsersList />} />
            <Route path="/users/edit/:id" element={<EditUser />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white shadow-lg mt-auto" style={{ backgroundColor: theme?.colors?.background?.paper }}>
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="text-gray-500 text-sm" style={{ color: theme?.colors?.text?.secondary }}>
              © 2024 FinanceTracker. {t('common.allRightsReserved')}
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-500 hover:text-gray-700 text-sm" style={{ color: theme?.colors?.text?.secondary }}>{t('common.privacyPolicy')}</a>
              <a href="#" className="text-gray-500 hover:text-gray-700 text-sm" style={{ color: theme?.colors?.text?.secondary }}>{t('common.termsOfService')}</a>
              <a href="#" className="text-gray-500 hover:text-gray-700 text-sm" style={{ color: theme?.colors?.text?.secondary }}>{t('common.contact')}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;