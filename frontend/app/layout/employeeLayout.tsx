// app/layout/EmployeeLayout.tsx

'use client';

import React, { useState, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  CheckSquare,
  User,
  LogOut,
  Bell,
  Briefcase,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';

interface EmployeeLayoutProps {
  children: ReactNode;
  pageTitle: string;
  pageSubtitle?: string;
  employeeName: string;
  employeeInitials: string;
  employeeRole: string;
}

export const EmployeeLayout: React.FC<EmployeeLayoutProps> = ({
  children,
  pageTitle,
  pageSubtitle,
  employeeName,
  employeeInitials,
  employeeRole,
}) => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const getNavItemClasses = (targetPath: string) => {
    const baseClasses =
      'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer w-full';
    const activeClasses = 'bg-white/10 text-white font-medium';
    const inactiveClasses = 'text-white/70 hover:text-white hover:bg-white/10';
    const isActive = pathname === targetPath;
    return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-[#FEFEFC] font-sans antialiased flex">
      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside className="hidden md:flex md:flex-col md:w-[240px] bg-[#263A81] text-white h-screen sticky top-0 overflow-y-auto">
        <div className="p-6 border-b border-white/10">
          <div className="text-2xl font-bold tracking-tight">MENDO HR</div>
          <div className="text-xs font-light opacity-70 mt-1">
            Employee Workspace
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link href="/employee/dashboard" className={getNavItemClasses('/employee/dashboard')}>
            <Home size={20} />
            <span>Dashboard</span>
            {pathname === '/employee/dashboard' && <ChevronRight size={16} className="ml-auto" />}
          </Link>
          <Link href="/employee/tasks" className={getNavItemClasses('/employee/tasks')}>
            <CheckSquare size={20} />
            <span>My Tasks</span>
            {pathname === '/employee/tasks' && <ChevronRight size={16} className="ml-auto" />}
          </Link>
          <Link href="/employee/profile" className={getNavItemClasses('/employee/profile')}>
            <User size={20} />
            <span>My Profile</span>
            {pathname === '/employee/profile' && <ChevronRight size={16} className="ml-auto" />}
          </Link>
        </nav>

        <div className="p-4 border-t border-white/10">
          <Link
            href="/login"
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </Link>
        </div>
      </aside>

      {/* ===== MOBILE MENU OVERLAY ===== */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={toggleMobileMenu}
          />
          <div className="absolute left-0 top-0 h-full w-[280px] bg-[#263A81] text-white p-6 shadow-xl animate-slide-in">
            <div className="flex justify-between items-center mb-8">
              <div>
                <div className="text-2xl font-bold tracking-tight">MENDO HR</div>
                <div className="text-xs font-light opacity-70 mt-1">
                  Employee Workspace
                </div>
              </div>
              <button
                onClick={toggleMobileMenu}
                className="p-2 hover:bg-white/10 rounded-lg transition"
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>

            <nav className="space-y-2">
              <Link href="/employee/dashboard" className={getNavItemClasses('/employee/dashboard')} onClick={toggleMobileMenu}>
                <Home size={20} />
                <span>Dashboard</span>
              </Link>
              <Link href="/employee/tasks" className={getNavItemClasses('/employee/tasks')} onClick={toggleMobileMenu}>
                <CheckSquare size={20} />
                <span>My Tasks</span>
              </Link>
              <Link href="/employee/profile" className={getNavItemClasses('/employee/profile')} onClick={toggleMobileMenu}>
                <User size={20} />
                <span>My Profile</span>
              </Link>
            </nav>

            <div className="absolute bottom-6 left-6 right-6 border-t border-white/10 pt-4">
              <Link
                href="/login"
                className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
                onClick={toggleMobileMenu}
              >
                <LogOut size={20} />
                <span className="font-medium">Logout</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* ===== TOP HEADER ===== */}
        <header className="bg-white border-b border-[#E5E7EB] px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition"
              aria-label="Toggle menu"
            >
              <Menu size={24} className="text-[#1F2937]" />
            </button>
            <div className="flex items-center gap-2">
              <Briefcase size={24} className="text-[#263A81] md:hidden" />
              <span className="text-xl font-bold text-[#263A81] hidden md:inline">
                MENDO HR
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition">
              <Bell size={20} className="text-[#6B7280]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 pl-3 border-l border-[#E5E7EB]">
              <div className="w-10 h-10 rounded-full bg-[#263A81] flex items-center justify-center text-white font-semibold">
                {employeeInitials}
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-[#1F2937]">{employeeName}</div>
                <div className="text-xs text-[#6B7280]">{employeeRole}</div>
              </div>
            </div>
          </div>
        </header>

        {/* ===== PAGE CONTENT ===== */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#1F2937]">{pageTitle}</h1>
            {pageSubtitle && (
              <p className="text-[#6B7280] text-sm mt-1">{pageSubtitle}</p>
            )}
          </div>
          {children}
        </main>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in { animation: slideIn 0.3s ease-out; }
      `}</style>
    </div>
  );
};