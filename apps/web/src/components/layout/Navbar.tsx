import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Phone, Wallet, History, Settings, ShieldCheck, LogOut, User, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, wallet, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const formatBalance = (paise?: number) => {
    if (paise === undefined) return '₹0.00';
    return `₹${(paise / 100).toFixed(2)}`;
  };

  const navLinks = [
    { name: 'Dialer', path: '/dashboard', icon: Phone },
    { name: 'History', path: '/history', icon: History },
    { name: 'Wallet', path: '/wallet', icon: Wallet },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  if (user?.role === 'admin') {
    navLinks.push({ name: 'Admin', path: '/admin', icon: ShieldCheck });
  }

  return (
    <header className="sticky top-0 z-40 bg-navy-900/90 backdrop-blur-md border-b border-navy-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Phone className="w-5 h-5 text-navy-950 font-bold" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                NETCALL
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </span>
              <span className="text-[10px] text-slate-400 tracking-wider block font-medium -mt-1">
                INTERNET & TELECOM
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-navy-800 text-emerald-400 shadow-sm border border-navy-700/60'
                        : 'text-slate-300 hover:text-white hover:bg-navy-800/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right Section: Balance & User Menu */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                {/* Wallet Balance Badge */}
                <Link
                  to="/wallet"
                  className="flex items-center space-x-2 bg-emerald-950/60 border border-emerald-800/60 hover:border-emerald-500/80 px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-300 transition-colors shadow-sm"
                  title="Your Calling Wallet Balance"
                >
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{formatBalance(wallet?.balancePaise)}</span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[9px] uppercase px-1.5 py-0.5 rounded font-bold">
                    Demo
                  </span>
                </Link>

                {/* User Info / Logout Button */}
                <div className="hidden sm:flex items-center space-x-2 pl-2 border-l border-navy-800">
                  <div className="w-8 h-8 rounded-full bg-navy-800 border border-navy-700 flex items-center justify-center text-xs font-bold text-slate-200">
                    {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                  </div>
                  <div className="text-left hidden lg:block">
                    <div className="text-xs font-semibold text-white truncate max-w-[100px]">
                      {user?.fullName || user?.username}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[100px]">
                      @{user?.username}
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-navy-800 rounded-lg transition-colors"
                    title="Log Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>

                {/* Mobile hamburger toggle */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 text-slate-300 hover:text-white rounded-lg focus:outline-none"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-slate-300 hover:text-white px-3 py-1.5"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-navy-950 px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-500/20"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && isAuthenticated && (
        <div className="md:hidden bg-navy-900 border-b border-navy-800 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-navy-800 text-emerald-400'
                    : 'text-slate-300 hover:text-white hover:bg-navy-800/40'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{link.name}</span>
              </Link>
            );
          })}
          <div className="pt-3 border-t border-navy-800 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              Signed in as <strong className="text-white">@{user?.username}</strong>
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className="flex items-center space-x-1 text-xs text-rose-400 hover:text-rose-300 font-semibold"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

