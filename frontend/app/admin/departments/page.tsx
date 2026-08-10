// app/admin/departments/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/app/layout/AppLayout';
import {
  Building,
  Users,
  UserCog,
  UserCheck,
  Clock,
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  CheckCircle,
  AlertCircle,
  Mail,
  User,
} from 'lucide-react';
import { type Department } from '@/lib/actions/departmentActions';
import { type User as ApiUser } from '@/lib/actions/userActions';
import {
  fetchDepartments,
  fetchUsers,
  createNewDepartment,
  updateExistingDepartment,
  deleteExistingDepartment,
  assignHOD,
  showSuccess,
  formatDate,
} from '@/lib/helpers/adminHelpers';

// ========== TYPE DEFINITIONS ==========
interface DepartmentFormData {
  nom_departement: string;
  description: string;
  chef_departementId: string;
}

// ========== MAIN COMPONENT ==========
const DepartmentsPage: React.FC = () => {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);

  // Form data
  const [formData, setFormData] = useState<DepartmentFormData>({
    nom_departement: '',
    description: '',
    chef_departementId: '',
  });

  const [editFormData, setEditFormData] = useState<DepartmentFormData>({
    nom_departement: '',
    description: '',
    chef_departementId: '',
  });

  // ========== LOAD DATA ==========
  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    const deptResult = await fetchDepartments();
    if (deptResult.success && deptResult.data) {
      setDepartments(deptResult.data);
    } else {
      setError(deptResult.message || 'Failed to load departments');
    }

    const userResult = await fetchUsers();
    if (userResult.success && userResult.data) {
      setUsers(userResult.data);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // ========== DERIVED STATE ==========
  const filteredDepartments = departments.filter((dept) => {
    const matchesSearch =
      (dept.nom_departement || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dept.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dept.code || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Get HOD users (users with role HOD)
  const hodUsers = users.filter((u) => u.role === 'HOD');

  // Get available HOD users (not already assigned as HOD to another department)
  const getAvailableHODs = (currentDepartmentId?: number) => {
    const assignedHODIds = departments
      .filter((d) => d.id !== currentDepartmentId)
      .map((d) => d.chef_departementId)
      .filter((id): id is number => id !== undefined && id !== null);

    return hodUsers.filter((u) => !assignedHODIds.includes(u.id!));
  };

  // ========== HELPER FUNCTIONS ==========
  const getStatusBadge = (status: 'active' | 'inactive' | boolean | undefined) => {
    const isActive = status === true || status === 'active';
    const config = {
      active: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: <UserCheck size={14} className="mr-1" />,
        label: 'Active',
      },
      inactive: {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        icon: <Clock size={14} className="mr-1" />,
        label: 'Inactive',
      },
    };
    return isActive ? config.active : config.inactive;
  };

  const getHODName = (department: Department) => {
    if (!department.chef_departementId) return 'Unassigned';
    const hod = users.find((u) => u.id === department.chef_departementId);
    return hod?.nom || 'Unknown';
  };

  const getEmployeeCount = (department: Department) => {
    return users.filter((u) => u.departmentId === department.id).length;
  };

  // ========== MODAL HANDLERS ==========
  const openCreateModal = () => {
    setFormData({
      nom_departement: '',
      description: '',
      chef_departementId: '',
    });
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const openEditModal = (department: Department) => {
    setSelectedDepartment(department);
    setEditFormData({
      nom_departement: department.nom_departement || '',
      description: department.description || '',
      chef_departementId: department.chef_departementId?.toString() || '',
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedDepartment(null);
  };

  const openDeleteModal = (department: Department) => {
    setDepartmentToDelete(department);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDepartmentToDelete(null);
  };

  const handleCardClick = (departmentId: number) => {
    router.push(`/admin/department-inspector/${departmentId}`);
  };

  // ========== CRUD OPERATIONS ==========
  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const result = await createNewDepartment({
      nom_departement: formData.nom_departement,
      description: formData.description,
    });

    if (result.success && result.data) {
      if (formData.chef_departementId) {
        const assignResult = await assignHOD(result.data.id!, parseInt(formData.chef_departementId));
        if (assignResult.success) {
          showSuccess(setSuccessMessage, `Department created with HOD assigned successfully!`);
        }
      } else {
        showSuccess(setSuccessMessage, `Department ${result.data.nom_departement} created successfully!`);
      }
      closeCreateModal();
      loadData();
    } else {
      setError(result.message || 'Failed to create department');
    }
    setIsSubmitting(false);
  };

  const handleEditDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDepartment) return;
    setIsSubmitting(true);
    setError(null);

    const result = await updateExistingDepartment(selectedDepartment.id!, {
      nom_departement: editFormData.nom_departement,
      description: editFormData.description,
    });

    if (result.success && result.data) {
      const currentHODId = selectedDepartment.chef_departementId;
      const newHODId = editFormData.chef_departementId ? parseInt(editFormData.chef_departementId) : null;

      if (newHODId !== currentHODId) {
        if (newHODId) {
          const assignResult = await assignHOD(selectedDepartment.id!, newHODId);
          if (assignResult.success) {
            showSuccess(setSuccessMessage, `Department updated with new HOD assigned!`);
          }
        }
      } else {
        showSuccess(setSuccessMessage, `Department ${result.data.nom_departement} updated successfully!`);
      }
      closeEditModal();
      loadData();
    } else {
      setError(result.message || 'Failed to update department');
    }
    setIsSubmitting(false);
  };

  const handleDeleteDepartment = async () => {
    if (!departmentToDelete) return;
    setIsSubmitting(true);
    setError(null);

    const employeeCount = users.filter((u) => u.departmentId === departmentToDelete.id).length;
    if (employeeCount > 0) {
      setError(`Cannot delete department with ${employeeCount} assigned users. Please reassign or remove users first.`);
      setIsSubmitting(false);
      return;
    }

    const result = await deleteExistingDepartment(departmentToDelete.id!);
    if (result.success) {
      showSuccess(setSuccessMessage, `Department ${departmentToDelete.nom_departement} deleted successfully!`);
      closeDeleteModal();
      loadData();
    } else {
      setError(result.message || 'Failed to delete department');
    }
    setIsSubmitting(false);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ========== RENDER ==========
  return (
    <AppLayout
      pageTitle="Department Management"
      pageSubtitle="Create, manage, and organize departments across your organization"
      showCreateButton={true}
      onCreateClick={openCreateModal}
      createButtonText="Create Department"
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

      {/* Search Bar */}
      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6B7280]" />
          <input
            type="text"
            placeholder="Search departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-[#E5E7EB] bg-white text-[#1F2937] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition"
          />
        </div>
        <span className="text-sm text-[#6B7280]">
          {filteredDepartments.length} department{filteredDepartments.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm animate-pulse">
              <div className="h-20 bg-gray-200 rounded mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Department Cards Grid */}
          {filteredDepartments.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-12 text-center">
              <Building size={56} className="mx-auto text-[#6B7280] opacity-30 mb-4" />
              <p className="text-lg font-medium text-[#1F2937] mb-2">No departments found</p>
              <p className="text-sm text-[#6B7280] mb-6">Create your first department to get started</p>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#263A81] text-white font-medium rounded-lg hover:bg-[#1e2f6a] transition"
              >
                <Plus size={18} />
                Create Department
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDepartments.map((department) => {
                const employeeCount = getEmployeeCount(department);
                const hodName = getHODName(department);
                const statusConfig = getStatusBadge(department.isActive);

                return (
                  <div
                    key={department.id}
                    className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
                    onClick={() => handleCardClick(department.id!)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-[#1F2937] truncate group-hover:text-[#263A81] transition-colors">
                          {department.nom_departement || 'Unnamed'}
                        </h3>
                        {department.code && (
                          <p className="text-xs text-[#6B7280] font-mono">{department.code}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(department);
                          }}
                          className="p-1.5 hover:bg-blue-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                          title="Edit department"
                        >
                          <Edit size={16} className="text-blue-500" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(department);
                          }}
                          className="p-1.5 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                          title="Delete department"
                        >
                          <Trash2 size={16} className="text-red-400" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[#6B7280]">Head of Department</span>
                        <span className="font-medium text-[#1F2937] flex items-center gap-1">
                          {hodName !== 'Unassigned' ? (
                            <>
                              <User size={14} className="text-[#6B7280]" />
                              {hodName}
                            </>
                          ) : (
                            <span className="text-[#6B7280] italic">Unassigned</span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#6B7280]">Employees</span>
                        <span className="font-semibold text-[#1F2937]">{employeeCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#6B7280]">Status</span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}
                        >
                          {statusConfig.icon}
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>

                    {department.description && (
                      <div className="mt-3 pt-3 border-t border-[#E5E7EB]">
                        <p className="text-xs text-[#6B7280] line-clamp-2">{department.description}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ===== CREATE DEPARTMENT MODAL ===== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
            <div className="sticky top-0 bg-white border-b border-[#E5E7EB] p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <Building size={24} className="text-[#263A81]" />
                <div>
                  <h2 className="text-xl font-bold text-[#1F2937]">Create New Department</h2>
                  <p className="text-sm text-[#6B7280]">Add a new department to your organization</p>
                </div>
              </div>
              <button
                onClick={closeCreateModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                aria-label="Close modal"
              >
                <X size={20} className="text-[#6B7280]" />
              </button>
            </div>

            <form onSubmit={handleCreateDepartment} className="p-6 space-y-5">
              <div>
                <label htmlFor="nom_departement" className="block text-sm font-medium text-[#1F2937] mb-1.5">
                  Department Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="nom_departement"
                  name="nom_departement"
                  value={formData.nom_departement}
                  onChange={handleFormChange}
                  placeholder="Enter department name"
                  className="w-full h-11 px-4 rounded-lg border border-[#D1D5DB] bg-white text-[#1F2937] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-[#1F2937] mb-1.5">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Describe the department's purpose and responsibilities"
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#D1D5DB] bg-white text-[#1F2937] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition resize-none"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="chef_departementId" className="block text-sm font-medium text-[#1F2937] mb-1.5">
                  Head of Department
                </label>
                <select
                  id="chef_departementId"
                  name="chef_departementId"
                  value={formData.chef_departementId}
                  onChange={handleFormChange}
                  className="w-full h-11 px-4 rounded-lg border border-[#D1D5DB] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition"
                  disabled={isSubmitting}
                >
                  <option value="">Select HOD (optional)</option>
                  {getAvailableHODs().map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.nom} ({user.email})
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-[#6B7280]">
                  Only users with HOD role can be selected. Only unassigned HODs are shown.
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-[#D1D5DB] text-[#1F2937] font-medium hover:bg-gray-50 transition"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-[#263A81] text-white font-bold rounded-lg hover:bg-[#1e2f6a] transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
                  disabled={isSubmitting}
                >
                  <Building size={18} />
                  Create Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== EDIT DEPARTMENT MODAL ===== */}
      {isEditModalOpen && selectedDepartment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
            <div className="sticky top-0 bg-white border-b border-[#E5E7EB] p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <Edit size={24} className="text-[#263A81]" />
                <div>
                  <h2 className="text-xl font-bold text-[#1F2937]">Edit Department</h2>
                  <p className="text-sm text-[#6B7280]">Update department information for {selectedDepartment.nom_departement}</p>
                </div>
              </div>
              <button
                onClick={closeEditModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                aria-label="Close modal"
              >
                <X size={20} className="text-[#6B7280]" />
              </button>
            </div>

            <form onSubmit={handleEditDepartment} className="p-6 space-y-5">
              <div>
                <label htmlFor="edit-nom_departement" className="block text-sm font-medium text-[#1F2937] mb-1.5">
                  Department Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="edit-nom_departement"
                  name="nom_departement"
                  value={editFormData.nom_departement}
                  onChange={handleEditFormChange}
                  className="w-full h-11 px-4 rounded-lg border border-[#D1D5DB] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="edit-description" className="block text-sm font-medium text-[#1F2937] mb-1.5">
                  Description
                </label>
                <textarea
                  id="edit-description"
                  name="description"
                  value={editFormData.description}
                  onChange={handleEditFormChange}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#D1D5DB] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition resize-none"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="edit-chef_departementId" className="block text-sm font-medium text-[#1F2937] mb-1.5">
                  Head of Department
                </label>
                <select
                  id="edit-chef_departementId"
                  name="chef_departementId"
                  value={editFormData.chef_departementId}
                  onChange={handleEditFormChange}
                  className="w-full h-11 px-4 rounded-lg border border-[#D1D5DB] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition"
                  disabled={isSubmitting}
                >
                  <option value="">Select HOD (optional)</option>
                  {getAvailableHODs(selectedDepartment.id).map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.nom} ({user.email})
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-[#6B7280]">
                  Only users with HOD role can be selected. Only unassigned HODs are shown.
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-[#D1D5DB] text-[#1F2937] font-medium hover:bg-gray-50 transition"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-[#263A81] text-white font-bold rounded-lg hover:bg-[#1e2f6a] transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
                  disabled={isSubmitting}
                >
                  <Edit size={18} />
                  Update Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      {isDeleteModalOpen && departmentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl animate-scale-in">
            <div className="p-6 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Trash2 size={24} className="text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-[#1F2937]">Delete Department</h2>
              </div>
            </div>

            <div className="p-6">
              <p className="text-[#1F2937] mb-2">
                Are you sure you want to delete <span className="font-semibold">{departmentToDelete.nom_departement}</span>?
              </p>
              <p className="text-sm text-[#6B7280] mb-4">
                This action cannot be undone. All associated data will be permanently removed.
              </p>
              {getEmployeeCount(departmentToDelete) > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-red-700">
                    <AlertCircle size={16} />
                    <span>
                      Cannot delete: {getEmployeeCount(departmentToDelete)} user{getEmployeeCount(departmentToDelete) !== 1 ? 's' : ''} are currently assigned to this department.
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 pt-0 border-t border-[#E5E7EB]">
              <button
                onClick={closeDeleteModal}
                className="flex-1 px-4 py-2.5 rounded-lg border border-[#D1D5DB] text-[#1F2937] font-medium hover:bg-gray-50 transition"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDepartment}
                className={`flex-1 px-4 py-2.5 text-white font-bold rounded-lg transition ${
                  getEmployeeCount(departmentToDelete) > 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
                disabled={isSubmitting || getEmployeeCount(departmentToDelete) > 0}
              >
                Delete Department
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
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </AppLayout>
  );
};

export default DepartmentsPage;