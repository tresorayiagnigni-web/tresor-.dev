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
  departementId: number | '';
  password: string;
}

interface EditUserFormData {
  nom: string;
  email: string;
  telephone: string;
  role: UserRole;
  departementId: number | '';
  status: UserStatus;
}

// ===== MAIN COMPONENT =====
export default function UsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState<ApiUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<ApiUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState<CreateUserFormData>({
    nom: '',
    email: '',
    telephone: '',
    role: 'EMPLOYEE',
    departementId: '',
    password: '',
  });

  const [editFormData, setEditFormData] = useState<EditUserFormData>({
    nom: '',
    email: '',
    telephone: '',
    role: 'EMPLOYEE',
    departementId: '',
    status: 'true',
  });

  // ===== LOAD DATA =====
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [userResult, deptResult] = await Promise.all([
          getUsers(),
          getDepartments(),
        ]);

        if (cancelled) return;

        if (userResult.success && userResult.data) {
          setUsers(userResult.data);
        } else {
          setError(userResult.message || 'Failed to load users');
          setUsers([]);
        }

        if (deptResult.success && deptResult.data) {
          setDepartments(deptResult.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load data',
          );
          setUsers([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const reloadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [userResult, deptResult] = await Promise.all([
        getUsers(),
        getDepartments(),
      ]);

      if (userResult.success && userResult.data) {
        setUsers(userResult.data);
      } else {
        setError(userResult.message || 'Failed to load users');
        setUsers([]);
      }

      if (deptResult.success && deptResult.data) {
        setDepartments(deptResult.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== DERIVED STATE =====
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.nom || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      ((user as any).departement || '')
        .toString()
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesRole = selectedRole === 'all' || user.role === selectedRole;

    const userStatus =
      user.status === 'true' || user.status === true ? 'true' : 'false';
    const matchesStatus =
      selectedStatus === 'all' || userStatus === selectedStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // ===== STATS =====
  const totalUsers = users.length;
  const activeUsers = users.filter(
    (u) => u.status === 'true' || u.status === true,
  ).length;
  const suspendedUsers = users.filter(
    (u) => u.status === 'false' || u.status === false,
  ).length;
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const hodCount = users.filter((u) => u.role === 'HOD').length;
  const employeeCount = users.filter((u) => u.role === 'EMPLOYEE').length;

  // ===== HELPERS =====
  const getRoleBadge = (role: UserRole | undefined) => {
    const config = {
      ADMIN: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        icon: <Shield size={14} className="mr-1" />,
        label: 'Admin',
      },
      HOD: {
        bg: 'bg-purple-100',
        text: 'text-purple-800',
        icon: <UserCog size={14} className="mr-1" />,
        label: 'HOD',
      },
      EMPLOYEE: {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        icon: <Users size={14} className="mr-1" />,
        label: 'Employee',
      },
    };
    return config[role || 'EMPLOYEE'];
  };

  const getStatusBadge = (status: UserStatus | boolean | undefined) => {
    const isActive = status === 'true' || status === true;
    const isSuspended = status === 'false' || status === false;

    if (isActive) {
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: <CheckCircle size={14} className="mr-1" />,
        label: 'Active',
      };
    }
    if (isSuspended) {
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: <AlertCircle size={14} className="mr-1" />,
        label: 'Suspended',
      };
    }
    return {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      icon: <Clock size={14} className="mr-1" />,
      label: 'Pending',
    };
  };

  const navigateToUserProfile = (userId: number) => {
    router.push(`/admin/users/${userId}`);
  };

  const getDepartmentName = (user: ApiUser) => {
    if ((user as any).departement?.nom_departement) {
      return (user as any).departement.nom_departement;
    }
    if (typeof (user as any).departement === 'string') {
      return (user as any).departement;
    }
    const deptId = (user as any).departementId ?? (user as any).departmentId;
    if (deptId != null) {
      const found = departments.find((d) => Number(d.id) === Number(deptId));
      if (found) return found.nom_departement;
    }
    return 'Unassigned';
  };

  // ===== CREATE HANDLERS =====
  const openCreateModal = () => {
    setFormData({
      nom: '',
      email: '',
      telephone: '',
      role: 'EMPLOYEE',
      departementId: '',
      password: '',
    });
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => setIsCreateModalOpen(false);

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'departementId' ? (value === '' ? '' : Number(value)) : value,
    }));
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
      departementId: formData.departementId === '' ? undefined : formData.departementId,
      telephone: formData.telephone,
      status: 'true',
    });

    if (result.success && result.data) {
      showSuccess(
        setSuccessMessage,
        `User ${result.data.nom} created successfully!`,
      );
      closeCreateModal();
      await reloadData();
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
      telephone: (user as any).telephone || '',
      role: user.role || 'EMPLOYEE',
      departementId:
        (user as any).departementId ??
        (user as any).departmentId ??
        '',
      status:
        user.status === 'true' || user.status === true ? 'true' : 'false',
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  const handleEditFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]:
        name === 'departementId' ? (value === '' ? '' : Number(value)) : value,
    }));
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
      departementId:
        editFormData.departementId === ''
          ? undefined
          : editFormData.departementId,
      telephone: editFormData.telephone,
      status: editFormData.status,
    });

    if (result.success && result.data) {
      showSuccess(
        setSuccessMessage,
        `User ${result.data.nom} updated successfully!`,
      );
      closeEditModal();
      await reloadData();
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
      showSuccess(
        setSuccessMessage,
        `User ${userToDelete.nom} deleted successfully!`,
      );
      closeDeleteModal();
      await reloadData();
    } else {
      setError(result.message || 'Failed to delete user');
    }
    setIsSubmitting(false);
  };

  // ===== STATUS TOGGLE =====
  const handleToggleStatus = async (userId: number) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    const currentStatus = user.status === 'true' || user.status === true;
    const newStatus = currentStatus ? 'false' : 'true';

    const result = await updateUser(userId, {
      status: newStatus as UserStatus,
    });

    if (result.success) {
      showSuccess(
        setSuccessMessage,
        `User ${user.nom} ${
          newStatus === 'true' ? 'activated' : 'suspended'
        } successfully!`,
      );
      await reloadData();
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
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
          <CheckCircle size={20} className="text-green-600" />
          <span className="font-medium text-green-800">{successMessage}</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle size={20} className="text-red-600" />
          <span className="font-medium text-red-800">{error}</span>
        </div>
      )}

      {/* Loading / Stats */}
      {isLoading ? (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm"
            >
              <div className="h-16 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#6B7280]">Total Users</p>
                <p className="mt-1 text-3xl font-bold text-[#1F2937]">
                  {totalUsers}
                </p>
              </div>
              <div className="rounded-lg bg-[#263A81]/10 p-3">
                <Users size={24} className="text-[#263A81]" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-green-600">
                ● {activeUsers} Active
              </span>
              <span className="flex items-center gap-1 text-red-600">
                ● {suspendedUsers} Suspended
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#6B7280]">Departments</p>
                <p className="mt-1 text-3xl font-bold text-[#1F2937]">
                  {departments.length}
                </p>
              </div>
              <div className="rounded-lg bg-blue-100 p-3">
                <Building size={24} className="text-blue-600" />
              </div>
            </div>
            <div className="mt-4 text-xs text-[#6B7280]">
              Across all departments
            </div>
          </div>

          <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#6B7280]">Admin Users</p>
                <p className="mt-1 text-3xl font-bold text-[#1F2937]">
                  {adminCount}
                </p>
              </div>
              <div className="rounded-lg bg-purple-100 p-3">
                <Shield size={24} className="text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-purple-500" />
                HOD: {hodCount}
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-gray-500" />
                Emp: {employeeCount}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
        <div className="border-b border-[#E5E7EB] p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Users size={24} className="text-[#263A81]" />
              <h2 className="text-xl font-bold text-[#1F2937]">All Users</h2>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-[#6B7280]">
                {filteredUsers.length} users
              </span>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]"
                />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-[#FEFEFC] pl-10 pr-4 text-[#1F2937] transition placeholder:text-[#6B7280] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#263A81] sm:w-52"
                />
              </div>

              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-[#FEFEFC] px-4 text-[#1F2937] transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#263A81] sm:w-36"
              >
                <option value="all">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="HOD">HOD</option>
                <option value="EMPLOYEE">Employee</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-[#FEFEFC] px-4 text-[#1F2937] transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#263A81] sm:w-36"
              >
                <option value="all">All Status</option>
                <option value="true">Active</option>
                <option value="false">Suspended</option>
              </select>

              <button
                type="button"
                onClick={openCreateModal}
                className="hidden items-center gap-2 rounded-lg bg-[#263A81] px-4 py-2 font-medium text-white shadow-lg shadow-[#263A81]/20 transition hover:bg-[#1e2f6a] active:scale-95 lg:flex"
              >
                <UserPlus size={18} />
                <span>Create User</span>
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-gray-50/70">
                <th className="px-6 py-3.5 text-left font-semibold tracking-wide text-[#6B7280]">
                  User
                </th>
                <th className="px-6 py-3.5 text-left font-semibold tracking-wide text-[#6B7280]">
                  Role
                </th>
                <th className="px-6 py-3.5 text-left font-semibold tracking-wide text-[#6B7280]">
                  Department
                </th>
                <th className="px-6 py-3.5 text-left font-semibold tracking-wide text-[#6B7280]">
                  Status
                </th>
                <th className="px-6 py-3.5 text-left font-semibold tracking-wide text-[#6B7280]">
                  Joined
                </th>
                <th className="px-6 py-3.5 text-right font-semibold tracking-wide text-[#6B7280]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-[#6B7280]">
                    <div className="flex flex-col items-center gap-3">
                      <Users size={56} className="text-[#6B7280] opacity-30" />
                      <p className="text-lg font-medium">No users found</p>
                      <p className="text-sm">
                        Try adjusting your search or filters
                      </p>
                      <button
                        type="button"
                        onClick={openCreateModal}
                        className="mt-2 flex items-center gap-2 rounded-lg bg-[#263A81] px-6 py-2.5 font-medium text-white transition hover:bg-[#1e2f6a]"
                      >
                        <UserPlus size={18} />
                        Create your first user
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const userStatus =
                    user.status === 'true' || user.status === true
                      ? 'true'
                      : 'false';
                  const roleConfig = getRoleBadge(user.role);
                  const statusConfig = getStatusBadge(userStatus);

                  return (
                    <tr
                      key={user.id}
                      className="group cursor-pointer transition duration-150 hover:bg-gray-50/50"
                      onClick={() => navigateToUserProfile(Number(user.id))}
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#263A81]/10 text-sm font-semibold text-[#263A81]">
                            {user.nom
                              ?.split(' ')
                              .map((n) => n[0])
                              .join('') || 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 font-medium text-[#1F2937] transition-colors group-hover:text-[#263A81]">
                              {user.nom || 'Unknown'}
                              <ArrowRight
                                size={14}
                                className="text-[#263A81] opacity-0 transition-opacity group-hover:opacity-100"
                              />
                            </div>
                            <div className="flex items-center gap-1 text-xs text-[#6B7280]">
                              <Mail size={12} />
                              <span>{user.email || 'No email'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${roleConfig.bg} ${roleConfig.text}`}
                        >
                          {roleConfig.icon}
                          {roleConfig.label}
                        </span>
                      </td>

                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Building size={14} className="text-[#6B7280]" />
                          <span className="text-[#1F2937]">
                            {getDepartmentName(user)}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}
                        >
                          {statusConfig.icon}
                          {statusConfig.label}
                        </span>
                      </td>

                      <td className="px-6 py-3.5 text-xs text-[#6B7280]">
                        {formatDate((user as any).createdAt)}
                      </td>

                      <td className="px-6 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(user);
                            }}
                            className="rounded-lg p-1.5 transition hover:bg-blue-50"
                            title="Edit user"
                          >
                            <Edit
                              size={16}
                              className="text-blue-500 hover:text-blue-700"
                            />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStatus(Number(user.id));
                            }}
                            className="rounded-lg p-1.5 transition hover:bg-gray-100"
                            title={
                              userStatus === 'true'
                                ? 'Suspend user'
                                : 'Activate user'
                            }
                          >
                            {userStatus === 'true' ? (
                              <UserX
                                size={16}
                                className="text-red-400 hover:text-red-600"
                              />
                            ) : (
                              <UserCheck
                                size={16}
                                className="text-green-400 hover:text-green-600"
                              />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteModal(user);
                            }}
                            className="rounded-lg p-1.5 transition hover:bg-red-50"
                            title="Delete user"
                          >
                            <Trash2
                              size={16}
                              className="text-red-400 hover:text-red-600"
                            />
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

        <div className="flex items-center justify-between border-t border-[#E5E7EB] bg-gray-50/50 p-4">
          <div className="text-xs text-[#6B7280]">
            Showing {filteredUsers.length} of {users.length} users
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-lg bg-[#263A81] px-4 py-2 font-medium text-white shadow-lg shadow-[#263A81]/20 transition hover:bg-[#1e2f6a] active:scale-95 lg:hidden"
          >
            <UserPlus size={18} />
            <span>Create User</span>
          </button>
        </div>
      </div>

      {/* ===== CREATE USER MODAL ===== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E5E7EB] bg-white p-6">
              <div className="flex items-center gap-3">
                <UserPlus size={24} className="text-[#263A81]" />
                <div>
                  <h2 className="text-xl font-bold text-[#1F2937]">
                    Create New User
                  </h2>
                  <p className="text-sm text-[#6B7280]">
                    Add a new user to your organization
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeCreateModal}
                className="rounded-lg p-2 transition hover:bg-gray-100"
              >
                <X size={20} className="text-[#6B7280]" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-5 p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#1F2937]">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleFormChange}
                    placeholder="Enter full name"
                    className="h-11 w-full rounded-lg border border-[#D1D5DB] bg-white px-4 text-[#1F2937] transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#263A81]"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#1F2937]">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]"
                    />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      placeholder="user@company.com"
                      className="h-11 w-full rounded-lg border border-[#D1D5DB] bg-white pl-10 pr-4 text-[#1F2937] transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#263A81]"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#1F2937]">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleFormChange}
                    placeholder="+237 6XX XXX XXX"
                    className="h-11 w-full rounded-lg border border-[#D1D5DB] bg-white px-4 text-[#1F2937] transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#263A81]"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#1F2937]">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Key
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]"
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleFormChange}
                      placeholder="Set a password"
                      className="h-11 w-full rounded-lg border border-[#D1D5DB] bg-white pl-10 pr-12 text-[#1F2937] transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#263A81]"
                      required
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] transition hover:text-[#1F2937]"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#1F2937]">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleFormChange}
                    className="h-11 w-full rounded-lg border border-[#D1D5DB] bg-white px-4 text-[#1F2937] transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#263A81]"
                    required
                    disabled={isSubmitting}
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="HOD">Head of Department</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#1F2937]">
                    Department
                  </label>
                  <select
                    name="departementId"
                    value={formData.departementId}
                    onChange={handleFormChange}
                    className="h-11 w-full rounded-lg border border-[#D1D5DB] bg-white px-4 text-[#1F2937] transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#263A81]"
                    disabled={isSubmitting}
                  >
                    <option value="">Unassigned</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.nom_departement}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 border-t border-[#E5E7EB] pt-4">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="flex-1 rounded-lg border border-[#D1D5DB] px-4 py-2.5 font-medium text-[#1F2937] transition hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#263A81] px-4 py-2.5 font-bold text-white transition hover:bg-[#1e2f6a] active:scale-95"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E5E7EB] bg-white p-6">
              <div className="flex items-center gap-3">
                <Edit size={24} className="text-[#263A81]" />
                <div>
                  <h2 className="text-xl font-bold text-[#1F2937]">Edit User</h2>
                  <p className="text-sm text-[#6B7280]">
                    Update user information for {selectedUser.nom}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-lg p-2 transition hover:bg-gray-100"
              >
                <X size={20} className="text-[#6B7280]" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-5 p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#1F2937]">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nom"
                    value={editFormData.nom}
                    onChange={handleEditFormChange}
                    className="h-11 w-full rounded-lg border border-[#D1D5DB] bg-white px-4 text-[#1F2937] transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#263A81]"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#1F2937]">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]"
                    />
                    <input
                      type="email"
                      name="email"
                      value={editFormData.email}
                      onChange={handleEditFormChange}
                      className="h-11 w-full rounded-lg border border-[#D1D5DB] bg-white pl-10 pr-4 text-[#1F2937] transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#263A81]"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#1F2937]">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="telephone"
                    value={editFormData.telephone}
                    onChange={handleEditFormChange}
                    className="h-11 w-full rounded-lg border border-[#D1D5DB] bg-white px-4 text-[#1F2937] transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#263A81]"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#1F2937]">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="role"
                    value={editFormData.role}
                    onChange={handleEditFormChange}
                    className="h-11 w-full rounded-lg border border-[#D1D5DB] bg-white px-4 text-[#1F2937] transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#263A81]"
                    required
                    disabled={isSubmitting}
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="HOD">Head of Department</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#1F2937]">
                    Department
                  </label>
                  <select
                    name="departementId"
                    value={editFormData.departementId}
                    onChange={handleEditFormChange}
                    className="h-11 w-full rounded-lg border border-[#D1D5DB] bg-white px-4 text-[#1F2937] transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#263A81]"
                    disabled={isSubmitting}
                  >
                    <option value="">Unassigned</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.nom_departement}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#1F2937]">
                  Account Status <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={editFormData.status}
                  onChange={handleEditFormChange}
                  className="h-11 w-full rounded-lg border border-[#D1D5DB] bg-white px-4 text-[#1F2937] transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#263A81]"
                  required
                  disabled={isSubmitting}
                >
                  <option value="true">Active</option>
                  <option value="false">Suspended</option>
                </select>
              </div>

              <div className="flex gap-3 border-t border-[#E5E7EB] pt-4">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 rounded-lg border border-[#D1D5DB] px-4 py-2.5 font-medium text-[#1F2937] transition hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#263A81] px-4 py-2.5 font-bold text-white transition hover:bg-[#1e2f6a] active:scale-95"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
            <div className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-red-100 p-2">
                  <Trash2 size={24} className="text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-[#1F2937]">Delete User</h2>
              </div>
              <p className="mb-2 text-[#6B7280]">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-[#1F2937]">
                  {userToDelete.nom}
                </span>
                ?
              </p>
              <p className="mb-6 text-sm text-[#6B7280]">
                This action cannot be undone. All associated data will be
                permanently removed.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className="flex-1 rounded-lg border border-[#D1D5DB] px-4 py-2.5 font-medium text-[#1F2937] transition hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteUser}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 font-bold text-white transition hover:bg-red-700"
                  disabled={isSubmitting}
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}