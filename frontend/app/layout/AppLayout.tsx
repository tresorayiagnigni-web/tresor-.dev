// ../../layout/AppLayout.tsx

'use client';

import React, { useState, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Building,
  Activity,
  LogOut,
  Bell,
  Menu,
  X,
  ChevronRight,
  UserPlus,
  Users,
} from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
  pageTitle?: string;
  pageSubtitle?: string;
  showCreateButton?: boolean;
  onCreateClick?: () => void;
  createButtonText?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  pageTitle = 'Admin Control Center',
  pageSubtitle = 'Account Provisioning, Role Allocation, and Master Identity Controls',
  showCreateButton = true,
  onCreateClick,
  createButtonText = 'Create User',
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
      {/* SIDEBAR */}
      <aside className="hidden md:flex md:flex-col md:w-[240px] flex-shrink-0 bg-[#263A81] text-white h-screen fixed top-0 left-0 overflow-y-auto z-30">
        <div className="p-6 border-b border-white/10">

           <div className="flex items-center gap-3 mb-8">
                 {/* Logo */}
                <div className="flex w-14 h-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white p-1">
                  <img src="/logo.png" alt="logo" width={56} height={56} className="block h-full w-full rounded-full object-cover" />
                </div>

                  {/* HOD Info */}
                  <div className="min-w-0">
                    <div className="text-2xl font-bold tracking-tight leading-tight">MENDO<br />company</div>
                    <div className="text-xs font-light opacity-70 mt-2">
                      Admin Control Center
                    </div>
                  </div>
                </div>

          {/* <div className="text-2xl font-bold tracking-tight">MENDO <br />company</div>
          <div className="text-xs font-light opacity-70 mt-1">Admin Control Center</div> */}
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link href="/admin/control-center" className={getNavItemClasses('/admin/control-center')}>
            <Home size={20} /><span>Dashboard</span>
            {pathname === '/admin/control-center' && <ChevronRight size={16} className="ml-auto" />}
          </Link>
          <Link href="/admin/departments" className={getNavItemClasses('/admin/departments')}>
            <Building size={20} /><span>Departments</span>
          </Link>
          <Link href="/admin/activity" className={getNavItemClasses('/admin/activity')}>
            <Activity size={20} /><span>Activity Tracker</span>
          </Link>
          <Link href="/admin/users" className={getNavItemClasses('/admin/users')}>
            <Users size={20} /><span>Users</span>
          </Link>
        </nav>
        <div className="p-4 border-t border-white/10">
          <Link href="/login" className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200">
            <LogOut size={20} /><span className="font-medium">Logout</span>
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 md:ml-[240px] flex flex-col min-h-screen w-full">
        {/* HEADER */}
        <header className="bg-white border-b border-[#E5E7EB] px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-20 w-full">
          <div className="flex items-center gap-4">
            <button onClick={toggleMobileMenu} className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition">
              <Menu size={24} className="text-[#1F2937]" />
            </button>
            <span className="text-xl font-bold text-[#263A81] hidden md:inline">MENDO</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition">
              <Bell size={20} className="text-[#6B7280]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-px h-8 bg-[#E5E7EB]"></div>
            {showCreateButton && onCreateClick && (
              <button onClick={onCreateClick} className="flex items-center gap-2 px-4 py-2 bg-[#263A81] text-white font-medium rounded-lg hover:bg-[#1e2f6a] transition-all duration-200 active:scale-95 shadow-lg shadow-[#263A81]/20">
                <UserPlus size={18} />
                <span className="hidden sm:inline">{createButtonText}</span>
                <span className="sm:hidden">Add</span>
              </button>
            )}
          </div>
        </header>

        {/* MOBILE MENU */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={toggleMobileMenu} />
            <div className="absolute left-0 top-0 h-full w-[280px] bg-[#263A81] text-white p-6 shadow-xl animate-slide-in">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <div className="text-2xl font-bold tracking-tight">MENDO</div>
                  <div className="text-xs font-light opacity-70 mt-1">Admin Control Center</div>
                </div>
                <button onClick={toggleMobileMenu} className="p-2 hover:bg-white/10 rounded-lg transition">
                  <X size={24} />
                </button>
              </div>
              <nav className="space-y-2">
                <Link href="/admin/control-center" className={getNavItemClasses('/admin/control-center')} onClick={toggleMobileMenu}>
                  <Home size={20} /><span>Dashboard</span>
                </Link>
                <Link href="/admin/departments" className={getNavItemClasses('/admin/departments')} onClick={toggleMobileMenu}>
                  <Building size={20} /><span>Departments</span>
                </Link>
                <Link href="/admin/activity" className={getNavItemClasses('/admin/activity')} onClick={toggleMobileMenu}>
                  <Activity size={20} /><span>Activity Tracker</span>
                </Link>
                <Link href="/admin/users" className={getNavItemClasses('/admin/users')} onClick={toggleMobileMenu}>
                  <Users size={20} /><span>Users</span>
                </Link>
              </nav>
              <div className="absolute bottom-6 left-6 right-6 border-t border-white/10 pt-4">
                <Link href="/login" className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200">
                  <LogOut size={20} /><span className="font-medium">Logout</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full box-border">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#1F2937]">{pageTitle}</h1>
            <p className="text-[#6B7280] text-sm mt-1">{pageSubtitle}</p>
          </div>
          {children}
        </main>
      </div>

      <style jsx>{`
        @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        .animate-slide-in { animation: slideIn 0.3s ease-out; }
      `}</style>
    </div>
  );
};
export default AppLayout;