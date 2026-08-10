// app/hod/dashboard/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { HODLayout } from '@/app/layout/HodLayout';
import {
  CheckSquare,
  Users as UsersIcon,
  ClipboardList,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import { getTasks, type Task, type TaskStatus } from '@/lib/actions/taskActions';
import { getUsers, type User } from '@/lib/actions/userActions';
import { getDepartmentById, type Department } from '@/lib/actions/departmentActions';

// ========== TYPE DEFINITIONS ==========
interface DepartmentTask {
  id: string;
  title: string;
  assignedEmployee: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  progress: number;
}

interface DepartmentRequest {
  id: string;
  employee: string;
  type: string;
  details: string;
  status: 'approved' | 'pending' | 'rejected';
  date: string;
}

// ========== MAIN COMPONENT ==========
const HODDashboardPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [department, setDepartment] = useState<Department | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // HOD user info - In production, this would come from auth context
  const hodUserId = 1; // Placeholder - should come from auth
  const hodName = 'Dr. Sarah Taylor';
  const hodInitials = 'ST';
  const departmentName = 'IT Architecture';

  // ===== LOAD DATA =====
  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all tasks
      const taskResult = await getTasks();
      if (taskResult.success && taskResult.data) {
        setTasks(taskResult.data);
      }

      // Fetch all users
      const userResult = await getUsers();
      if (userResult.success && userResult.data) {
        setUsers(userResult.data);
      }

      // Fetch HOD's department (assuming HOD has departmentId)
      // In production, get departmentId from HOD's user record
      const deptResult = await getDepartmentById(1); // Placeholder
      if (deptResult.success && deptResult.data) {
        setDepartment(deptResult.data);
      }
    } catch (err) {
      setError('Failed to load dashboard data');
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // ===== DERIVED STATE =====
  // Get users in HOD's department
  const departmentUsers = users.filter(u => u.departmentId === department?.id);
  const totalEmployees = departmentUsers.length;

  // Get tasks assigned to users in HOD's department
  const departmentUserIds = departmentUsers.map(u => u.id).filter((id): id is number => id !== undefined);
  const departmentTasks = tasks.filter(t => t.userId && departmentUserIds.includes(t.userId));

  // Task statistics
  const pendingTasks = departmentTasks.filter(t => t.status !== 'Terminer').length;
  const completedTasks = departmentTasks.filter(t => t.status === 'Terminer').length;

  // Tasks due this week
  const tasksDueThisWeek = departmentTasks.filter(task => {
    if (!task.Date_limite) return false;
    const dueDate = new Date(task.Date_limite);
    const today = new Date();
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    return dueDate >= today && dueDate <= weekFromNow && task.status !== 'Terminer';
  }).length;

  // Map tasks to DepartmentTask format
  const mappedTasks: DepartmentTask[] = departmentTasks.map(task => {
    const assignedUser = users.find(u => u.id === task.userId);
    const priorityMap: Record<string, 'low' | 'medium' | 'high'> = {
      'Bas': 'low',
      'Moyen': 'medium',
      'Elevee': 'high',
    };

    // Calculate progress based on status
    let progress = 0;
    if (task.status === 'A_faire') progress = 0;
    else if (task.status === 'En_cours') progress = 50;
    else if (task.status === 'Terminer') progress = 100;

    return {
      id: task.id?.toString() || '',
      title: task.titre || '',
      assignedEmployee: assignedUser?.nom || 'Unassigned',
      dueDate: task.Date_limite || '',
      priority: priorityMap[task.priorite || 'Moyen'] || 'medium',
      progress: progress,
    };
  });

  // Map requests (using mock data for now - this would come from a request API)
  const departmentRequests: DepartmentRequest[] = [
    {
      id: '1',
      employee: 'John Doe',
      type: 'Leave Request',
      details: 'Annual leave - 5 days',
      status: 'pending',
      date: new Date().toISOString(),
    },
    {
      id: '2',
      employee: 'Alice Smith',
      type: 'Expense Claim',
      details: 'Travel reimbursement - $350',
      status: 'approved',
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ];

  // ========== HANDLERS ==========
  const handleNewTask = () => {
    // In production, this would open a create task modal
    alert('New Task modal would open here');
  };

  // ========== HELPER FUNCTIONS ==========
  const getPriorityBadge = (priority: DepartmentTask['priority']) => {
    const config = {
      high: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: <AlertTriangle size={14} className="mr-1" />,
        label: 'High',
      },
      medium: {
        bg: 'bg-amber-100',
        text: 'text-amber-800',
        icon: <Clock size={14} className="mr-1" />,
        label: 'Medium',
      },
      low: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: <CheckCircle size={14} className="mr-1" />,
        label: 'Low',
      },
    };
    return config[priority];
  };

  const getStatusBadge = (status: DepartmentRequest['status']) => {
    const config = {
      approved: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: <CheckCircle size={14} className="mr-1" />,
        label: 'Approved',
      },
      pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: <Clock size={14} className="mr-1" />,
        label: 'Pending',
      },
      rejected: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: <AlertCircle size={14} className="mr-1" />,
        label: 'Rejected',
      },
    };
    return config[status];
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'bg-green-500';
    if (progress >= 70) return 'bg-blue-500';
    if (progress >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  // ===== LOADING STATE =====
  if (isLoading) {
    return (
      <HODLayout
        pageTitle="Department Dashboard Overview"
        pageSubtitle="Loading..."
        departmentName={departmentName}
        hodName={hodName}
        hodInitials={hodInitials}
        showCreateButton={false}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#263A81] mx-auto mb-4"></div>
            <p className="text-[#6B7280]">Loading dashboard...</p>
          </div>
        </div>
      </HODLayout>
    );
  }

  // ===== ERROR STATE =====
  if (error) {
    return (
      <HODLayout
        pageTitle="Department Dashboard Overview"
        pageSubtitle="Error loading data"
        departmentName={departmentName}
        hodName={hodName}
        hodInitials={hodInitials}
        showCreateButton={false}
      >
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <AlertCircle size={64} className="text-red-500 opacity-50 mb-4" />
          <h3 className="text-xl font-semibold text-[#1F2937] mb-2">Error Loading Dashboard</h3>
          <p className="text-[#6B7280]">{error}</p>
        </div>
      </HODLayout>
    );
  }

  // ========== RENDER ==========
  return (
    <HODLayout
      pageTitle="Department Dashboard Overview"
      pageSubtitle=""
      departmentName={departmentName}
      hodName={hodName}
      hodInitials={hodInitials}
      showCreateButton={true}
      onCreateClick={handleNewTask}
      createButtonText="New Task"
    >
      {/* KPI Scorecards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-[#6B7280]">Total Department Employees</div>
              <div className="text-3xl font-bold text-[#1F2937] mt-2">{totalEmployees}</div>
            </div>
            <div className="p-3 bg-[#263A81]/10 rounded-lg">
              <UsersIcon size={28} className="text-[#263A81]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-[#6B7280]">Active Tasks Array</div>
              <div className="text-3xl font-bold text-[#1F2937] mt-2">
                <span className="text-amber-600">{pendingTasks}</span>
                <span className="text-[#6B7280] text-base font-normal mx-1">/</span>
                <span className="text-green-600">{completedTasks}</span>
              </div>
              <div className="text-xs text-[#6B7280] mt-1">Pending / Completed</div>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <ClipboardList size={28} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-[#6B7280]">Critical Deadlines</div>
              <div className="text-3xl font-bold text-[#1F2937] mt-2">{tasksDueThisWeek}</div>
              <div className="text-xs text-[#6B7280] mt-1">Tasks due this week</div>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <Calendar size={28} className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Active Tracking Matrix Table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm mb-8 overflow-hidden">
        <div className="p-6 border-b border-[#E5E7EB]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#1F2937]">Active Department Tasks</h2>
              <p className="text-sm text-[#6B7280] mt-1">Tracking progress across all team members</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-gray-50/70">
                <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold tracking-wide">Task Title</th>
                <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold tracking-wide">Assigned Employee</th>
                <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold tracking-wide">Due Date</th>
                <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold tracking-wide">Priority</th>
                <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold tracking-wide">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {mappedTasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#6B7280]">
                    <div className="flex flex-col items-center gap-2">
                      <ClipboardList size={48} className="text-[#6B7280] opacity-30" />
                      <p className="font-medium">No tasks found</p>
                      <p className="text-sm">No active tasks in your department</p>
                    </div>
                  </td>
                </tr>
              ) : (
                mappedTasks.map((task) => {
                  const priorityConfig = getPriorityBadge(task.priority);
                  const progressColor = getProgressColor(task.progress);
                  return (
                    <tr key={task.id} className="hover:bg-gray-50/50 transition duration-150">
                      <td className="py-3.5 px-6 text-[#1F2937] font-medium">{task.title}</td>
                      <td className="py-3.5 px-6 text-[#6B7280]">{task.assignedEmployee}</td>
                      <td className="py-3.5 px-6 text-[#6B7280]">{formatDate(task.dueDate)}</td>
                      <td className="py-3.5 px-6">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${priorityConfig.bg} ${priorityConfig.text}`}
                        >
                          {priorityConfig.icon}
                          {priorityConfig.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden min-w-[60px]">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-[#1F2937] min-w-[36px]">
                            {task.progress}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Action Request Log */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm">
        <div className="p-6 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-3">
            <TrendingUp size={20} className="text-[#263A81]" />
            <h2 className="text-xl font-bold text-[#1F2937]">Recent Department Requests</h2>
          </div>
          <p className="text-sm text-[#6B7280] mt-1">Pending approvals and recent activity</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {departmentRequests.length === 0 ? (
              <div className="col-span-full text-center py-8 text-[#6B7280]">
                <p>No pending requests</p>
              </div>
            ) : (
              departmentRequests.map((request) => {
                const statusConfig = getStatusBadge(request.status);
                return (
                  <div
                    key={request.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#FEFEFC] border border-[#E5E7EB] rounded-lg hover:border-[#263A81]/20 transition-colors gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-[#1F2937]">{request.employee}</span>
                        <span className="text-[#6B7280] text-sm">-</span>
                        <span className="text-sm text-[#6B7280]">{request.type}</span>
                      </div>
                      <div className="text-sm text-[#6B7280] truncate mt-0.5">{request.details}</div>
                      <div className="text-xs text-[#6B7280] mt-1">{formatDate(request.date)}</div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide whitespace-nowrap ${statusConfig.bg} ${statusConfig.text}`}
                    >
                      {statusConfig.icon}
                      {statusConfig.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </HODLayout>
  );
};

export default HODDashboardPage;