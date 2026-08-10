// app/employee/tasks/page.tsx

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { EmployeeLayout } from '@/app/layout/employeeLayout';
import {
  Plus,
  CheckSquare,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Circle,
  Filter,
  ListChecks,
  Tag,
  User as UserIcon,
} from 'lucide-react';
import {
  getTasks,
  updateTaskStatus,
  type Task,
  type TaskStatus,
  type TaskPriority,
} from '@/lib/actions/taskActions';
import { getUserById, type User } from '@/lib/actions/userActions';

// ========== TYPE DEFINITIONS ==========
type FilterType = 'all' | 'pending' | 'completed';

// ========== MAIN COMPONENT ==========
const EmployeeTasksPage: React.FC = () => {
  // ===== EMPLOYEE INFO =====
  // In production, this would come from auth context
  const employeeId = 2; // Placeholder - John Doe
  const employeeName = 'John Doe';
  const employeeInitials = 'JD';
  const employeeRole = 'Software Engineer';

  // ===== STATE MANAGEMENT =====
  const [tasks, setTasks] = useState<Task[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // ===== LOAD DATA =====
  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch user data
      const userResult = await getUserById(employeeId);
      if (userResult.success && userResult.data) {
        setUser(userResult.data);
      }

      // Fetch tasks assigned to this employee
      const taskResult = await getTasks();
      if (taskResult.success && taskResult.data) {
        const userTasks = taskResult.data.filter(t => t.userId === employeeId);
        setTasks(userTasks);
      }
    } catch (err) {
      setError('Failed to load tasks');
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // ===== DERIVED STATE =====
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Apply status filter
    if (filter === 'pending') {
      filtered = filtered.filter(task => task.status !== 'Terminer');
    } else if (filter === 'completed') {
      filtered = filtered.filter(task => task.status === 'Terminer');
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(task =>
        (task.titre || '').toLowerCase().includes(query) ||
        (task.description || '').toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [tasks, filter, searchQuery]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(task => task.status === 'Terminer').length;
    const pending = tasks.filter(task => task.status !== 'Terminer').length;
    return { total, completed, pending };
  }, [tasks]);

  // ===== EVENT HANDLERS =====
  const toggleTaskStatus = async (taskId: number, currentStatus: TaskStatus) => {
    setIsSubmitting(true);
    setError(null);

    const newStatus: TaskStatus = currentStatus === 'Terminer' ? 'A_faire' : 'Terminer';

    const result = await updateTaskStatus(taskId, newStatus);
    if (result.success) {
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );
      setSuccessMessage(`Task ${newStatus === 'Terminer' ? 'completed' : 'reopened'} successfully!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } else {
      setError(result.message || 'Failed to update task status');
    }
    setIsSubmitting(false);
  };

  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
  };

  const handleNewTask = () => {
    alert('New Task modal would open here');
  };

  // ===== HELPER FUNCTIONS =====
  const getPriorityConfig = (priority: TaskPriority | undefined) => {
    const config = {
      Elevee: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: <AlertCircle size={14} className="mr-1" />,
        label: 'High',
      },
      Moyen: {
        bg: 'bg-amber-100',
        text: 'text-amber-800',
        icon: <Clock size={14} className="mr-1" />,
        label: 'Medium',
      },
      Bas: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: <CheckCircle size={14} className="mr-1" />,
        label: 'Low',
      },
    };
    return config[priority || 'Moyen'];
  };

  const getStatusIcon = (status: TaskStatus | undefined) => {
    return status === 'Terminer' ? (
      <CheckCircle size={20} className="text-green-600" />
    ) : (
      <Circle size={20} className="text-[#6B7280]" />
    );
  };

  const getStatusLabel = (status: TaskStatus | undefined) => {
    const map: Record<string, string> = {
      'A_faire': 'Pending',
      'En_cours': 'In Progress',
      'Terminer': 'Completed',
    };
    return map[status || 'A_faire'] || 'Pending';
  };

  const formatDate = (dateString?: string) => {
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

  const isOverdue = (dateString?: string) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const getFilterButtonClasses = (filterType: FilterType) => {
    const baseClasses =
      'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200';
    const activeClasses = 'bg-[#263A81] text-white shadow-lg shadow-[#263A81]/20';
    const inactiveClasses = 'bg-white text-[#1F2937] border border-[#E5E7EB] hover:bg-gray-50';
    return `${baseClasses} ${filter === filterType ? activeClasses : inactiveClasses}`;
  };

  // ===== LOADING STATE =====
  if (isLoading) {
    return (
      <EmployeeLayout
        pageTitle="My Tasks"
        pageSubtitle="Loading your tasks..."
        employeeName={employeeName}
        employeeInitials={employeeInitials}
        employeeRole={employeeRole}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#263A81] mx-auto mb-4"></div>
            <p className="text-[#6B7280]">Loading tasks...</p>
          </div>
        </div>
      </EmployeeLayout>
    );
  }

  // ===== ERROR STATE =====
  if (error && tasks.length === 0) {
    return (
      <EmployeeLayout
        pageTitle="My Tasks"
        pageSubtitle="Error loading tasks"
        employeeName={employeeName}
        employeeInitials={employeeInitials}
        employeeRole={employeeRole}
      >
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="text-red-500 text-center">
            <p className="text-lg font-medium">Error Loading Tasks</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </EmployeeLayout>
    );
  }

  // ========== RENDER ==========
  return (
    <EmployeeLayout
      pageTitle="My Tasks"
      pageSubtitle="Manage and track your assigned tasks efficiently."
      employeeName={user?.nom || employeeName}
      employeeInitials={employeeInitials}
      employeeRole={user?.role === 'HOD' ? 'Head of Department' : 
                    user?.role === 'ADMIN' ? 'Administrator' : 
                    'Employee'}
    >
      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 animate-fade-in">
          <CheckCircle size={20} className="text-green-600" />
          <span className="text-green-800 font-medium">{successMessage}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 animate-fade-in">
          <AlertCircle size={20} className="text-red-600" />
          <span className="text-red-800 font-medium">{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-[#6B7280]">Total Tasks</div>
              <div className="text-2xl font-bold text-[#1F2937] mt-1">{stats.total}</div>
            </div>
            <div className="p-3 bg-[#263A81]/10 rounded-lg">
              <ListChecks size={24} className="text-[#263A81]" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-[#6B7280]">Pending</div>
              <div className="text-2xl font-bold text-[#1F2937] mt-1">{stats.pending}</div>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <Clock size={24} className="text-amber-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-[#6B7280]">Completed</div>
              <div className="text-2xl font-bold text-[#1F2937] mt-1">{stats.completed}</div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle size={24} className="text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleFilterChange('all')}
              className={getFilterButtonClasses('all')}
            >
              All Tasks
            </button>
            <button
              onClick={() => handleFilterChange('pending')}
              className={getFilterButtonClasses('pending')}
            >
              Pending
            </button>
            <button
              onClick={() => handleFilterChange('completed')}
              className={getFilterButtonClasses('completed')}
            >
              Completed
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 h-10 px-4 pr-10 rounded-lg border border-[#E5E7EB] bg-white text-[#1F2937] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition"
            />
            <Filter size={18} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6B7280]" />
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <CheckSquare size={48} className="text-[#6B7280] opacity-30" />
              <p className="text-[#1F2937] font-medium">No tasks found</p>
              <p className="text-[#6B7280] text-sm">
                {searchQuery
                  ? 'Try adjusting your search or filters'
                  : 'All tasks are completed or none match the current filter'}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E7EB]">
            {filteredTasks.map((task) => {
              const priorityConfig = getPriorityConfig(task.priorite);
              const isTaskOverdue = task.status !== 'Terminer' && isOverdue(task.Date_limite);
              const isCompleted = task.status === 'Terminer';

              return (
                <div
                  key={task.id}
                  className={`p-4 hover:bg-gray-50 transition group ${
                    isCompleted ? 'opacity-75' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleTaskStatus(task.id!, task.status || 'A_faire')}
                      className="mt-1 flex-shrink-0 hover:scale-110 transition-transform"
                      disabled={isSubmitting}
                      aria-label={`Mark "${task.titre}" as ${
                        isCompleted ? 'pending' : 'completed'
                      }`}
                    >
                      {getStatusIcon(task.status)}
                    </button>

                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div>
                          <h3
                            className={`text-base font-medium ${
                              isCompleted
                                ? 'text-[#6B7280] line-through'
                                : 'text-[#1F2937]'
                            }`}
                          >
                            {task.titre}
                          </h3>
                          <p
                            className={`text-sm mt-1 ${
                              isCompleted
                                ? 'text-[#6B7280] line-through'
                                : 'text-[#6B7280]'
                            }`}
                          >
                            {task.description || 'No description'}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            <span className="text-xs text-[#6B7280] flex items-center gap-1">
                              <Tag size={12} />
                              {getStatusLabel(task.status)}
                            </span>
                            <span className="text-xs text-[#6B7280] flex items-center gap-1">
                              <UserIcon size={12} />
                              {user?.nom || 'You'}
                            </span>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${priorityConfig.bg} ${priorityConfig.text}`}
                            >
                              {priorityConfig.icon}
                              {priorityConfig.label}
                            </span>
                            {isTaskOverdue && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <AlertCircle size={12} className="mr-1" />
                                Overdue
                              </span>
                            )}
                            {isCompleted && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle size={12} className="mr-1" />
                                Done
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#6B7280] whitespace-nowrap">
                          <Calendar size={14} />
                          <span className={isTaskOverdue ? 'text-red-600 font-medium' : ''}>
                            {formatDate(task.Date_limite)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer note */}
      <div className="mt-4 text-center text-xs text-[#6B7280]">
        {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} displayed
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </EmployeeLayout>
  );
};

export default EmployeeTasksPage;