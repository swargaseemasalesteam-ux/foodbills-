import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Utensils, ShieldCheck, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar = ({ toggleMobileSidebar }) => {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6 shadow-sm">
      <div className="flex items-center gap-3">
        {/* Mobile menu hamburger toggle */}
        <button
          onClick={toggleMobileSidebar}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 md:hidden"
          aria-label="Toggle navigation"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-900 text-white shadow-sm">
            <Utensils className="h-5 w-5" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-primary-900 block leading-none">Food Bills</span>
            <span className="text-[10px] font-medium tracking-wider text-slate-500 uppercase">Internal Portal</span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {/* User Badge */}
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs">
          {isAdmin ? (
            <ShieldCheck className="h-4 w-4 text-primary-900" />
          ) : (
            <UserCheck className="h-4 w-4 text-emerald-600" />
          )}
          <div className="flex flex-col text-left">
            <span className="font-semibold text-slate-800 leading-tight">{user?.name}</span>
            <span className="text-[10px] font-medium text-slate-500 capitalize leading-none">
              {isAdmin ? 'Admin' : `Agent (${user?.agent?.employeeId || 'Active'})`}
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
          title="Sign Out"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
