// app/layout/HODLayout.tsx

'use client';

import React, { useState, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  CheckSquare,
  Users,
  User,
  LogOut,
  Plus,
  Bell,
  Briefcase,
  Menu,
  UserPlus as UserPlusIcon,
  X,
  ChevronRight,
} from 'lucide-react';

interface HODLayoutProps {
  children: ReactNode;
  pageTitle: string;
  pageSubtitle: string;
  departmentName: string;
  hodName: string;
  hodInitials: string;
  showCreateButton?: boolean;
  onCreateClick?: () => void;
  createButtonText?: string;
}

export const HODLayout: React.FC<HODLayoutProps> = ({
  children,
  pageTitle,
  pageSubtitle,
  departmentName,
  hodName,
  hodInitials,
  showCreateButton = false,
  onCreateClick,
  createButtonText = 'New Task',
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
    <div className="min-h-screen bg-[#FEFEFC] font-sans antialiased flex relative">
      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside className="hidden md:flex md:flex-col md:w-[240px] flex-shrink-0 bg-[#263A81] text-white h-screen fixed top-0 left-0 overflow-y-auto z-30">
         <div className="flex items-center gap-3 mb-8">
                  {/* Logo */}
                  <div className="flex w-14 h-14 shrink-0 items-center justify-center bg-white rounded-lg">
                    <img src="/logo.png" alt="logo" width={56} height={56} className="block h-full w-full object-contain" />
                  </div>

                  {/* HOD Info */}
                  <div className="min-w-0">
                    <div className="text-2xl font-bold tracking-tight leading-tight">MENDO<br />company</div>
                    <div className="text-xs font-light opacity-70 mt-2">
                      Head of Department
                    </div>
                  </div>
                </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link href="/hod/dashboard" className={getNavItemClasses('/hod/dashboard')}>
            <Home size={20} />
            <span>Dashboard</span>
            {pathname === '/hod/dashboard' && <ChevronRight size={16} className="ml-auto" />}
          </Link>
          <Link href="/hod/task-manager" className={getNavItemClasses('/hod/task-manager')}>
            <CheckSquare size={20} />
            <span>Task Manager</span>
          </Link>
          <Link href="/hod/team-roster" className={getNavItemClasses('/hod/team-roster')}>
            <Users size={20} />
            <span>Team Roster</span>
          </Link>
          <Link href="/hod/profile" className={getNavItemClasses('/hod/profile')}>
            <User size={20} />
            <span>Profile</span>
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

      {/* ===== MAIN CONTENT WRAPPER ===== */}
      <div className="flex-1 md:ml-[240px] flex flex-col min-h-screen w-full">
        {/* ===== TOP HEADER ===== */}
        <header className="bg-white border-b border-[#E5E7EB] px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-20 w-full">
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
                MENDO <br />company
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition">
              <Bell size={20} className="text-[#6B7280]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            
            {/* HOD Info - Replaced with Button when showCreateButton is true */}
            <div className="flex items-center gap-3 pl-3 border-l border-[#E5E7EB]">
              {showCreateButton && onCreateClick ? (
                <button
                  onClick={onCreateClick}
                  className="flex items-center gap-2 px-4 py-2 bg-[#263A81] text-white font-medium rounded-lg hover:bg-[#1e2f6a] transition-all duration-200 active:scale-95 shadow-lg shadow-[#263A81]/20"
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">{createButtonText}</span>
                  <span className="sm:hidden">Add</span>
                </button>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-[#263A81] flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {hodInitials}
                  </div>
                  <div className="hidden sm:block min-w-0">
                    <div className="text-sm font-medium text-[#1F2937] truncate">{hodName}</div>
                    <div className="text-xs text-[#6B7280] truncate">Head of {departmentName}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ===== MOBILE MENU OVERLAY ===== */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={toggleMobileMenu}
            />
            <div className="absolute left-0 top-0 h-full w-[280px] bg-[#263A81] text-white p-6 shadow-xl animate-slide-in">
              <div className="flex justify-between items-center mb-8">

                <div className="flex items-center gap-3 mb-8">
                
                  <div className="min-w-0">
                    <div className="text-2xl font-bold tracking-tight leading-tight">MENDO<br />company</div>
                    <div className="text-xs font-light opacity-70 mt-2">
                      Head of Department
                    </div>
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
                <Link href="/hod/dashboard" className={getNavItemClasses('/hod/dashboard')} onClick={toggleMobileMenu}>
                  <Home size={20} />
                  <span>Dashboard</span>
                </Link>
                <Link href="/hod/task-manager" className={getNavItemClasses('/hod/task-manager')} onClick={toggleMobileMenu}>
                  <CheckSquare size={20} />
                  <span>Task Manager</span>
                </Link>
                <Link href="/hod/team-roster" className={getNavItemClasses('/hod/team-roster')} onClick={toggleMobileMenu}>
                  <Users size={20} />
                  <span>Team Roster</span>
                </Link>
                <Link href="/hod/profile" className={getNavItemClasses('/hod/profile')} onClick={toggleMobileMenu}>
                  <User size={20} />
                  <span>Profile</span>
                </Link>
              </nav>

              <div className="absolute bottom-6 left-6 right-6 border-t border-white/10 pt-4">
                <Link
                  href="/login"
                  className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
                >
                  <LogOut size={20} />
                  <span className="font-medium">Logout</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ===== PAGE CONTENT ===== */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full box-border">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#1F2937]">{pageTitle}</h1>
            <p className="text-[#6B7280] text-sm mt-1">
              <span className="font-medium text-[#263A81]">Department:</span> {departmentName}
            </p>
            {pageSubtitle && (
              <p className="text-[#6B7280] text-sm mt-1">{pageSubtitle}</p>
            )}
          </div>
          {children}
        </main>
      </div>

      {/* ===== GLOBAL STYLES ===== */}
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