// lib/navigation.ts
import {
  Home,
  Building,
  Activity,
  User,
  CheckSquare,
  Users,
  Settings,
  BarChart,
  Briefcase,
  Calendar,
  Clock,
  FileText,
  Shield,
  UserCog,
  UserPlus,
} from 'lucide-react';

// ===== ADMIN NAVIGATION =====
export const adminNavItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: <Home size={20} /> },
  { href: '/admin/departments', label: 'Departments', icon: <Building size={20} /> },
  { href: '/admin/activity', label: 'Activity Tracker', icon: <Activity size={20} /> },
];

// ===== HOD NAVIGATION =====
export const hodNavItems = [
  { href: '/hod/dashboard', label: 'Dashboard', icon: <Home size={20} /> },
  { href: '/hod/task-manager', label: 'Task Manager', icon: <CheckSquare size={20} /> },
  { href: '/hod/team-roster', label: 'Team Roster', icon: <Users size={20} /> },
  { href: '/hod/profile', label: 'Profile', icon: <User size={20} /> },
];

// ===== EMPLOYEE NAVIGATION =====
export const employeeNavItems = [
  { href: '/employee/dashboard', label: 'Dashboard', icon: <Home size={20} /> },
  { href: '/employee/tasks', label: 'My Tasks', icon: <CheckSquare size={20} /> },
  { href: '/employee/profile', label: 'My Profile', icon: <User size={20} /> },
];