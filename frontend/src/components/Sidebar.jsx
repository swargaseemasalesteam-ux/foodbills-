import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  PlusCircle,
  Receipt,
  FileSpreadsheet,
  Image,
  Users,
  UtensilsCrossed
} from 'lucide-react';

const Sidebar = ({ mobileOpen, closeMobile }) => {
  const { isAdmin } = useAuth();

  const adminNavs = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Food Bills', path: '/admin/bills', icon: Receipt },
    { name: '15-Day Reports', path: '/admin/reports/15-day', icon: FileSpreadsheet },
    { name: 'Screenshot Reports', path: '/admin/reports/screenshots', icon: Image },
    { name: 'Agents', path: '/admin/agents', icon: Users }
  ];

  const agentNavs = [
    { name: 'Dashboard', path: '/agent/dashboard', icon: LayoutDashboard },
    { name: 'Submit Food Bill', path: '/agent/submit', icon: PlusCircle, highlight: true },
    { name: 'My Food Bills', path: '/agent/my-bills', icon: Receipt }
  ];

  const navItems = isAdmin ? adminNavs : agentNavs;

  const getNavLinkClass = ({ isActive }, isHighlight) => {
    const base = "flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all duration-150";
    if (isHighlight) {
      return `${base} bg-primary-900 text-white shadow-md hover:bg-primary-800 font-semibold`;
    }
    if (isActive) {
      return `${base} bg-primary-50 text-primary-900 font-semibold border-l-4 border-primary-900 shadow-xs`;
    }
    return `${base} text-slate-600 hover:bg-slate-100 hover:text-slate-900`;
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col shrink-0 border-r border-slate-200 bg-white min-h-[calc(100vh-4rem)] p-4">
        <div className="mb-2 px-3 py-1.5 text-xs font-semibold tracking-wider text-slate-400 uppercase">
          {isAdmin ? 'Admin Navigation' : 'Agent Navigation'}
        </div>
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={(props) => getNavLinkClass(props, item.highlight)}
              >
                <Icon className={`h-5 w-5 ${item.highlight ? 'text-white' : ''}`} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {!isAdmin && (
          <div className="mt-auto rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50/50 p-4 text-center">
            <UtensilsCrossed className="mx-auto h-8 w-8 text-primary-900 mb-2 opacity-80" />
            <h4 className="text-xs font-bold text-slate-800">Quick Bill Submission</h4>
            <p className="mt-1 text-[11px] text-slate-500">Submit your food receipts in less than 30 seconds from your phone!</p>
            <NavLink
              to="/agent/submit"
              className="mt-3 block w-full rounded-lg bg-primary-900 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-800"
            >
              + Submit Food Bill
            </NavLink>
          </div>
        )}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Mobile Drawer Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white p-4 transition-transform duration-200 ease-in-out md:hidden shadow-xl ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-900 text-white font-bold text-xs">
              FB
            </div>
            <span className="font-bold text-slate-800">Food Bill Portal</span>
          </div>
          <button
            onClick={closeMobile}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeMobile}
                className={(props) => getNavLinkClass(props, item.highlight)}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Quick Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-slate-200 bg-white py-2 md:hidden shadow-lg">
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 text-[10px] font-medium ${
                  isActive ? 'text-primary-900 font-bold' : 'text-slate-500'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    </>
  );
};

export default Sidebar;
