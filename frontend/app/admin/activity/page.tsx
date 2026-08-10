// app/admin/activity-tracker/page.tsx

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/app/layout/AppLayout';
import {
  Building,
  Mail,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Search,
  Database,
  UserCheck,
  UserPlus,
  UserX,
  FileText,
  DollarSign,
  CalendarDays,
  ListChecks,
  Plus,
  Edit,
  Trash2,
  User,
} from 'lucide-react';
import { getTasks, type Task, type TaskStatus } from '@/lib/actions/taskActions';
import { getUsers, type User as ApiUser } from '@/lib/actions/userActions';
import { getDepartments, type Department } from '@/lib/actions/departmentActions';

// ========== TYPE DEFINITIONS ==========
type ActivityType = 'task-created' | 'task-completed' | 'task-assigned' | 'account-removed' | 'user-created' | 'request-approved' | 'request-rejected';

interface ActivityLog {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: string;
}

// ========== MAIN COMPONENT ==========
const AdminActivityPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedActivityType, setSelectedActivityType] = useState<string>('all');

  // ========== LOAD DATA ==========
  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [taskResult, userResult, deptResult] = await Promise.all([
        getTasks(),
        getUsers(),
        getDepartments(),
      ]);

      if (taskResult.success && taskResult.data) {
        setTasks(taskResult.data);
      }
      if (userResult.success && userResult.data) {
        setUsers(userResult.data);
      }
      if (deptResult.success && deptResult.data) {
        setDepartments(deptResult.data);
      }
    } catch (err) {
      setError('Failed to load activity data');
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // ========== DERIVED STATE ==========
  // Map tasks to display format
  const mappedTasks = tasks.map(task => {
    const assignedUser = users.find(u => u.id === task.userId);
    const department = departments.find(d => d.id === assignedUser?.departmentId);

    const statusMap: Record<string, 'pending' | 'in-progress' | 'completed'> = {
      'A_faire': 'pending',
      'En_cours': 'in-progress',
      'Terminer': 'completed',
    };

    const priorityMap: Record<string, 'low' | 'medium' | 'high'> = {
      'Bas': 'low',
      'Moyen': 'medium',
      'Elevee': 'high',
    };

    return {
      id: task.id?.toString() || '',
      title: task.titre || '',
      department: department?.nom_departement || assignedUser?.departement || 'Unassigned',
      assignedPersonnel: assignedUser?.nom || 'Unassigned',
      dueDate: task.Date_limite || '',
      status: statusMap[task.status || 'A_faire'] || 'pending',
      priority: priorityMap[task.priorite || 'Moyen'] || 'medium',
    };
  });

  // Generate activity logs from tasks and users
  const generateActivities = (): ActivityLog[] => {
    const activities: ActivityLog[] = [];

    // Task creation activities
    tasks.forEach(task => {
      if (task.cree_le) {
        const creator = users.find(u => u.id === task.userId);
        activities.push({
          id: `task-created-${task.id}`,
          type: 'task-created',
          description: `${creator?.nom || 'Someone'} created task '${task.titre}'`,
          timestamp: task.cree_le,
        });
      }
    });

    // User creation activities (based on users array)
    users.forEach(user => {
      if (user.createdAt) {
        activities.push({
          id: `user-created-${user.id}`,
          type: 'user-created',
          description: `User account created for ${user.nom}`,
          timestamp: user.createdAt,
        });
      }
    });

    // Sort by timestamp descending (newest first)
    return activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  };

  const allActivities = generateActivities();

  // ===== FILTERED STATE =====
  const filteredTasks = useMemo(() => {
    let filtered = mappedTasks;
    
    if (taskFilter !== 'all') {
      filtered = filtered.filter(task => task.status === taskFilter);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.department.toLowerCase().includes(query) ||
        task.assignedPersonnel.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [mappedTasks, taskFilter, searchQuery]);

  const filteredActivities = useMemo(() => {
    if (selectedActivityType === 'all') return allActivities;
    return allActivities.filter(activity => activity.type === selectedActivityType);
  }, [allActivities, selectedActivityType]);

  // ========== HELPER FUNCTIONS ==========
  const getStatusBadge = (status: 'pending' | 'in-progress' | 'completed' | 'approved' | 'rejected') => {
    const config = {
      'pending': {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: <Clock size={14} className="mr-1" />,
        label: 'Pending',
      },
      'in-progress': {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        icon: <Activity size={14} className="mr-1" />,
        label: 'In Progress',
      },
      'completed': {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: <CheckCircle size={14} className="mr-1" />,
        label: 'Completed',
      },
      'approved': {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: <CheckCircle size={14} className="mr-1" />,
        label: 'Approved',
      },
      'rejected': {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: <AlertCircle size={14} className="mr-1" />,
        label: 'Rejected',
      },
    };
    return config[status];
  };

  const getPriorityBadge = (priority: 'low' | 'medium' | 'high') => {
    const config = {
      low: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        label: 'Low',
      },
      medium: {
        bg: 'bg-amber-100',
        text: 'text-amber-800',
        label: 'Medium',
      },
      high: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        label: 'High',
      },
    };
    return config[priority];
  };

  const getActivityTypeIcon = (type: ActivityType) => {
    const icons = {
      'task-created': <Plus size={16} className="text-blue-600" />,
      'task-completed': <CheckCircle size={16} className="text-green-600" />,
      'task-assigned': <UserPlus size={16} className="text-purple-600" />,
      'account-removed': <UserX size={16} className="text-red-600" />,
      'user-created': <UserPlus size={16} className="text-emerald-600" />,
      'request-approved': <CheckCircle size={16} className="text-green-600" />,
      'request-rejected': <AlertCircle size={16} className="text-red-600" />,
    };
    return icons[type] || <Activity size={16} className="text-gray-600" />;
  };

  const getActivityTypeLabel = (type: ActivityType) => {
    const labels = {
      'task-created': 'Task Created',
      'task-completed': 'Task Completed',
      'task-assigned': 'Task Assigned',
      'account-removed': 'Account Removed',
      'user-created': 'User Created',
      'request-approved': 'Request Approved',
      'request-rejected': 'Request Rejected',
    };
    return labels[type] || 'Activity';
  };

  const getActivityTypeColor = (type: ActivityType) => {
    const colors = {
      'task-created': 'border-blue-200 bg-blue-50',
      'task-completed': 'border-green-200 bg-green-50',
      'task-assigned': 'border-purple-200 bg-purple-50',
      'account-removed': 'border-red-200 bg-red-50',
      'user-created': 'border-emerald-200 bg-emerald-50',
      'request-approved': 'border-green-200 bg-green-50',
      'request-rejected': 'border-red-200 bg-red-50',
    };
    return colors[type] || 'border-gray-200 bg-gray-50';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return 'No date';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFilterButtonClasses = (filter: 'all' | 'pending' | 'in-progress' | 'completed') => {
    const baseClasses =
      'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200';
    const activeClasses = 'bg-[#263A81] text-white shadow-lg shadow-[#263A81]/20';
    const inactiveClasses = 'bg-white text-[#1F2937] border border-[#E5E7EB] hover:bg-gray-50';
    return `${baseClasses} ${taskFilter === filter ? activeClasses : inactiveClasses}`;
  };

  // ===== LOADING STATE =====
  if (isLoading) {
    return (
      <AppLayout
        pageTitle="Global Activity & Operations Tracker"
        pageSubtitle="Loading activity data..."
        showCreateButton={false}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#263A81] mx-auto mb-4"></div>
            <p className="text-[#6B7280]">Loading activity data...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ===== ERROR STATE =====
  if (error) {
    return (
      <AppLayout
        pageTitle="Global Activity & Operations Tracker"
        pageSubtitle="Error loading data"
        showCreateButton={false}
      >
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <AlertCircle size={64} className="text-red-500 opacity-50 mb-4" />
          <h3 className="text-xl font-semibold text-[#1F2937] mb-2">Error Loading Activity</h3>
          <p className="text-[#6B7280]">{error}</p>
        </div>
      </AppLayout>
    );
  }

  // ========== RENDER ==========
  return (
    <AppLayout
      pageTitle="Global Activity & Operations Tracker"
      pageSubtitle="Company-Wide Task Monitoring, Employee Request Pipelines, and Master System Audit Streams"
      showCreateButton={false}
    >
      <div className="space-y-6">
        {/* ===== OPERATIONAL TASK BOARD ===== */}
        <section className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#E5E7EB]">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <ListChecks size={24} className="text-[#263A81]" />
                <h2 className="text-xl font-bold text-[#1F2937]">Operational Task Board</h2>
                <span className="text-sm text-[#6B7280] bg-gray-100 px-3 py-1 rounded-full">
                  {filteredTasks.length} tasks
                </span>
              </div>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6B7280]" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full md:w-56 h-10 pl-10 pr-4 rounded-lg border border-[#E5E7EB] bg-[#FEFEFC] text-[#1F2937] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition"
                />
              </div>
            </div>
          </div>

          {/* Task Filter Controls */}
          <div className="px-6 py-4 border-b border-[#E5E7EB] bg-gray-50/50">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTaskFilter('all')}
                className={getFilterButtonClasses('all')}
              >
                All Tasks
              </button>
              <button
                onClick={() => setTaskFilter('pending')}
                className={getFilterButtonClasses('pending')}
              >
                Pending
              </button>
              <button
                onClick={() => setTaskFilter('in-progress')}
                className={getFilterButtonClasses('in-progress')}
              >
                In Progress
              </button>
              <button
                onClick={() => setTaskFilter('completed')}
                className={getFilterButtonClasses('completed')}
              >
                Completed
              </button>
            </div>
          </div>

          {/* Task Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-gray-50/70">
                  <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold tracking-wide">Task Title</th>
                  <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold tracking-wide">Department</th>
                  <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold tracking-wide">Assigned Personnel</th>
                  <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold tracking-wide">Due Date</th>
                  <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[#6B7280]">
                      <div className="flex flex-col items-center gap-2">
                        <ListChecks size={48} className="text-[#6B7280] opacity-30" />
                        <p className="font-medium">No tasks found</p>
                        <p className="text-sm">Try adjusting your filters or search</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => {
                    const statusConfig = getStatusBadge(task.status);
                    const priorityConfig = getPriorityBadge(task.priority);
                    return (
                      <tr key={task.id} className="hover:bg-gray-50/50 transition duration-150">
                        <td className="py-3.5 px-6">
                          <div>
                            <div className="text-[#1F2937] font-medium">{task.title}</div>
                            <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${priorityConfig.bg} ${priorityConfig.text}`}>
                              {priorityConfig.label} Priority
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-1.5">
                            <Building size={14} className="text-[#6B7280]" />
                            <span className="text-[#1F2937]">{task.department}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-1.5">
                            <User size={14} className="text-[#6B7280]" />
                            <span className={`${task.assignedPersonnel === 'Unassigned' ? 'text-[#6B7280] italic' : 'text-[#1F2937]'}`}>
                              {task.assignedPersonnel}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={14} className="text-[#6B7280]" />
                            <span className="text-[#6B7280]">{formatDate(task.dueDate)}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-6">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${statusConfig.bg} ${statusConfig.text}`}
                          >
                            {statusConfig.icon}
                            {statusConfig.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ===== MASTER ACTIVITY STREAM ===== */}
        <section className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#E5E7EB]">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <Database size={24} className="text-[#263A81]" />
                <h2 className="text-xl font-bold text-[#1F2937]">Master Activity Stream</h2>
                <span className="text-sm text-[#6B7280] bg-gray-100 px-3 py-1 rounded-full">
                  {filteredActivities.length} events
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedActivityType('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    selectedActivityType === 'all'
                      ? 'bg-[#263A81] text-white'
                      : 'bg-gray-100 text-[#6B7280] hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedActivityType('task-created')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    selectedActivityType === 'task-created'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  Created
                </button>
                <button
                  onClick={() => setSelectedActivityType('task-completed')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    selectedActivityType === 'task-completed'
                      ? 'bg-green-600 text-white'
                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                >
                  Completed
                </button>
                <button
                  onClick={() => setSelectedActivityType('user-created')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    selectedActivityType === 'user-created'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  Users
                </button>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="p-6">
            <div className="space-y-4">
              {filteredActivities.length === 0 ? (
                <div className="text-center py-8 text-[#6B7280]">
                  <p>No activities found for the selected filter</p>
                </div>
              ) : (
                filteredActivities.map((activity, index) => {
                  const activityColor = getActivityTypeColor(activity.type);
                  return (
                    <div key={activity.id} className="flex gap-4">
                      {/* Timeline line and dot */}
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full ${activityColor} flex items-center justify-center border-2 ${activityColor.split(' ')[0]} flex-shrink-0`}>
                          {getActivityTypeIcon(activity.type)}
                        </div>
                        {index < filteredActivities.length - 1 && (
                          <div className="w-0.5 h-12 bg-[#E5E7EB] mt-2"></div>
                        )}
                      </div>

                      {/* Activity content */}
                      <div className="flex-1 pt-1 pb-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <div>
                            <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-1 ${activityColor}`}>
                              {getActivityTypeLabel(activity.type)}
                            </span>
                            <p className="text-[#1F2937]">{activity.description}</p>
                          </div>
                          <span className="text-xs text-[#6B7280] whitespace-nowrap">
                            {formatTimestamp(activity.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* ===== DEPARTMENT TASK SUMMARY ===== */}
        <section className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-3">
              <Building size={24} className="text-[#263A81]" />
              <h2 className="text-xl font-bold text-[#1F2937]">Department Task Summary</h2>
              <span className="text-sm text-[#6B7280] bg-gray-100 px-3 py-1 rounded-full">
                {departments.length} departments
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {departments.length === 0 ? (
              <div className="col-span-full text-center py-8 text-[#6B7280]">
                <Building size={48} className="mx-auto text-[#6B7280] opacity-30 mb-3" />
                <p className="font-medium">No departments found</p>
              </div>
            ) : (
              departments.map((dept) => {
                // Get users in this department
                const deptUsers = users.filter(u => u.departmentId === dept.id);
                const deptUserIds = deptUsers.map(u => u.id).filter((id): id is number => id !== undefined);
                
                // Get tasks for users in this department
                const deptTasks = tasks.filter(t => t.userId && deptUserIds.includes(t.userId));
                
                const pending = deptTasks.filter(t => t.status !== 'Terminer').length;
                const completed = deptTasks.filter(t => t.status === 'Terminer').length;
                const total = deptTasks.length;

                return (
                  <div
                    key={dept.id}
                    className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-[#1F2937]">{dept.nom_departement || 'Unnamed'}</h3>
                        <p className="text-xs text-[#6B7280]">{deptUserIds.length} employees</p>
                      </div>
                      <div className="p-2 bg-[#263A81]/10 rounded-lg">
                        <Building size={18} className="text-[#263A81]" />
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[#6B7280]">Total Tasks</span>
                        <span className="font-semibold text-[#1F2937]">{total}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#6B7280]">Pending</span>
                        <span className="font-semibold text-amber-600">{pending}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#6B7280]">Completed</span>
                        <span className="font-semibold text-green-600">{completed}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {total > 0 && (
                      <div className="mt-3 pt-3 border-t border-[#E5E7EB]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full transition-all duration-500"
                              style={{ width: `${(completed / total) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-[#1F2937]">
                            {Math.round((completed / total) * 100)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </AppLayout>
  );
};

export default AdminActivityPage;