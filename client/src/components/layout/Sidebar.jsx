import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  LayoutDashboard, Users, Database, CalendarCheck,
  LogOut, ChevronLeft, ChevronRight, Library, Layers, Settings, QrCode
} from 'lucide-react';

import { logoutAdmin } from '../../store/slices/authSlice';

const navItems = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Scan Station', path: '/admin/scan-station', icon: QrCode },
  { name: 'Students', path: '/admin/students', icon: Users },
  { name: 'Fees & Ledger', path: '/admin/fees', icon: Database }
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading: logoutLoading } = useSelector((state) => state.adminAuth);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280) setIsCollapsed(true);
      else setIsCollapsed(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      await dispatch(logoutAdmin());
      navigate('/admin/login');
    }
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 88 : 280 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="h-screen bg-slate-50 dark:bg-[#09090b] flex flex-col sticky top-0 border-r border-slate-200 dark:border-white/[0.04] z-50 overflow-hidden"
    >
      {/* ---------------- BRAND HEADER ---------------- */}
      <div className="h-20 px-6 flex items-center gap-4 border-b border-slate-200 dark:border-white/[0.04] shrink-0 bg-slate-50/50 dark:bg-[#0c0c0e]/50">
        <div className="min-w-[42px] w-[42px] h-[42px] bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-slate-900 dark:text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] shrink-0">
          <Library size={22} strokeWidth={2.5} />
        </div>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col"
            >
              <span className="font-black text-slate-900 dark:text-white text-base tracking-tighter leading-none">
                LIBRYNC <span className="text-blue-500 italic">HUB</span>
              </span>
              <span className="text-[9px] font-black text-slate-500 dark:text-zinc-600 uppercase tracking-[0.3em] mt-1.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Active Node v2
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ---------------- NAVIGATION ---------------- */}
      <LayoutGroup>
        <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto no-scrollbar relative">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="group relative flex items-center h-12 outline-none"
              >
                {/* 1. SLIDING BACKGROUND */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="navItemActive"
                      className="absolute inset-0 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-[14px] z-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                </AnimatePresence>

                {/* 2. BLUE PILL INDICATOR */}
                {isActive && (
                  <motion.div
                    layoutId="sidebarActivePill"
                    className="absolute left-[-16px] w-[4px] h-6 bg-blue-500 rounded-r-full z-10 shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}

                <div className="w-12 h-full flex items-center justify-center shrink-0 relative z-10">
                  <item.icon
                    size={19}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={`transition-all duration-500 ${isActive ? 'text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'text-slate-500 dark:text-zinc-500 group-hover:text-slate-800 dark:text-gray-200'
                      }`}
                  />
                </div>

                <AnimatePresence mode="wait">
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -5 }}
                      className={`font-bold text-[11px] uppercase tracking-[0.15em] whitespace-nowrap relative z-10 transition-colors duration-300 ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-zinc-500 group-hover:text-slate-800 dark:text-gray-200'
                        }`}
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            );
          })}
        </nav>
      </LayoutGroup>

      {/* ---------------- FOOTER ACTIONS ---------------- */}
      <div className="p-4 bg-slate-50/50 dark:bg-[#0c0c0e]/50 border-t border-slate-200 dark:border-white/[0.04] space-y-3">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center h-12 rounded-[14px] text-slate-500 dark:text-zinc-600 hover:bg-rose-500/10 hover:text-rose-500 border border-transparent transition-all group relative ${isCollapsed ? 'justify-center' : 'px-4 gap-4'}`}
        >
          <LogOut size={18} strokeWidth={2.5} className="shrink-0 transition-transform group-hover:-translate-x-1" />
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-[10px] font-black uppercase tracking-[0.2em]"
            >
              {logoutLoading ? "Syncing..." : "Terminate"}
            </motion.span>
          )}
        </button>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center h-11 rounded-[12px] bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] text-slate-500 dark:text-zinc-500 hover:text-blue-500 hover:border-blue-500/30 transition-all shadow-sm active:scale-95"
        >
          {isCollapsed ? <ChevronRight size={16} /> : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
              <ChevronLeft size={16} />
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Minimize Interface</span>
            </motion.div>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
