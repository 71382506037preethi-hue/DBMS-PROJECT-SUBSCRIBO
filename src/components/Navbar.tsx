import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  CreditCard,
  User as UserIcon,
  LogOut,
  Sparkles,
  Menu,
  X,
  LayoutDashboard,
  Layers,
  Receipt,
  Users,
  BarChart3,
  ShieldAlert,
  ShieldCheck,
  Database,
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  openAuthModal: (initialTab?: 'login' | 'signup' | 'admin') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  openAuthModal,
}) => {
  const { user, logout, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleNavClick = (view: string) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FDFBF7]/90 backdrop-blur-md border-b border-amber-100/60 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo & Tagline */}
          <div
            id="brand-logo-btn"
            onClick={() => handleNavClick('landing')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 via-indigo-500 to-sky-400 p-0.5 shadow-sm group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-[#FDFBF7] rounded-[10px] flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-['Outfit',sans-serif] text-xl font-bold tracking-tight text-slate-900">
                  SUBSCRIBO
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block leading-none mt-0.5">
                Manage your subscriptions. One place. Zero hassle.
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2 text-sm font-medium text-slate-600">
            <button
              id="nav-home-btn"
              onClick={() => handleNavClick('landing')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                currentView === 'landing'
                  ? 'bg-amber-100/70 text-slate-900 font-semibold'
                  : 'hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              Home
            </button>

            <button
              id="nav-plans-btn"
              onClick={() => handleNavClick('plans')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                currentView === 'plans'
                  ? 'bg-amber-100/70 text-slate-900 font-semibold'
                  : 'hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              Plans
            </button>

            {/* Authenticated Customer Links */}
            {user && !isAdmin && (
              <>
                <button
                  id="nav-user-dashboard-btn"
                  onClick={() => handleNavClick('user-dashboard')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    currentView === 'user-dashboard'
                      ? 'bg-amber-100/70 text-slate-900 font-semibold'
                      : 'hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-indigo-500" />
                  Dashboard
                </button>

                <button
                  id="nav-my-subs-btn"
                  onClick={() => handleNavClick('my-subscriptions')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    currentView === 'my-subscriptions'
                      ? 'bg-amber-100/70 text-slate-900 font-semibold'
                      : 'hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-4 h-4 text-rose-500" />
                  My Subscriptions
                </button>

                <button
                  id="nav-payments-btn"
                  onClick={() => handleNavClick('payment-history')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    currentView === 'payment-history'
                      ? 'bg-amber-100/70 text-slate-900 font-semibold'
                      : 'hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <Receipt className="w-4 h-4 text-emerald-500" />
                  Payments
                </button>
              </>
            )}

            {/* Authenticated Admin Links */}
            {user && isAdmin && (
              <>
                <button
                  id="nav-admin-dashboard-btn"
                  onClick={() => handleNavClick('admin-dashboard')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    currentView === 'admin-dashboard'
                      ? 'bg-indigo-100 text-indigo-900 font-semibold'
                      : 'hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-indigo-600" />
                  Admin Overview
                </button>

                <button
                  id="nav-admin-users-btn"
                  onClick={() => handleNavClick('admin-users')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    currentView === 'admin-users'
                      ? 'bg-indigo-100 text-indigo-900 font-semibold'
                      : 'hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-4 h-4 text-sky-500" />
                  Users
                </button>

                <button
                  id="nav-admin-plans-btn"
                  onClick={() => handleNavClick('admin-plans')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    currentView === 'admin-plans'
                      ? 'bg-indigo-100 text-indigo-900 font-semibold'
                      : 'hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-4 h-4 text-amber-500" />
                  Plans CRUD
                </button>

                <button
                  id="nav-admin-subs-btn"
                  onClick={() => handleNavClick('admin-subscriptions')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    currentView === 'admin-subscriptions'
                      ? 'bg-indigo-100 text-indigo-900 font-semibold'
                      : 'hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  Subscriptions
                </button>

                <button
                  id="nav-admin-reports-btn"
                  onClick={() => handleNavClick('admin-reports')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    currentView === 'admin-reports'
                      ? 'bg-indigo-100 text-indigo-900 font-semibold'
                      : 'hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 text-emerald-500" />
                  Reports
                </button>
              </>
            )}
          </nav>

            {/* Right Section: Admin Backend Storage + Auth Controls */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Backend Database Storage Inspector Button: VISIBLE ONLY TO ADMIN */}
            {user && isAdmin && (
              <button
                id="nav-backend-storage-btn"
                onClick={() => handleNavClick('dbms-console')}
                className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                  currentView === 'dbms-console'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300'
                }`}
                title="Inspect how data is stored in the backend database tables (Admin Only)"
              >
                <Database className="w-3.5 h-3.5 text-indigo-600" />
                <span>Backend Storage</span>
              </button>
            )}

            {user ? (
              <div className="relative">
                <button
                  id="user-profile-menu-btn"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-full bg-slate-100 hover:bg-slate-200/70 transition-colors border border-slate-200"
                >
                  <div className="text-left leading-tight hidden lg:block">
                    <p className="text-xs font-bold text-slate-800 truncate max-w-[120px]">{user.name || user.email || 'User'}</p>
                    <p className="text-[10px] text-slate-500 capitalize">{user.role}</p>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                    isAdmin ? 'bg-indigo-600' : 'bg-rose-500'
                  }`}>
                    {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                </button>

                {userDropdownOpen && (
                  <div
                    id="user-dropdown-menu"
                    className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 text-sm"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-3.5 py-2 border-b border-slate-100">
                      <p className="font-semibold text-slate-900 truncate">{user.name || user.email || 'User'}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      <span className={`inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isAdmin ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {user.role} Account
                      </span>
                    </div>

                    <button
                      id="dropdown-dashboard-btn"
                      onClick={() => {
                        handleNavClick(isAdmin ? 'admin-dashboard' : 'user-dashboard');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <LayoutDashboard className="w-4 h-4 text-slate-400" />
                      Dashboard
                    </button>

                    {isAdmin && (
                      <button
                        id="dropdown-backend-storage-btn"
                        onClick={() => {
                          handleNavClick('dbms-console');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-indigo-700 hover:bg-indigo-50/70 flex items-center gap-2 font-medium"
                      >
                        <Database className="w-4 h-4 text-indigo-600" />
                        Backend Storage
                      </button>
                    )}

                    <button
                      id="dropdown-logout-btn"
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                        handleNavClick('landing');
                      }}
                      className="w-full text-left px-3.5 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-100 mt-1"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="nav-admin-login-btn"
                  onClick={() => openAuthModal('admin')}
                  className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 rounded-lg border border-indigo-200/80 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Administrative Portal Sign In"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Admin Login</span>
                </button>

                <button
                  id="nav-login-btn"
                  onClick={() => openAuthModal('login')}
                  className="px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Log In
                </button>

                <button
                  id="nav-signup-btn"
                  onClick={() => openAuthModal('signup')}
                  className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div id="mobile-navigation-drawer" className="md:hidden border-t border-slate-200 bg-[#FDFBF7] px-4 pt-3 pb-5 space-y-2">
          <button
            onClick={() => handleNavClick('landing')}
            className="w-full text-left px-3 py-2 rounded-lg font-medium text-slate-800 hover:bg-slate-100"
          >
            Home
          </button>
          <button
            onClick={() => handleNavClick('plans')}
            className="w-full text-left px-3 py-2 rounded-lg font-medium text-slate-800 hover:bg-slate-100"
          >
            Plans
          </button>

          {user && !isAdmin && (
            <>
              <button
                onClick={() => handleNavClick('user-dashboard')}
                className="w-full text-left px-3 py-2 rounded-lg font-medium text-slate-800 hover:bg-slate-100 flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4 text-indigo-500" />
                Dashboard
              </button>
              <button
                onClick={() => handleNavClick('my-subscriptions')}
                className="w-full text-left px-3 py-2 rounded-lg font-medium text-slate-800 hover:bg-slate-100 flex items-center gap-2"
              >
                <Layers className="w-4 h-4 text-rose-500" />
                My Subscriptions
              </button>
              <button
                onClick={() => handleNavClick('payment-history')}
                className="w-full text-left px-3 py-2 rounded-lg font-medium text-slate-800 hover:bg-slate-100 flex items-center gap-2"
              >
                <Receipt className="w-4 h-4 text-emerald-500" />
                Payment History
              </button>
            </>
          )}

          {user && isAdmin && (
            <>
              <button
                onClick={() => handleNavClick('admin-dashboard')}
                className="w-full text-left px-3 py-2 rounded-lg font-medium text-indigo-900 bg-indigo-50 flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4 text-indigo-600" />
                Admin Overview
              </button>
              <button
                onClick={() => handleNavClick('admin-users')}
                className="w-full text-left px-3 py-2 rounded-lg font-medium text-slate-800 hover:bg-slate-100 flex items-center gap-2"
              >
                <Users className="w-4 h-4 text-sky-500" />
                Manage Users
              </button>
              <button
                onClick={() => handleNavClick('admin-plans')}
                className="w-full text-left px-3 py-2 rounded-lg font-medium text-slate-800 hover:bg-slate-100 flex items-center gap-2"
              >
                <Layers className="w-4 h-4 text-amber-500" />
                Manage Plans
              </button>
              <button
                onClick={() => handleNavClick('admin-subscriptions')}
                className="w-full text-left px-3 py-2 rounded-lg font-medium text-slate-800 hover:bg-slate-100 flex items-center gap-2"
              >
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                Subscriptions
              </button>
              <button
                onClick={() => handleNavClick('admin-reports')}
                className="w-full text-left px-3 py-2 rounded-lg font-medium text-slate-800 hover:bg-slate-100 flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4 text-emerald-500" />
                Analytics Reports
              </button>
              <button
                id="mobile-admin-backend-storage-btn"
                onClick={() => handleNavClick('dbms-console')}
                className={`w-full text-left px-3 py-2 rounded-lg font-medium flex items-center gap-2 ${
                  currentView === 'dbms-console'
                    ? 'bg-indigo-100 text-indigo-900 font-bold'
                    : 'text-indigo-700 bg-indigo-50/60 hover:bg-indigo-100'
                }`}
              >
                <Database className="w-4 h-4 text-indigo-600" />
                <span>Backend Storage (DBMS)</span>
              </button>
            </>
          )}

          <div className="pt-3 border-t border-slate-200">
            {user ? (
              <div className="space-y-2">
                <div className="px-3 py-1">
                  <p className="text-sm font-bold text-slate-900">{user.name || user.email || 'User'}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                    handleNavClick('landing');
                  }}
                  className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                <button
                  id="mobile-nav-admin-login-btn"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('admin');
                  }}
                  className="w-full py-2 px-3 text-center text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Admin Login</span>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="mobile-nav-login-btn"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openAuthModal('login');
                    }}
                    className="w-full py-2 text-center text-sm font-semibold text-slate-800 border border-slate-300 rounded-xl cursor-pointer"
                  >
                    Log In
                  </button>
                  <button
                    id="mobile-nav-signup-btn"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openAuthModal('signup');
                    }}
                    className="w-full py-2 text-center text-sm font-semibold text-white bg-slate-900 rounded-xl cursor-pointer"
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
