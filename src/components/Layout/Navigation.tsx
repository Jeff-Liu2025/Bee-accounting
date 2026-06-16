import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, PlusCircle, BarChart3, Wallet, User } from 'lucide-react';
import { BeeIcon } from '../BeeDecoration';

const Navigation: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { path: '/', label: '首页', icon: Home },
    { path: '/stats', label: '统计', icon: BarChart3 },
    { path: '/add', label: '记账', icon: PlusCircle, isCenter: true },
    { path: '/budget', label: '预算', icon: Wallet },
    { path: '/profile', label: '我的', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-bee-dark/90 backdrop-blur-lg border-t border-[#E8A838]/10 safe-area-inset-bottom z-40">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = currentPath === item.path;

          if (item.isCenter) {
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative -mt-6"
              >
                <div className="w-14 h-14 hive-button rounded-full flex items-center justify-center shadow-hive active:scale-95 touch-feedback">
                  <PlusCircle size={24} />
                </div>
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-bee-brown dark:text-gray-400">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all active:scale-95 touch-feedback ${
                isActive
                  ? 'text-[#E8A838]'
                  : 'text-bee-brown/60 dark:text-gray-500 hover:text-bee-brown dark:hover:text-gray-400'
              }`}
            >
              {isActive && item.path === '/' ? (
                <BeeIcon size={20} animate />
              ) : (
                <item.icon size={20} />
              )}
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-[#E8A838] mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;
