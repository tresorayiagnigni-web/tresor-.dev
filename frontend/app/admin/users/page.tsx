// app/admin/users/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/app/layout/AppLayout';
import {
  Users,
  UserPlus,
  Search,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Shield,
  Mail,
  Building,
  Clock,
  X,
  CheckCircle,
  AlertCircle,
  UserCog,
  Key,
  Eye,
  EyeOff,
  Save,
  ArrowRight,
} from 'lucide-react';
import { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser,
  type User as ApiUser,
  type UserRole,
  type UserStatus,
} from '@/lib/actions/userActions';
import { getDepartments, type Department } from '@/lib/actions/departmentActions';
import { showSuccess, formatDate } from '@/lib/helpers/adminHelpers';

// ===== TYPE DEFINITIONS =====
interface CreateUserFormData {
  nom: string;
  email: string;
  telephone: string;
  role: UserRole;
  departement: string;
  password: string;
}

interface EditUserFormData {
  nom: string;
  email: string;
  telephone: string;
  role: UserRole;
  departement: string;
  status: UserStatus;
}

// ===== MAIN COMPONENT =====
const UsersPage: React.FC = () => {
  const router = useRouter();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<ApiUser | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [formData, setFormData] = useState<CreateUserFormData>({
    nom: '',
    email: '',
    telephone: '',
    role: 'EMPLOYER',
    departement: '',
    password: '',
  });

  const [editFormData, setEditFormData] = useState<EditUserFormData>({
    nom: '',
    email: '',
    telephone: '',
    role: 'EMPLOYER',
    departement: '',
    status: 'true',
  });

  // ===== LOAD DATA =====
  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    const userResult = await getUsers();
    if (userResult.success && userResult.data) {
      setUsers(userResult.data);
    } else {
      setError(userResult.message || 'Failed to load users');
    }

    const deptResult = await getDepartments();
    if (deptResult.success && deptResult.data) {
      setDepartments(deptResult.data);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // ===== DERIVED STATE =====
  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.nom || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (user.departement || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const userStatus = user.status === 'true' || user.status === true ? 'true' : 'false';
    const matchesStatus = selectedStatus === 'all' || userStatus === selectedStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // ===== STATS =====
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'true' || u.status === true).length;
  const suspendedUsers = users.filter(u => u.status === 'false' || u.status === false).length;
  const adminCount = users.filter(u => u.role === 'ADMIN').length;
  const hodCount = users.filter(u => u.role === 'HOD').length;
  const employeeCount = users.filter(u => u.role === 'EMPLOYER').length;

  // ===== HELPERS =====
  const getRoleBadge = (role: UserRole | undefined) => {
    const config = {
      ADMIN: { bg: 'bg-blue-100', text: 'text-blue-800', icon: <Shield size={14} className="mr-1" />, label: 'Admin' },
      HOD: { bg: 'bg-purple-100', text: 'text-purple-800', icon: <UserCog size={14} className="mr-1" />, label: 'HOD' },
      EMPLOYER: { bg: 'bg-gray-100', text: 'text-gray-800', icon: <Users size={14} className="mr-1" />, label: 'Employee' },
    };
    return config[role || 'EMPLOYER'];
  };

  const getStatusBadge = (status: UserStatus | boolean | undefined) => {
    const isActive = status === 'true' || status === true;
    const isSuspended = status === 'false' || status === false;
    if (isActive) {
      return { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircle size={14} className="mr-1" />, label: 'Active' };
    } else if (isSuspended) {
      return { bg: 'bg-red-100', text: 'text-red-800', icon: <AlertCircle size={14} className="mr-1" />, label: 'Suspended' };
    } else {
      return { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <Clock size={14} className="mr-1" />, label: 'Pending' };
    }
  };

  const navigateToUserProfile = (userId: number) => {
    router.push(`/admin/users/${userId}`);
  };

  // ===== CREATE HANDLERS =====
  const openCreateModal = () => {
    setFormData({
      nom: '',
      email: '',
      telephone: '',
      role: 'EMPLOYER',
      departement: '',
      password: '',
    });
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const result = await createUser({
      nom: formData.nom,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      departement: formData.departement,
      telephone: formData.telephone,
      status: 'true',
    });

    if (result.success && result.data) {
      showSuccess(setSuccessMessage, `User ${result.data.nom} created successfully!`);
      closeCreateModal();
      loadData();
    } else {
      setError(result.message || 'Failed to create user');
    }
    setIsSubmitting(false);
  };

  // ===== EDIT HANDLERS =====
  const openEditModal = (user: ApiUser) => {
    setSelectedUser(user);
    setEditFormData({
      nom: user.nom || '',
      email: user.email || '',
      telephone: user.telephone || '',
      role: user.role || 'EMPLOYER',
      departement: user.departement || '',
      status: user.status === 'true' || user.status === true ? 'true' : 'false',
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSubmitting(true);
    setError(null);

    const result = await updateUser(selectedUser.id!, {
      nom: editFormData.nom,
      email: editFormData.email,
      role: editFormData.role,
      departement: editFormData.departement,
      telephone: editFormData.telephone,
      status: editFormData.status,
    });

    if (result.success && result.data) {
      showSuccess(setSuccessMessage, `User ${result.data.nom} updated successfully!`);
      closeEditModal();
      loadData();
    } else {
      setError(result.message || 'Failed to update user');
    }
    setIsSubmitting(false);
  };

  // ===== DELETE HANDLERS =====
  const openDeleteModal = (user: ApiUser) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsSubmitting(true);
    setError(null);

    const result = await deleteUser(userToDelete.id!);
    if (result.success) {
      showSuccess(setSuccessMessage, `User ${userToDelete.nom} deleted successfully!`);
      closeDeleteModal();
      loadData();
    } else {
      setError(result.message || 'Failed to delete user');
    }
    setIsSubmitting(false);
  };

  // ===== STATUS TOGGLE =====
  const handleToggleStatus = async (userId: number) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const currentStatus = user.status === 'true' || user.status === true;
    const newStatus = currentStatus ? 'false' : 'true';

    const result = await updateUser(userId, { status: newStatus as UserStatus });
    if (result.success) {
      showSuccess(setSuccessMessage, `User ${user.nom} ${newStatus === 'true' ? 'activated' : 'suspended'} successfully!`);
      loadData();
    } else {
      setError(result.message || 'Failed to update user status');
    }
  };

  // ===== RENDER =====
  return (
    <AppLayout
      pageTitle="User Management"
      pageSubtitle="Manage user accounts, roles, and permissions across your organization"
      showCreateButton={true}
      onCreateClick={openCreateModal}
      createButtonText="Create User"
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

      {/* Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm animate-pulse">
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        /* Stats Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#6B7280]">Total Users</p>
                <p className="text-3xl font-bold text-[#1F2937] mt-1">{totalUsers}</p>
              </div>
              <div className="p-3 bg-[#263A81]/10 rounded-lg">
                <Users size={24} className="text-[#263A81]" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-green-600">● {activeUsers} Active</span>
              <span className="flex items-center gap-1 text-red-600">● {suspendedUsers} Suspended</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#6B7280]">Departments</p>
                <p className="text-3xl font-bold text-[#1F2937] mt-1">{departments.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building size={24} className="text-blue-600" />
              </div>
            </div>
            <div className="mt-4 text-xs text-[#6B7280]">Across all departments</div>
          </div>

          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#6B7280]">Admin Users</p>
                <p className="text-3xl font-bold text-[#1F2937] mt-1">{adminCount}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Shield size={24} className="text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3 text-xs flex-wrap">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                HOD: {hodCount}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                Emp: {employeeCount}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="p-6 border-b border-[#E5E7EB]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Users size={24} className="text-[#263A81]" />
              <h2 className="text-xl font-bold text-[#1F2937]">All Users</h2>
              <span className="text-sm text-[#6B7280] bg-gray-100 px-3 py-1 rounded-full">
                {filteredUsers.length} users
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6B7280]" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-52 h-10 pl-10 pr-4 rounded-lg border border-[#E5E7EB] bg-[#FEFEFC] text-[#1F2937] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition"
                />
              </div>
              {/* Role Filter */}
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full sm:w-36 h-10 px-4 rounded-lg border border-[#E5E7EB] bg-[#FEFEFC] text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition"
              >
                <option value="all">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="HOD">HOD</option>
                <option value="EMPLOYER">Employee</option>
              </select>
              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full sm:w-36 h-10 px-4 rounded-lg border border-[#E5E7EB] bg-[#FEFEFC] text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition"
              >
                <option value="all">All Status</option>
                <option value="true">Active</option>
                <option value="false">Suspended</option>
              </select>
              {/* Create User Button (Desktop) */}
              <button
                onClick={openCreateModal}
                className="hidden lg:flex items-center gap-2 px-4 py-2 bg-[#263A81] text-white font-medium rounded-lg hover:bg-[#1e2f6a] transition-all duration-200 active:scale-95 shadow-lg shadow-[#263A81]/20"
              >
                <UserPlus size={18} />
                <span>Create User</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-gray-50/70">
                <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold tracking-wide">User</th>
                <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold tracking-wide">Role</th>
                <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold tracking-wide">Department</th>
                <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold tracking-wide">Status</th>
                <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold tracking-wide">Joined</th>
                <th className="text-right py-3.5 px-6 text-[#6B7280] font-semibold tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-[#6B7280]">
                    <div className="flex flex-col items-center gap-3">
                      <Users size={56} className="text-[#6B7280] opacity-30" />
                      <p className="text-lg font-medium">No users found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                      <button
                        onClick={openCreateModal}
                        className="mt-2 flex items-center gap-2 px-6 py-2.5 bg-[#263A81] text-white font-medium rounded-lg hover:bg-[#1e2f6a] transition"
                      >
                        <UserPlus size={18} />
                        Create your first user
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const userStatus = user.status === 'true' || user.status === true ? 'true' : 'false';
                  const roleConfig = getRoleBadge(user.role);
                  const statusConfig = getStatusBadge(userStatus);
                  return (
                    <tr 
                      key={user.id} 
                      className="hover:bg-gray-50/50 transition duration-150 cursor-pointer group"
                      onClick={() => navigateToUserProfile(user.id!)}
                    >
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#263A81]/10 flex items-center justify-center text-[#263A81] font-semibold text-sm flex-shrink-0">
                            {user.nom?.split(' ').map(n => n[0]).join('') || 'U'}
                          </div>
                          <div>
                            <div className="text-[#1F2937] font-medium group-hover:text-[#263A81] transition-colors flex items-center gap-2">
                              {user.nom || 'Unknown'}
                              <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#263A81]" />
                            </div>
                            <div className="text-xs text-[#6B7280] flex items-center gap-1">
                              <Mail size={12} />
                              <span>{user.email || 'No email'}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${roleConfig.bg} ${roleConfig.text}`}>
                          {roleConfig.icon}
                          {roleConfig.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-1.5">
                          <Building size={14} className="text-[#6B7280]" />
                          <span className="text-[#1F2937]">{user.departement || 'Unassigned'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
                          {statusConfig.icon}
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-[#6B7280] text-xs">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(user);
                            }}
                            className="p-1.5 hover:bg-blue-50 rounded-lg transition"
                            title="Edit user"
                          >
                            <Edit size={16} className="text-blue-500 hover:text-blue-700" />
                          </button>
                          {/* Status Toggle Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStatus(user.id!);
                            }}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                            title={userStatus === 'true' ? 'Suspend user' : 'Activate user'}
                          >
                            {userStatus === 'true' ? (
                              <UserX size={16} className="text-red-400 hover:text-red-600" />
                            ) : (
                              <UserCheck size={16} className="text-green-400 hover:text-green-600" />
                            )}
                          </button>
                          {/* Delete Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteModal(user);
                            }}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition"
                            title="Delete user"
                          >
                            <Trash2 size={16} className="text-red-400 hover:text-red-600" />
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

        {/* Table Footer with Create Button */}
        <div className="p-4 border-t border-[#E5E7EB] bg-gray-50/50 flex items-center justify-between">
          <div className="text-xs text-[#6B7280]">
            Showing {filteredUsers.length} of {users.length} users
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#263A81] text-white font-medium rounded-lg hover:bg-[#1e2f6a] transition-all duration-200 active:scale-95 shadow-lg shadow-[#263A81]/20 lg:hidden"
          >
            <UserPlus size={18} />
            <span>Create User</span>
          </button>
        </div>
      </div>

      {/* ===== CREATE USER MODAL ===== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
            <div className="sticky top-0 bg-white border-b border-[#E5E7EB] p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <UserPlus size={24} className="text-[#263A81]" />
                <div>
                  <h2 className="text-xl font-bold text-[#1F2937]">Create New User</h2>
                  <p className="text-sm text-[#6B7280]">Add a new user to your organization</p>
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

            <form onSubmit={handleCreateUser} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nom" className="block text-sm font-medium text-[#1F2937] mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="nom"
                    name="nom"
                    value={formData.nom}
                    onChange={handleFormChange}
                    placeholder="Enter full name"
                    className="w-full h-11 px-4 rounded-lg border border-[#D1D5DB] bg-white text-[#1F2937] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#1F2937] mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6B7280]" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      placeholder="user@company.com"
                      className="w-full h-11 pl-10 pr-4 rounded-lg border border-[#D1D5DB] bg-white text-[#1F2937] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="telephone" className="block text-sm font-medium text-[#1F2937] mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="telephone"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleFormChange}
                    placeholder="+1 (555) 000-0000"
                    className="w-full h-11 px-4 rounded-lg border border-[#D1D5DB] bg-white text-[#1F2937] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-[#1F2937] mb-1.5">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Key size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6B7280]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleFormChange}
                      placeholder="Set a password"
                      className="w-full h-11 pl-10 pr-12 rounded-lg border border-[#D1D5DB] bg-white text-[#1F2937] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition"
                      required
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6B7280] hover:text-[#1F2937] transition"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-[#1F2937] mb-1.5">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleFormChange}
                    className="w-full h-11 px-4 rounded-lg border border-[#D1D5DB] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition"
                    required
                    disabled={isSubmitting}
                  >
                    <option value="EMPLOYER">Employee</option>
                    <option value="HOD">Head of Department</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="departement" className="block text-sm font-medium text-[#1F2937] mb-1.5">
                    Department
                  </label>
                  <select
                    id="departement"
                    name="departement"
                    value={formData.departement}
                    onChange={handleFormChange}
                    className="w-full h-11 px-4 rounded-lg border border-[#D1D5DB] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition"
                    disabled={isSubmitting}
                  >
                    <option value="">Unassigned</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.nom_departement}>
                        {dept.nom_departement}
                      </option>
                    ))}
                  </select>
                </div>
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
                  <UserPlus size={18} />
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== EDIT USER MODAL ===== */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
            <div className="sticky top-0 bg-white border-b border-[#E5E7EB] p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <Edit size={24} className="text-[#263A81]" />
                <div>
                  <h2 className="text-xl font-bold text-[#1F2937]">Edit User</h2>
                  <p className="text-sm text-[#6B7280]">Update user information for {selectedUser.nom}</p>
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

            <form onSubmit={handleUpdateUser} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-nom" className="block text-sm font-medium text-[#1F2937] mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="edit-nom"
                    name="nom"
                    value={editFormData.nom}
                    onChange={handleEditFormChange}
                    className="w-full h-11 px-4 rounded-lg border border-[#D1D5DB] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label htmlFor="edit-email" className="block text-sm font-medium text-[#1F2937] mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6B7280]" />
                    <input
                      type="email"
                      id="edit-email"
                      name="email"
                      value={editFormData.email}
                      onChange={handleEditFormChange}
                      className="w-full h-11 pl-10 pr-4 rounded-lg border border-[#D1D5DB] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="edit-telephone" className="block text-sm font-medium text-[#1F2937] mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="edit-telephone"
                    name="telephone"
                    value={editFormData.telephone}
                    onChange={handleEditFormChange}
                    className="w-full h-11 px-4 rounded-lg border border-[#D1D5DB] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label htmlFor="edit-role" className="block text-sm font-medium text-[#1F2937] mb-1.5">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="edit-role"
                    name="role"
                    value={editFormData.role}
                    onChange={handleEditFormChange}
                    className="w-full h-11 px-4 rounded-lg border border-[#D1D5DB] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition"
                    required
                    disabled={isSubmitting}
                  >
                    <option value="EMPLOYER">Employee</option>
                    <option value="HOD">Head of Department</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-departement" className="block text-sm font-medium text-[#1F2937] mb-1.5">
                    Department
                  </label>
                  <select
                    id="edit-departement"
                    name="departement"
                    value={editFormData.departement}
                    onChange={handleEditFormChange}
                    className="w-full h-11 px-4 rounded-lg border border-[#D1D5DB] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition"
                    disabled={isSubmitting}
                  >
                    <option value="">Unassigned</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.nom_departement}>
                        {dept.nom_departement}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="edit-status" className="block text-sm font-medium text-[#1F2937] mb-1.5">
                  Account Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="edit-status"
                  name="status"
                  value={editFormData.status}
                  onChange={handleEditFormChange}
                  className="w-full h-11 px-4 rounded-lg border border-[#D1D5DB] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition"
                  required
                  disabled={isSubmitting}
                >
                  <option value="true">Active</option>
                  <option value="false">Suspended</option>
                </select>
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
                  <Save size={18} />
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      {isDeleteModalOpen && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl animate-scale-in">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Trash2 size={24} className="text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-[#1F2937]">Delete User</h2>
              </div>
              <p className="text-[#6B7280] mb-2">
                Are you sure you want to delete <span className="font-semibold text-[#1F2937]">{userToDelete.nom}</span>?
              </p>
              <p className="text-sm text-[#6B7280] mb-6">This action cannot be undone. All associated data will be permanently removed.</p>
              <div className="flex gap-3">
                <button
                  onClick={closeDeleteModal}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-[#D1D5DB] text-[#1F2937] font-medium hover:bg-gray-50 transition"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition"
                  disabled={isSubmitting}
                >
                  Delete User
                </button>
              </div>
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
    </AppLayout>
  );
};

export default UsersPage;