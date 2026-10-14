// app/hod/task-manager/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { HODLayout } from '@/app/layout/HodLayout';
import {
  CheckSquare,
  Plus,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  User as UserIcon,
  AlertTriangle,
  X,
} from 'lucide-react';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  getDepartmentUsers,
  type Task,
  type TaskStatus,
  type TaskPriority,
} from '@/lib/actions/taskActions';
import { getProfile, type User } from '@/lib/actions/userActions';
import { getDepartmentById } from '@/lib/actions/departmentActions';

// ========== TYPE DEFINITIONS ==========
interface TaskFormData {
  title: string;
  description: string;
  Date_limite: string;
  priorite: TaskPriority;
  userId: string;
}

// Le profil renvoyé par le backend peut avoir plusieurs formes.
type ProfileShape = {
  nom?: string;
  name?: string;
  departementId?: number | string | null;
  departmentId?: number | string | null;
  departement?: {
    id?: number | string | null;
    nom_departement?: string;
  } | null;
};

// Convertit une date (ISO ou autre) en "YYYY-MM-DD" pour <input type="date">.
const toDateInputValue = (value?: string | Date | null): string => {
  if (!value) return '';
  return String(value).slice(0, 10);
};

// ========== MAIN COMPONENT ==========
const HODTaskManagerPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [departmentUsers, setDepartmentUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    Date_limite: '',
    priorite: 'Moyen',
    userId: '',
  });

  // Infos du HOD (chargées depuis le profil réel)
  const [hodName, setHodName] = useState<string>('Responsable de département');
  const [departmentName, setDepartmentName] = useState<string>('Mon département');

  const hodInitials = hodName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  // ========== LOAD PROFILE ==========
  const loadProfile = async () => {
    try {
      const profileResult = await getProfile();

      if (!profileResult.success || !profileResult.data) {
        console.error('Profil non chargé :', profileResult);
        return;
      }

      const raw = profileResult.data as ProfileShape & {
        user?: ProfileShape;
        data?: ProfileShape & { user?: ProfileShape };
      };

      const profile: ProfileShape =
        raw.data?.user ?? raw.user ?? raw.data ?? raw;

      setHodName(profile.nom || profile.name || 'Responsable de département');

      // Nom du département : directement dans le profil, sinon via l'API.
      if (profile.departement?.nom_departement) {
        setDepartmentName(profile.departement.nom_departement);
        return;
      }

      const rawDepartmentId =
        profile.departementId ??
        profile.departmentId ??
        profile.departement?.id;

      const departmentId = Number(rawDepartmentId);

      if (rawDepartmentId != null && Number.isFinite(departmentId)) {
        const departmentResult = await getDepartmentById(departmentId);

        if (departmentResult.success && departmentResult.data) {
          setDepartmentName(
            departmentResult.data.nom_departement || 'Mon département',
          );
        }
      }
    } catch (err) {
      console.error('Erreur chargement du profil :', err);
    }
  };

  // ========== LOAD DATA ==========
  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Charger les tâches (l'échec est désormais visible à l'écran)
      const taskResult = await getTasks();

      console.log('Résultat getTasks complet :', taskResult);

      if (taskResult.success && Array.isArray(taskResult.data)) {
        setTasks(taskResult.data);
      } else {
        setTasks([]);
        setError(
          taskResult.message ||
          taskResult.error ||
         'Impossible de charger les tâches.',
       );
     }

      // 2. Charger les membres du département
      const usersResult = await getDepartmentUsers();
      console.log('Membres de Département :', usersResult);

      if (usersResult.success && Array.isArray(usersResult.data)) {
        setDepartmentUsers(usersResult.data);
      } else {
        setDepartmentUsers([]);
      }
    } catch (err) {
      setError('Failed to load task data');
      console.error(err);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    void loadProfile();
    void loadData();
  }, []);

  // ===== HELPER FUNCTIONS =====
  const getPriorityBadge = (priority: TaskPriority) => {
    const config = {
      Elevee: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: <AlertTriangle size={14} className="mr-1" />,
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
    return config[priority] || config.Moyen;
  };

  const getStatusBadge = (status: TaskStatus) => {
    const config = {
      A_faire: {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        icon: <AlertCircle size={14} className="mr-1" />,
        label: 'Not Started',
      },
      En_cours: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        icon: <Clock size={14} className="mr-1" />,
        label: 'In Progress',
      },
      Terminer: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: <CheckCircle size={14} className="mr-1" />,
        label: 'Completed',
      },
    };
    return config[status] || config.A_faire;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date';

    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return 'No date';

    return parsed.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // ========== MODAL HANDLERS ==========
  const openCreateModal = () => {
    setFormData({
      title: '',
      description: '',
      Date_limite: '',
      priorite: 'Moyen',
      userId: '',
    });
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => setIsCreateModalOpen(false);

  const openEditModal = (task: Task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title || '',
      description: task.description || '',
      // <input type="date"> exige le format YYYY-MM-DD
      Date_limite: toDateInputValue(task.Date_limite),
      priorite: task.priorite || 'Moyen',
      userId: task.userId?.toString() || '',
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedTask(null);
  };

  const openDeleteModal = (taskId: string) => {
    setTaskToDelete(taskId);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setTaskToDelete(null);
  };

  // ========== CRUD OPERATIONS ==========
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const result = await createTask({
      title: formData.title,
      description: formData.description,
      Date_limite: formData.Date_limite,
      priorite: formData.priorite,
      userId: parseInt(formData.userId),
      status: 'A_faire',
    });

    console.log('Résultat création :', result);

    if (result.success && result.data) {
      showSuccess(`Task "${result.data.title}" created successfully!`);
      closeCreateModal();
      void loadData();
    } else {
      setError(result.message || 'Failed to create task');
    }
    setIsSubmitting(false);
  };

  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    setIsSubmitting(true);
    setError(null);

    const result = await updateTask(selectedTask.id!, {
      title: formData.title,
      description: formData.description,
      Date_limite: formData.Date_limite,
      priorite: formData.priorite,
      userId: parseInt(formData.userId),
    });

    if (result.success && result.data) {
      showSuccess(`Task "${result.data.title}" updated successfully!`);
      closeEditModal();
      void loadData();
    } else {
      setError(result.message || 'Failed to update task');
    }
    setIsSubmitting(false);
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    setIsSubmitting(true);
    setError(null);

    const result = await deleteTask(parseInt(taskToDelete));
    if (result.success) {
      showSuccess('Task deleted successfully!');
      closeDeleteModal();
      void loadData();
    } else {
      setError(result.message || 'Failed to delete task');
    }
    setIsSubmitting(false);
  };

  const handleStatusChange = async (taskId: number, newStatus: TaskStatus) => {
    const result = await updateTaskStatus(taskId, newStatus);
    if (result.success) {
      showSuccess(`Task status updated to ${getStatusBadge(newStatus).label}`);
      void loadData();
    } else {
      setError(result.message || 'Failed to update task status');
    }
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ===== LOADING STATE =====
  if (isLoading) {
    return (
      <HODLayout
        pageTitle="Task Lifecycle & Assignment Management"
        pageSubtitle="Create, assign, and track department tasks through completion"
        departmentName={departmentName}
        hodName={hodName}
        hodInitials={hodInitials}
        showCreateButton={false}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#263A81] mx-auto mb-4"></div>
            <p className="text-[#6B7280]">Loading tasks...</p>
          </div>
        </div>
      </HODLayout>
    );
  }

  // ========== RENDER ==========
  return (
    <HODLayout
      pageTitle="Task Lifecycle & Assignment Management"
      pageSubtitle="Create, assign, and track department tasks through completion"
      departmentName={departmentName}
      hodName={hodName}
      hodInitials={hodInitials}
      showCreateButton={true}
      onCreateClick={openCreateModal}
      createButtonText="Create Task"
    >
      {/* Success Banner */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle size={20} className="text-green-600" />
          <span className="text-green-800 font-medium">{successMessage}</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-red-600" />
            <span className="text-red-800 font-medium">{error}</span>
          </div>
          <button
            type="button"
            onClick={() => void loadData()}
            className="shrink-0 rounded-lg bg-[#263A81] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#1e2f6a]"
          >
            Retry
          </button>
        </div>
      )}

      {/* Task Inventory Table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-gray-50/70">
                <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold">Task Title</th>
                <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold">Assigned Personnel</th>
                <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold">Due Date</th>
                <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold">Priority</th>
                <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold">Status</th>
                <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#6B7280]">
                    <div className="flex flex-col items-center gap-2">
                      <CheckSquare size={48} className="text-[#6B7280] opacity-30" />
                      <p className="font-medium">No tasks found</p>
                      <p className="text-sm">Create a new task to get started</p>
                    </div>
                  </td>
                </tr>
              ) : (
                tasks.map((task) => {
                  const priorityConfig = getPriorityBadge(task.priorite || 'Moyen');
                  const statusConfig = getStatusBadge(task.status || 'A_faire');
                  const assignedUser = departmentUsers.find(
                    (u) => Number(u.id) === Number(task.userId),
                  );

                  return (
                    <tr key={task.id} className="hover:bg-gray-50/50 transition">
                      <td className="py-3.5 px-6">
                        <div>
                          <div className="text-[#1F2937] font-medium">{task.title}</div>
                          <div className="text-xs text-[#6B7280] mt-0.5 truncate max-w-[200px]">
                            {task.description}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-[#6B7280]">
                        <div className="flex items-center gap-1.5">
                          <UserIcon size={14} />
                          <span>{assignedUser?.nom || 'Unassigned'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-[#6B7280]">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} />
                          <span>{formatDate(task.Date_limite)}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-6">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${priorityConfig.bg} ${priorityConfig.text}`}
                        >
                          {priorityConfig.icon}
                          {priorityConfig.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-6">
                        <select
                          value={task.status || 'A_faire'}
                          onChange={(e) =>
                            handleStatusChange(task.id!, e.target.value as TaskStatus)
                          }
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold border-0 ${statusConfig.bg} ${statusConfig.text} cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#263A81]`}
                        >
                          <option value="A_faire">Not Started</option>
                          <option value="En_cours">In Progress</option>
                          <option value="Terminer">Completed</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(task)}
                            className="p-1.5 hover:bg-blue-50 rounded-lg transition text-[#6B7280] hover:text-blue-600"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(task.id!.toString())}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition text-[#6B7280] hover:text-red-600"
                          >
                            <Trash2 size={18} />
                          </button>
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

      {/* ===== CREATE TASK MODAL ===== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-black">Create New Task</h2>
                <p className="text-sm text-gray-500">Assign a new task to a department member</p>
              </div>
              <button
                onClick={closeCreateModal}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateTask} className="px-6 py-5 space-y-4">
              {/* Task Title */}
              <div>
                <label className="block text-sm font-medium text-black mb-1.5">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  placeholder="Enter task title"
                  className="w-full h-11 px-3 rounded-lg border border-gray-300 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-black mb-1.5">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows={3}
                  placeholder="Provide detailed task description..."
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent resize-none"
                  disabled={isSubmitting}
                />
              </div>

              {/* Due Date + Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1.5">
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="Date_limite"
                    value={formData.Date_limite}
                    onChange={handleFormChange}
                    className="w-full h-11 px-3 rounded-lg border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1.5">
                    Priority Scale <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="priorite"
                    value={formData.priorite}
                    onChange={handleFormChange}
                    className="w-full h-11 px-3 rounded-lg border border-gray-300 text-black bg-white focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent"
                    required
                    disabled={isSubmitting}
                  >
                    <option value="Bas">Low</option>
                    <option value="Moyen">Medium</option>
                    <option value="Elevee">High</option>
                  </select>
                </div>
              </div>

              {/* Assign to */}
              <div>
                <label className="block text-sm font-medium text-black mb-1.5">
                  Assign to <span className="text-red-500">*</span>
                </label>
                <select
                  name="userId"
                  value={formData.userId}
                  onChange={handleFormChange}
                  className="w-full h-11 px-3 rounded-lg border border-gray-300 text-black bg-white focus:outline-none focus:ring-2 focus:ring-[#263A81]"
                  required
                  disabled={isSubmitting}
                >
                  <option value="" disabled>
                    Select a team member
                  </option>

                  {departmentUsers.length > 0 ? (
                    departmentUsers.map((user) => (
                      <option key={user.id} value={user.id} className="text-black">
                        {user.nom} ({user.email})
                      </option>
                    ))
                  ) : (
                    <option disabled>Aucun membre disponible</option>
                  )}
                </select>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="flex-1 h-11 rounded-lg border border-gray-300 text-black font-medium hover:bg-gray-50 transition"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 rounded-lg bg-[#263A81] text-white font-medium hover:bg-[#1e2f6a] transition flex items-center justify-center gap-2"
                  disabled={isSubmitting || departmentUsers.length === 0}
                >
                  <Plus size={18} />
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== EDIT TASK MODAL ===== */}
      {isEditModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-[#E5E7EB]">
              <div>
                <h2 className="text-xl font-bold text-[#1F2937]">Edit Task</h2>
                <p className="text-sm text-[#6B7280]">Update task details</p>
              </div>
              <button onClick={closeEditModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} className="text-[#6B7280]" />
              </button>
            </div>

            <form onSubmit={handleEditTask} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  className="w-full h-12 px-4 rounded-lg border border-[#D1D5DB] text-black focus:outline-none focus:ring-2 focus:ring-[#263A81]"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-[#D1D5DB] text-black focus:outline-none focus:ring-2 focus:ring-[#263A81] resize-none"
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="Date_limite"
                    value={formData.Date_limite}
                    onChange={handleFormChange}
                    className="w-full h-12 px-4 rounded-lg border border-[#D1D5DB] text-black focus:outline-none focus:ring-2 focus:ring-[#263A81]"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Priority Scale <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="priorite"
                    value={formData.priorite}
                    onChange={handleFormChange}
                    className="w-full h-12 px-4 rounded-lg border border-[#D1D5DB] text-black bg-white focus:outline-none focus:ring-2 focus:ring-[#263A81]"
                    required
                    disabled={isSubmitting}
                  >
                    <option value="Bas">Low</option>
                    <option value="Moyen">Medium</option>
                    <option value="Elevee">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Assign to <span className="text-red-500">*</span>
                </label>
                <select
                  name="userId"
                  value={formData.userId}
                  onChange={handleFormChange}
                  className="w-full h-12 px-4 rounded-lg border border-[#D1D5DB] text-black bg-white focus:outline-none focus:ring-2 focus:ring-[#263A81]"
                  required
                  disabled={isSubmitting}
                >
                  <option value="">Select a team member</option>
                  {departmentUsers.map((user) => (
                    <option key={user.id} value={user.id} className="text-black">
                      {user.nom} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 px-4 py-3 rounded-lg border border-[#D1D5DB] font-medium hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-[#263A81] text-white font-bold rounded-lg hover:bg-[#1e2f6a] flex items-center justify-center gap-2"
                  disabled={isSubmitting}
                >
                  <Edit size={18} />
                  Update Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Trash2 size={24} className="text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-[#1F2937]">Confirm Deletion</h2>
              </div>
            </div>

            <div className="p-6">
              <p className="text-[#1F2937] mb-2">Are you sure you want to delete this task?</p>
              <p className="text-sm text-[#6B7280]">This action cannot be undone.</p>
            </div>

            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={closeDeleteModal}
                className="flex-1 px-4 py-3 rounded-lg border border-[#D1D5DB] font-medium hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTask}
                className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"
                disabled={isSubmitting}
              >
                Delete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </HODLayout>
  );
};

export default HODTaskManagerPage;
