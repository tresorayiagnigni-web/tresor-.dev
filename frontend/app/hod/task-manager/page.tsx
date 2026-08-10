// app/hod/task-manager/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { HODLayout } from '@/app/layout/HodLayout';
import {
  CheckSquare,
  Users as UsersIcon,
  Plus,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Tag,
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
  type Task,
  type TaskStatus,
  type TaskPriority,
} from '@/lib/actions/taskActions';
import { getUsers, type User } from '@/lib/actions/userActions';
import { getDepartmentById, type Department } from '@/lib/actions/departmentActions';

// ========== TYPE DEFINITIONS ==========
interface TaskFormData {
  titre: string;
  description: string;
  Date_limite: string;
  priorite: TaskPriority;
  userId: string;
}

// ========== MAIN COMPONENT ==========
const HODTaskManagerPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [department, setDepartment] = useState<Department | null>(null);
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
    titre: '',
    description: '',
    Date_limite: '',
    priorite: 'Moyen',
    userId: '',
  });

  // HOD user info - In production, this would come from auth context
  const hodUserId = 1; // Placeholder - should come from auth
  const departmentId = 1; // Placeholder - should come from auth
  const hodName = 'Dr. Sarah Taylor';
  const hodInitials = 'ST';
  const departmentName = 'IT Architecture';

  // ========== LOAD DATA ==========
  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch tasks
      const taskResult = await getTasks();
      if (taskResult.success && taskResult.data) {
        setTasks(taskResult.data);
      }

      // Fetch users
      const userResult = await getUsers();
      if (userResult.success && userResult.data) {
        setUsers(userResult.data);
      }

      // Fetch department
      const deptResult = await getDepartmentById(departmentId);
      if (deptResult.success && deptResult.data) {
        setDepartment(deptResult.data);
      }
    } catch (err) {
      setError('Failed to load task data');
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // ===== DERIVED STATE =====
  // Get users in HOD's department
  const departmentUsers = users.filter(u => u.departmentId === department?.id);
  const departmentUserIds = departmentUsers.map(u => u.id).filter((id): id is number => id !== undefined);

  // Get tasks assigned to users in HOD's department
  const departmentTasks = tasks.filter(t => t.userId && departmentUserIds.includes(t.userId));

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
      'A_faire': {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        icon: <AlertCircle size={14} className="mr-1" />,
        label: 'Not Started',
      },
      'En_cours': {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        icon: <Clock size={14} className="mr-1" />,
        label: 'In Progress',
      },
      'Terminer': {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: <CheckCircle size={14} className="mr-1" />,
        label: 'Completed',
      },
    };
    return config[status] || config['A_faire'];
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getUserName = (userId?: number) => {
    if (!userId) return 'Unassigned';
    const user = users.find(u => u.id === userId);
    return user?.nom || 'Unknown';
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  // ========== MODAL HANDLERS ==========
  const openCreateModal = () => {
    setFormData({
      titre: '',
      description: '',
      Date_limite: '',
      priorite: 'Moyen',
      userId: '',
    });
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const openEditModal = (task: Task) => {
    setSelectedTask(task);
    setFormData({
      titre: task.titre || '',
      description: task.description || '',
      Date_limite: task.Date_limite || '',
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
      titre: formData.titre,
      description: formData.description,
      Date_limite: formData.Date_limite,
      priorite: formData.priorite,
      userId: parseInt(formData.userId),
      status: 'A_faire',
    });

    if (result.success && result.data) {
      showSuccess(`Task "${result.data.titre}" created successfully!`);
      closeCreateModal();
      loadData();
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
      titre: formData.titre,
      description: formData.description,
      Date_limite: formData.Date_limite,
      priorite: formData.priorite,
      userId: parseInt(formData.userId),
    });

    if (result.success && result.data) {
      showSuccess(`Task "${result.data.titre}" updated successfully!`);
      closeEditModal();
      loadData();
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
      loadData();
    } else {
      setError(result.message || 'Failed to delete task');
    }
    setIsSubmitting(false);
  };

  const handleStatusChange = async (taskId: number, newStatus: TaskStatus) => {
    const result = await updateTaskStatus(taskId, newStatus);
    if (result.success) {
      showSuccess(`Task status updated to ${getStatusBadge(newStatus).label}`);
      loadData();
    } else {
      setError(result.message || 'Failed to update task status');
    }
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 animate-fade-in">
          <CheckCircle size={20} className="text-green-600" />
          <span className="text-green-800 font-medium">{successMessage}</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 animate-fade-in">
          <AlertCircle size={20} className="text-red-600" />
          <span className="text-red-800 font-medium">{error}</span>
        </div>
      )}

      {/* Task Inventory Table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-gray-50/70">
                <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold tracking-wide">Task Title</th>
                <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold tracking-wide">Assigned Personnel</th>
                <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold tracking-wide">Due Date</th>
                <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold tracking-wide">Priority</th>
                <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold tracking-wide">Status</th>
                <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {departmentTasks.length === 0 ? (
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
                departmentTasks.map((task) => {
                  const priorityConfig = getPriorityBadge(task.priorite || 'Moyen');
                  const statusConfig = getStatusBadge(task.status || 'A_faire');
                  const assignedUser = users.find(u => u.id === task.userId);

                  return (
                    <tr key={task.id} className="hover:bg-gray-50/50 transition duration-150">
                      <td className="py-3.5 px-6">
                        <div>
                          <div className="text-[#1F2937] font-medium">{task.titre}</div>
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
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${priorityConfig.bg} ${priorityConfig.text}`}
                        >
                          {priorityConfig.icon}
                          {priorityConfig.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-6">
                        <select
                          value={task.status || 'A_faire'}
                          onChange={(e) => handleStatusChange(task.id!, e.target.value as TaskStatus)}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide border-0 ${statusConfig.bg} ${statusConfig.text} cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#263A81]`}
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
                            aria-label="Edit task"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(task.id!.toString())}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition text-[#6B7280] hover:text-red-600"
                            aria-label="Delete task"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-[#E5E7EB]">
              <div>
                <h2 className="text-xl font-bold text-[#1F2937]">Create New Task</h2>
                <p className="text-sm text-[#6B7280]">Assign a new task to a department member</p>
              </div>
              <button
                onClick={closeCreateModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                aria-label="Close modal"
              >
                <X size={20} className="text-[#6B7280]" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-5">
              <div>
                <label htmlFor="titre" className="block text-sm font-medium text-[#1F2937] mb-1">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="titre"
                  name="titre"
                  value={formData.titre}
                  onChange={handleFormChange}
                  placeholder="Enter task title"
                  className="w-full h-12 px-4 rounded-lg border border-[#D1D5DB] bg-white text-[#1F2937] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-[#1F2937] mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows={3}
                  placeholder="Provide detailed task description..."
                  className="w-full px-4 py-3 rounded-lg border border-[#D1D5DB] bg-white text-[#1F2937] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition resize-none"
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="Date_limite" className="block text-sm font-medium text-[#1F2937] mb-1">
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="Date_limite"
                    name="Date_limite"
                    value={formData.Date_limite}
                    onChange={handleFormChange}
                    className="w-full h-12 px-4 rounded-lg border border-[#D1D5DB] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label htmlFor="priorite" className="block text-sm font-medium text-[#1F2937] mb-1">
                    Priority Scale <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="priorite"
                    name="priorite"
                    value={formData.priorite}
                    onChange={handleFormChange}
                    className="w-full h-12 px-4 rounded-lg border border-[#D1D5DB] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition"
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
                <label htmlFor="userId" className="block text-sm font-medium text-[#1F2937] mb-1">
                  Assign to <span className="text-red-500">*</span>
                </label>
                <select
                  id="userId"
                  name="userId"
                  value={formData.userId}
                  onChange={handleFormChange}
                  className="w-full h-12 px-4 rounded-lg border border-[#D1D5DB] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition"
                  required
                  disabled={isSubmitting}
                >
                  <option value="">Select a team member</option>
                  {departmentUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.nom} ({user.email})
                    </option>
                  ))}
                </select>
                {departmentUsers.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">No department users available to assign tasks</p>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="flex-1 px-4 py-3 rounded-lg border border-[#D1D5DB] text-[#1F2937] font-medium hover:bg-gray-50 transition"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-[#263A81] text-white font-bold rounded-lg hover:bg-[#1e2f6a] transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-[#E5E7EB]">
              <div>
                <h2 className="text-xl font-bold text-[#1F2937]">Edit Task</h2>
                <p className="text-sm text-[#6B7280]">Update task details</p>
              </div>
              <button
                onClick={closeEditModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                aria-label="Close modal"
              >
                <X size={20} className="text-[#6B7280]" />
              </button>
            </div>

            <form onSubmit={handleEditTask} className="p-6 space-y-5">
              <div>
                <label htmlFor="edit-titre" className="block text-sm font-medium text-[#1F2937] mb-1">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="edit-titre"
                  name="titre"
                  value={formData.titre}
                  onChange={handleFormChange}
                  placeholder="Enter task title"
                  className="w-full h-12 px-4 rounded-lg border border-[#D1D5DB] bg-white text-[#1F2937] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="edit-description" className="block text-sm font-medium text-[#1F2937] mb-1">
                  Description
                </label>
                <textarea
                  id="edit-description"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows={3}
                  placeholder="Provide detailed task description..."
                  className="w-full px-4 py-3 rounded-lg border border-[#D1D5DB] bg-white text-[#1F2937] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition resize-none"
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-Date_limite" className="block text-sm font-medium text-[#1F2937] mb-1">
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="edit-Date_limite"
                    name="Date_limite"
                    value={formData.Date_limite}
                    onChange={handleFormChange}
                    className="w-full h-12 px-4 rounded-lg border border-[#D1D5DB] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label htmlFor="edit-priorite" className="block text-sm font-medium text-[#1F2937] mb-1">
                    Priority Scale <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="edit-priorite"
                    name="priorite"
                    value={formData.priorite}
                    onChange={handleFormChange}
                    className="w-full h-12 px-4 rounded-lg border border-[#D1D5DB] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition"
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
                <label htmlFor="edit-userId" className="block text-sm font-medium text-[#1F2937] mb-1">
                  Assign to <span className="text-red-500">*</span>
                </label>
                <select
                  id="edit-userId"
                  name="userId"
                  value={formData.userId}
                  onChange={handleFormChange}
                  className="w-full h-12 px-4 rounded-lg border border-[#D1D5DB] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition"
                  required
                  disabled={isSubmitting}
                >
                  <option value="">Select a team member</option>
                  {departmentUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.nom} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 px-4 py-3 rounded-lg border border-[#D1D5DB] text-[#1F2937] font-medium hover:bg-gray-50 transition"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-[#263A81] text-white font-bold rounded-lg hover:bg-[#1e2f6a] transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl animate-scale-in">
            <div className="p-6 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Trash2 size={24} className="text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-[#1F2937]">Confirm Deletion</h2>
              </div>
            </div>

            <div className="p-6">
              <p className="text-[#1F2937] mb-2">
                Are you sure you want to delete this task?
              </p>
              <p className="text-sm text-[#6B7280]">
                This action cannot be undone and will permanently remove the task from the department board.
              </p>
            </div>

            <div className="flex gap-3 p-6 pt-0 border-t border-[#E5E7EB]">
              <button
                onClick={closeDeleteModal}
                className="flex-1 px-4 py-3 rounded-lg border border-[#D1D5DB] text-[#1F2937] font-medium hover:bg-gray-50 transition"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTask}
                className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-all duration-200 active:scale-95"
                disabled={isSubmitting}
              >
                Delete Task
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
        .animate-scale-in { animation: scaleIn 0.2s ease-out; }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </HODLayout>
  );
};

export default HODTaskManagerPage;