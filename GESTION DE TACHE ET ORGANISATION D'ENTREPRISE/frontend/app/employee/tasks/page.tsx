'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { EmployeeLayout } from '@/app/layout/employeeLayout';
import {
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
import { getProfile, type User } from '@/lib/actions/userActions';

// ========== TYPES ==========
type FilterType = 'all' | 'pending' | 'completed';

// ========== HELPERS ==========
function getTaskAssigneeIds(task: any): number[] {
  if (Array.isArray(task.assigneeIds)) {
    return task.assigneeIds.map(Number).filter(Number.isFinite);
  }
  if (task.userId != null) return [Number(task.userId)];
  if (task.assignedTo != null) return [Number(task.assignedTo)];
  if (task.user?.id != null) return [Number(task.user.id)];
  return [];
}

function getTaskDueDate(task: any): string | null {
  return (
    task.Date_limite ??
    task.date_limite ??
    task.dateLimite ??
    task.dueDate ??
    null
  );
}

// ========== MAIN COMPONENT ==========
export default function EmployeeTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // ===== LOAD DATA =====
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Profil de l'utilisateur connecté
      const userResult = await getProfile();

      if (!userResult.success || !userResult.data) {
        throw new Error(
          userResult.message || 'Impossible de récupérer votre profil.',
        );
      }

      const profileResponse = userResult.data as User & { data?: User };
      const currentUser = profileResponse.data ?? profileResponse;

      if (currentUser.id == null) {
        throw new Error(
          "L'identifiant de l'utilisateur connecté est absent du profil.",
        );
      }

      setUser(currentUser);

      const currentUserId = Number(currentUser.id);

      // 2. Tâches
      const taskResult = await getTasks();

      console.log('Profil connecté :', currentUser);
      console.log('Tâches récupérées :', taskResult);

      if (!taskResult.success) {
        throw new Error(
          taskResult.message || 'Impossible de récupérer vos tâches.',
        );
      }

      if (!Array.isArray(taskResult.data)) {
        throw new Error('Le backend a retourné une liste de tâches invalide.');
      }

      // Filtre : uniquement les tâches assignées à l'employé connecté
      const myTasks = (taskResult.data as any[]).filter((task) => {
        const assigneeIds = getTaskAssigneeIds(task);
        return assigneeIds.includes(currentUserId);
      });

      console.log('Mes tâches filtrées :', myTasks);
      setTasks(myTasks as Task[]);
    } catch (err) {
      console.error('Erreur de chargement :', err);
      setTasks([]);
      setError(
        err instanceof Error
          ? err.message
          : 'Une erreur est survenue lors du chargement.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ← IMPORTANT : lance le chargement
  useEffect(() => {
    void loadData();
  }, [loadData]);

  // ===== DERIVED STATE =====
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    if (filter === 'pending') {
      filtered = filtered.filter((task) => task.status !== 'Terminer');
    } else if (filter === 'completed') {
      filtered = filtered.filter((task) => task.status === 'Terminer');
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (task) =>
          (task.title || '').toLowerCase().includes(query) ||
          (task.description || '').toLowerCase().includes(query),
      );
    }

    return filtered;
  }, [tasks, filter, searchQuery]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.status === 'Terminer').length;
    const pending = tasks.filter((task) => task.status !== 'Terminer').length;
    return { total, completed, pending };
  }, [tasks]);

  // ===== EVENT HANDLERS =====
  const toggleTaskStatus = async (
    taskId: number,
    currentStatus: TaskStatus,
  ) => {
    setIsSubmitting(true);
    setError(null);

    const newStatus: TaskStatus =
      currentStatus === 'Terminer' ? 'A_faire' : 'Terminer';

    const result = await updateTaskStatus(taskId, newStatus);

    if (result.success) {
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, status: newStatus } : task,
        ),
      );
      setSuccessMessage(
        `Task ${newStatus === 'Terminer' ? 'completed' : 'reopened'} successfully!`,
      );
      setTimeout(() => setSuccessMessage(null), 3000);
    } else {
      setError(result.message || 'Failed to update task status');
    }

    setIsSubmitting(false);
  };

  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
  };

  // ===== HELPERS UI =====
  const getPriorityConfig = (priority: TaskPriority | undefined) => {
    const config: Record<
      string,
      { bg: string; text: string; icon: React.ReactNode; label: string }
    > = {
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
    return config[priority || 'Moyen'] || config.Moyen;
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
      A_faire: 'Pending',
      En_cours: 'In Progress',
      Terminer: 'Completed',
    };
    return map[status || 'A_faire'] || 'Pending';
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'No date';

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isOverdue = (dateString?: string | null) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const getFilterButtonClasses = (filterType: FilterType) => {
    const base =
      'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200';
    const active =
      'bg-[#263A81] text-white shadow-lg shadow-[#263A81]/20';
    const inactive =
      'bg-white text-[#1F2937] border border-[#E5E7EB] hover:bg-gray-50';
    return `${base} ${filter === filterType ? active : inactive}`;
  };

  // ===== INFOS AFFICHAGE =====
const employeeName =
  (user as any)?.nom ||
  (user as any)?.name ||
  'Employee';

const employeeInitials = employeeName
  .trim()
  .split(/\s+/)
  .slice(0, 2)
  .map((p: string) => p[0]?.toUpperCase() ?? '')
  .join('');

  // ===== LOADING =====
  if (isLoading) {
    return (
      <EmployeeLayout
        pageTitle="My Tasks"
        pageSubtitle="Loading your tasks..."
        employeeName={employeeName}
        employeeInitials={employeeInitials}
        employeeRole="Employee"
      >
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[#263A81]" />
            <p className="text-[#6B7280]">Loading tasks...</p>
          </div>
        </div>
      </EmployeeLayout>
    );
  }

  // ===== ERROR (aucune tâche) =====
  if (error && tasks.length === 0) {
    return (
      <EmployeeLayout
        pageTitle="My Tasks"
        pageSubtitle="Error loading tasks"
        employeeName={employeeName}
        employeeInitials={employeeInitials}
        employeeRole="Employee"
      >
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <div className="text-center text-red-500">
            <p className="text-lg font-medium">Error Loading Tasks</p>
            <p className="mt-1 text-sm">{error}</p>
            <button
              type="button"
              onClick={() => void loadData()}
              className="mt-4 rounded-lg bg-[#263A81] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e2f6a]"
            >
              Réessayer
            </button>
          </div>
        </div>
      </EmployeeLayout>
    );
  }

  // ===== RENDER =====
  return (
    <EmployeeLayout
      pageTitle="My Tasks"
      pageSubtitle="Manage and track your assigned tasks efficiently."
      employeeName={employeeName}
      employeeInitials={employeeInitials}
      employeeRole={
        user?.role === 'HOD'
          ? 'Head of Department'
          : user?.role === 'ADMIN'
            ? 'Administrator'
            : 'Employee'
      }
    >
      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
          <CheckCircle size={20} className="text-green-600" />
          <span className="font-medium text-green-800">{successMessage}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle size={20} className="text-red-600" />
          <span className="font-medium text-red-800">{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-[#6B7280]">Total Tasks</div>
              <div className="mt-1 text-2xl font-bold text-[#1F2937]">
                {stats.total}
              </div>
            </div>
            <div className="rounded-lg bg-[#263A81]/10 p-3">
              <ListChecks size={24} className="text-[#263A81]" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-[#6B7280]">Pending</div>
              <div className="mt-1 text-2xl font-bold text-[#1F2937]">
                {stats.pending}
              </div>
            </div>
            <div className="rounded-lg bg-amber-100 p-3">
              <Clock size={24} className="text-amber-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-[#6B7280]">Completed</div>
              <div className="mt-1 text-2xl font-bold text-[#1F2937]">
                {stats.completed}
              </div>
            </div>
            <div className="rounded-lg bg-green-100 p-3">
              <CheckCircle size={24} className="text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="mb-6 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleFilterChange('all')}
              className={getFilterButtonClasses('all')}
            >
              All Tasks
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange('pending')}
              className={getFilterButtonClasses('pending')}
            >
              Pending
            </button>
            <button
              type="button"
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
              className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-white px-4 pr-10 text-[#1F2937] placeholder:text-[#6B7280] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#263A81] md:w-64"
            />
            <Filter
              size={18}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280]"
            />
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <CheckSquare size={48} className="text-[#6B7280] opacity-30" />
              <p className="font-medium text-[#1F2937]">No tasks found</p>
              <p className="text-sm text-[#6B7280]">
                {searchQuery
                  ? 'Try adjusting your search or filters'
                  : 'All tasks are completed or none match the current filter'}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E7EB]">
            {filteredTasks.map((task) => {
              const priorityConfig = getPriorityConfig(
                (task as any).priorite || (task as any).priority,
              );
              const dueDate = getTaskDueDate(task);
              const isTaskOverdue =
                task.status !== 'Terminer' && isOverdue(dueDate);
              const isCompleted = task.status === 'Terminer';

              return (
                <div
                  key={task.id}
                  className={`p-4 transition group hover:bg-gray-50 ${
                    isCompleted ? 'opacity-75' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() =>
                        toggleTaskStatus(
                          Number(task.id),
                          (task.status as TaskStatus) || 'A_faire',
                        )
                      }
                      className="mt-1 flex-shrink-0 transition-transform hover:scale-110"
                      disabled={isSubmitting}
                      aria-label={`Mark "${task.title}" as ${
                        isCompleted ? 'pending' : 'completed'
                      }`}
                    >
                      {getStatusIcon(task.status as TaskStatus)}
                    </button>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3
                            className={`text-base font-medium ${
                              isCompleted
                                ? 'text-[#6B7280] line-through'
                                : 'text-[#1F2937]'
                            }`}
                          >
                            {task.title}
                          </h3>
                          <p
                            className={`mt-1 text-sm ${
                              isCompleted
                                ? 'text-[#6B7280] line-through'
                                : 'text-[#6B7280]'
                            }`}
                          >
                            {task.description || 'No description'}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-3">
                            <span className="flex items-center gap-1 text-xs text-[#6B7280]">
                              <Tag size={12} />
                              {getStatusLabel(task.status as TaskStatus)}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-[#6B7280]">
                              <UserIcon size={12} />
                              {user?.nom || 'You'}
                            </span>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${priorityConfig.bg} ${priorityConfig.text}`}
                            >
                              {priorityConfig.icon}
                              {priorityConfig.label}
                            </span>
                            {isTaskOverdue && (
                              <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                                <AlertCircle size={12} className="mr-1" />
                                Overdue
                              </span>
                            )}
                            {isCompleted && (
                              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                                <CheckCircle size={12} className="mr-1" />
                                Done
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 whitespace-nowrap text-sm text-[#6B7280]">
                          <Calendar size={14} />
                          <span
                            className={
                              isTaskOverdue ? 'font-medium text-red-600' : ''
                            }
                          >
                            {formatDate(dueDate)}
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

      {/* Footer */}
      <div className="mt-4 text-center text-xs text-[#6B7280]">
        {filteredTasks.length} task
        {filteredTasks.length !== 1 ? 's' : ''} displayed
      </div>
    </EmployeeLayout>
  );
}