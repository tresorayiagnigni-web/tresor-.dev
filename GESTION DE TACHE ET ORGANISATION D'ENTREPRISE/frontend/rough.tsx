'use client';

import React, { useState } from 'react';
import { AppLayout } from '../../layout/AppLayout';
import {
  Users, User, Plus, Edit, Mail, Building, Shield, UserPlus, UserCog,
  Key, CheckCircle, AlertCircle, Search, UserCheck, Database, Clock,
  Users as UsersIcon, CheckSquare, X, Calendar, Activity, Filter,
  ChevronDown, FileText, FolderPlus, Briefcase, UserPlus as UserPlusIcon,
  MoreVertical
} from 'lucide-react';

// ===== TYPE DEFINITIONS =====
type ActivityType = 'user_created' | 'user_updated' | 'user_deleted' | 'department_created' | 'department_updated' | 'task_created' | 'task_completed' | 'project_created' | 'login';
type ActivityStatus = 'success' | 'warning' | 'error' | 'info';

interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  user: string;
  timestamp: string;
  status: ActivityStatus;
  details?: string;
}

interface CreateOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

// ===== MOCK ACTIVITY DATA =====
const MOCK_ACTIVITIES: Activity[] = [
  {
    id: '1',
    type: 'user_created',
    description: 'New user account created',
    user: 'Dr. Sarah Taylor',
    timestamp: '2026-03-18 14:32:21',
    status: 'success',
    details: 'John Doe added as Employee in IT Architecture'
  },
  {
    id: '2',
    type: 'department_created',
    description: 'New department established',
    user: 'Alice Smith',
    timestamp: '2026-03-18 13:15:42',
    status: 'success',
    details: 'Data Science department created with 5 members'
  },
  {
    id: '3',
    type: 'task_created',
    description: 'New task assigned',
    user: 'Robert Johnson',
    timestamp: '2026-03-18 11:45:10',
    status: 'success',
    details: 'Q2 Financial Report assigned to Lisa Thompson'
  },
  {
    id: '4',
    type: 'user_updated',
    description: 'User role updated',
    user: 'Maria Garcia',
    timestamp: '2026-03-18 10:20:33',
    status: 'warning',
    details: 'James Wilson promoted from Employee to HOD'
  },
  {
    id: '5',
    type: 'project_created',
    description: 'New project initiated',
    user: 'Dr. Sarah Taylor',
    timestamp: '2026-03-18 09:05:17',
    status: 'success',
    details: 'Cloud Migration 2026 project launched'
  },
  {
    id: '6',
    type: 'task_completed',
    description: 'Task marked as complete',
    user: 'John Doe',
    timestamp: '2026-03-17 16:50:45',
    status: 'success',
    details: 'Security audit completed for Q1'
  },
  {
    id: '7',
    type: 'user_deleted',
    description: 'User account removed',
    user: 'Alice Smith',
    timestamp: '2026-03-17 15:30:12',
    status: 'error',
    details: 'Inactive user account terminated: Mark Thompson'
  },
  {
    id: '8',
    type: 'login',
    description: 'User logged in',
    user: 'James Wilson',
    timestamp: '2026-03-17 14:00:00',
    status: 'info',
    details: 'Login from IP 192.168.1.100'
  },
  {
    id: '9',
    type: 'department_updated',
    description: 'Department details modified',
    user: 'Robert Johnson',
    timestamp: '2026-03-17 12:45:30',
    status: 'warning',
    details: 'Finance department budget updated'
  },
  {
    id: '10',
    type: 'task_created',
    description: 'Task assigned',
    user: 'Maria Garcia',
    timestamp: '2026-03-17 11:20:15',
    status: 'success',
    details: 'Recruitment drive planning assigned to David Kim'
  },
  {
    id: '11',
    type: 'user_updated',
    description: 'User profile updated',
    user: 'Dr. Sarah Taylor',
    timestamp: '2026-03-17 10:00:00',
    status: 'info',
    details: 'Profile photo updated'
  },
  {
    id: '12',
    type: 'project_created',
    description: 'New project created',
    user: 'Alice Smith',
    timestamp: '2026-03-17 09:30:15',
    status: 'success',
    details: 'Employee Wellness Program 2026 initiated'
  },
];

// ===== MAIN COMPONENT =====
const AdminControlCenterPage: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>(MOCK_ACTIVITIES);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState<boolean>(false);

  // Stats calculations
  const totalActivities = activities.length;
  const todayActivities = activities.filter(a => a.timestamp.startsWith(new Date().toISOString().split('T')[0])).length;
  const successCount = activities.filter(a => a.status === 'success').length;
  const warningCount = activities.filter(a => a.status === 'warning').length;
  const errorCount = activities.filter(a => a.status === 'error').length;

  // Create options
  const createOptions: CreateOption[] = [
    { id: 'department', label: 'Department', icon: <Building size={18} />, description: 'Create a new department' },
    { id: 'user', label: 'User', icon: <UserPlusIcon size={18} />, description: 'Add a new user account' },
    { id: 'task', label: 'Task', icon: <CheckSquare size={18} />, description: 'Create a new task' },
    { id: 'project', label: 'Project', icon: <Briefcase size={18} />, description: 'Start a new project' },
  ];

  const handleCreateClick = (optionId: string) => {
    setIsCreateMenuOpen(false);
    // Handle each create option
    switch(optionId) {
      case 'department':
        alert('Create Department modal would open here');
        break;
      case 'user':
        alert('Create User modal would open here');
        break;
      case 'task':
        alert('Create Task modal would open here');
        break;
      case 'project':
        alert('Create Project modal would open here');
        break;
    }
  };

  // Get activity icon and color
  const getActivityIcon = (type: ActivityType) => {
    const icons = {
      user_created: <UserPlusIcon size={16} />,
      user_updated: <UserCog size={16} />,
      user_deleted: <UserX size={16} />,
      department_created: <Building size={16} />,
      department_updated: <Building size={16} />,
      task_created: <CheckSquare size={16} />,
      task_completed: <CheckCircle size={16} />,
      project_created: <Briefcase size={16} />,
      login: <User size={16} />,
    };
    return icons[type] || <Activity size={16} />;
  };

  const getActivityColor = (status: ActivityStatus) => {
    const colors = {
      success: 'bg-green-100 text-green-600',
      warning: 'bg-yellow-100 text-yellow-600',
      error: 'bg-red-100 text-red-600',
      info: 'bg-blue-100 text-blue-600',
    };
    return colors[status];
  };

  const getStatusLabel = (status: ActivityStatus) => {
    const labels = {
      success: 'Success',
      warning: 'Warning',
      error: 'Error',
      info: 'Info',
    };
    return labels[status];
  };

  const getTypeLabel = (type: ActivityType) => {
    const labels = {
      user_created: 'User Created',
      user_updated: 'User Updated',
      user_deleted: 'User Deleted',
      department_created: 'Department Created',
      department_updated: 'Department Updated',
      task_created: 'Task Created',
      task_completed: 'Task Completed',
      project_created: 'Project Created',
      login: 'Login',
    };
    return labels[type] || type;
  };

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         activity.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         activity.details?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || activity.type === filterType;
    return matchesSearch && matchesFilter;
  });

  // Get unique activity types for filter
  const activityTypes = Array.from(new Set(activities.map(a => a.type)));

  return (
    <AppLayout
      pageTitle="Admin Control Center"
      pageSubtitle="Manage your organization's activities, users, departments, and projects"
      showCreateButton={true}
      onCreateClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
      createButtonText="Create"
    >
      {/* Create Dropdown Menu */}
      {isCreateMenuOpen && (
        <div className="relative z-50">
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-[#E5E7EB] overflow-hidden animate-fade-in">
            <div className="p-2">
              {createOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleCreateClick(option.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition duration-150"
                >
                  <div className="p-2 bg-[#263A81]/10 rounded-lg text-[#263A81]">
                    {option.icon}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-[#1F2937]">{option.label}</div>
                    <div className="text-xs text-[#6B7280]">{option.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#6B7280]">Total Activities</p>
              <p className="text-3xl font-bold text-[#1F2937] mt-1">{totalActivities}</p>
            </div>
            <div className="p-3 bg-[#263A81]/10 rounded-lg">
              <Activity size={24} className="text-[#263A81]" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="text-green-600">● {successCount} Success</span>
            <span className="text-yellow-600">● {warningCount} Warning</span>
            <span className="text-red-600">● {errorCount} Error</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#6B7280]">Today's Activity</p>
              <p className="text-3xl font-bold text-[#1F2937] mt-1">{todayActivities}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar size={24} className="text-blue-600" />
            </div>
          </div>
          <div className="mt-4 text-xs text-[#6B7280]">
            {todayActivities > 0 ? 'Active day' : 'No activity yet'}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#6B7280]">Most Active User</p>
              <p className="text-2xl font-bold text-[#1F2937] mt-1">Dr. Sarah Taylor</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <UserCheck size={24} className="text-purple-600" />
            </div>
          </div>
          <div className="mt-2 text-xs text-[#6B7280]">
            {activities.filter(a => a.user === 'Dr. Sarah Taylor').length} activities
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#6B7280]">User Actions</p>
              <p className="text-3xl font-bold text-[#1F2937] mt-1">
                {activities.filter(a => a.type.includes('user')).length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Users size={24} className="text-green-600" />
            </div>
          </div>
          <div className="mt-4 text-xs text-[#6B7280]">
            {activities.filter(a => a.type === 'user_created').length} created · {activities.filter(a => a.type === 'user_deleted').length} deleted
          </div>
        </div>
      </div>

      {/* Activity History Table */}
      <section className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#E5E7EB]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Clock size={24} className="text-[#263A81]" />
              <h2 className="text-xl font-bold text-[#1F2937]">Activity History</h2>
              <span className="text-sm text-[#6B7280] bg-gray-100 px-3 py-1 rounded-full">
                {filteredActivities.length} activities
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6B7280]" />
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-56 h-10 pl-10 pr-4 rounded-lg border border-[#E5E7EB] bg-[#FEFEFC] text-[#1F2937] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition"
                />
              </div>
              {/* Filter */}
              <div className="relative">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full sm:w-48 h-10 px-4 pr-10 rounded-lg border border-[#E5E7EB] bg-[#FEFEFC] text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition appearance-none"
                >
                  <option value="all">All Activities</option>
                  {activityTypes.map((type) => (
                    <option key={type} value={type}>{getTypeLabel(type)}</option>
                  ))}
                </select>
                <Filter size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6B7280] pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-gray-50/70">
                <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold tracking-wide">Activity</th>
                <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold tracking-wide">User</th>
                <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold tracking-wide">Status</th>
                <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold tracking-wide">Timestamp</th>
                <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold tracking-wide">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#6B7280]">
                    <div className="flex flex-col items-center gap-2">
                      <Activity size={48} className="text-[#6B7280] opacity-30" />
                      <p className="font-medium">No activities found</p>
                      <p className="text-sm">Try adjusting your search or filter</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredActivities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50/50 transition duration-150">
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${getActivityColor(activity.status)}`}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div>
                          <div className="text-[#1F2937] font-medium">{activity.description}</div>
                          <div className="text-xs text-[#6B7280]">{getTypeLabel(activity.type)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#263A81]/10 flex items-center justify-center text-[#263A81] font-semibold text-xs flex-shrink-0">
                          {activity.user.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-[#1F2937]">{activity.user}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getActivityColor(activity.status)}`}>
                        {getStatusLabel(activity.status)}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-[#6B7280] text-xs whitespace-nowrap">
                      {activity.timestamp}
                    </td>
                    <td className="py-3.5 px-6 text-[#6B7280] max-w-xs truncate">
                      {activity.details || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </AppLayout>
  );
};

export default AdminControlCenterPage;