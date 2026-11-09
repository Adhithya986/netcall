import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Phone, History, Wallet, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const BottomNav: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return null;

  const tabs = [
    { name: 'Dialer', path: '/dashboard', icon: Phone },
    { name: 'History', path: '/history', icon: History },
    { name: 'Wallet', path: '/wallet', icon: Wallet },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-navy-900/95 backdrop-blur-lg border-t border-navy-800 pb-safe">
      <div className="grid grid-cols-4 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                isActive ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-emerald-500/10' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[11px]">{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

