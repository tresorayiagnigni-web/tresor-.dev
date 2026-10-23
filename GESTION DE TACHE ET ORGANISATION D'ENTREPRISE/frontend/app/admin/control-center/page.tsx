'use client';

import React, { useCallback, useEffect, useState } from 'react';
import ProjectsAndTasks from './ProjectsAndTasks';
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
  X,
  CheckCircle,
  AlertCircle,
  UserCog,
  Eye,
  EyeOff,
  CheckSquare,
} from 'lucide-react';

import {
  type User as ApiUser,
  type UserRole,
  type UserStatus,
} from '@/lib/actions/userActions';
import { type Task } from '@/lib/actions/taskActions';
import { type Department } from '@/lib/actions/departmentActions';

import {
  fetchAllData,
  createNewUser,
  updateExistingUser,
  deleteExistingUser,
  toggleUserStatus,
  formatDate,
  showSuccess,
} from '@/lib/helpers/adminHelpers';

interface UserFormData {
  nom: string;
  email: string;
  password: string;
  role: UserRole;
  departementId: number | '';
  telephone: string;
  status: boolean;
}

const EMPTY_FORM: UserFormData = {
  nom: '',
  email: '',
  password: '',
  role: 'EMPLOYEE',
  departementId: '',
  telephone: '',
  status: true,
};

const NAVY = '#263A81';

const inputCls =
  'w-full h-11 px-4 rounded-2xl border border-[#E6E9F6] bg-white text-[#16193A] placeholder:text-[#6B73A8] focus:outline-none focus:ring-2 focus:ring-[#263A81] transition';

const selectCls =
  'h-11 px-4 rounded-full bg-white text-[#16193A] text-sm font-semibold shadow-[0_2px_12px_rgba(38,58,129,0.08)] focus:outline-none focus:ring-2 focus:ring-[#263A81] transition';

const cardShadow = 'shadow-[0_2px_12px_rgba(38,58,129,0.08)]';

// ---- Create User modal (design A · Raffiné) ----
const modalLabelCls = 'block text-xs font-semibold text-[#4A5189] mb-1.5';

const modalInputCls =
  'w-full h-11 px-3.5 rounded-xl border border-[#CFD6EE] text-sm text-[#16193A] placeholder:text-[#7A82B0] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-[#263A81] transition disabled:opacity-60';

// Lavender background once a field is filled, white otherwise
const filledBg = (value: string | number) =>
  value !== '' ? 'bg-[#EAF0FC]' : 'bg-white';

// Password strength: 0 to 4
function getPasswordStrength(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

const ROLE_COLUMNS: { key: UserRole; label: string }[] = [
  { key: 'ADMIN', label: 'Admin' },
  { key: 'HOD', label: 'HOD' },
  { key: 'EMPLOYEE', label: 'Employee' },
];

function getDepartmentId(user: any): number | null {
  const value =
    user?.departementId?.id ??
    user?.departementId ??
    user?.departmentId?.id ??
    user?.departmentId ??
    user?.departement?.id ??
    user?.department?.id;

  if (value === null || value === undefined || value === '') {
    return null;
  }

  const id = Number(value);
  return Number.isFinite(id) ? id : null;
}

function getDepartmentName(department: any): string {
  if (!department) return 'Unassigned';

  if (typeof department === 'string') return department;

  return (
    department.nom_departement ??
    department.nom ??
    department.name ??
    'Unassigned'
  );
}

function getTaskDepartmentId(task: any): number | null {
  const value =
    task?.departementId ??
    task?.departmentId ??
    task?.departement?.id ??
    task?.department?.id;

  if (value === null || value === undefined || value === '') {
    return null;
  }

  const id = Number(value);
  return Number.isFinite(id) ? id : null;
}

export default function AdminControlCenterPage() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
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
  const [formData, setFormData] = useState<UserFormData>({ ...EMPTY_FORM });
  const [editFormData, setEditFormData] =
    useState<UserFormData>({ ...EMPTY_FORM });

  const passwordStrength = getPasswordStrength(formData.password);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchAllData();

      setUsers(result.users ?? []);
      setTasks(result.tasks ?? []);
      setDepartments(result.departments ?? []);

      if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
      setError('Unable to load users, departments and tasks.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const getUserStatus = (user: ApiUser): UserStatus =>
    String(user.status) === 'false' ? 'false' : 'true';

  const getDeptLabel = (user: ApiUser): string => {
    const rawUser = user as any;
    const relation =
      rawUser.departement &&
      typeof rawUser.departement === 'object'
        ? rawUser.departement
        : rawUser.department &&
            typeof rawUser.department === 'object'
          ? rawUser.department
          : null;

    if (relation) return getDepartmentName(relation);

    const departmentId = getDepartmentId(user);

    if (departmentId === null) return 'Unassigned';

    const department = departments.find(
      (item) => Number(item.id) === departmentId,
    );

    return department
      ? getDepartmentName(department)
      : String(departmentId);
  };

  const getInitials = (name?: string) =>
    (name || 'U')
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      (user.nom || '').toLowerCase().includes(query) ||
      (user.email || '').toLowerCase().includes(query) ||
      getDeptLabel(user).toLowerCase().includes(query);

    const matchesRole =
      selectedRole === 'all' || user.role === selectedRole;

    const matchesStatus =
      selectedStatus === 'all' ||
      getUserStatus(user) === selectedStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalUsers = users.length;
  const activeUsers = users.filter(
    (user) => getUserStatus(user) === 'true',
  ).length;
  const suspendedUsers = totalUsers - activeUsers;

  const totalDepartments = departments.length;
  const totalTasks = tasks.length;

  const pendingTasks = tasks.filter(
    (task) => task.status === 'A_faire',
  ).length;

  const inProgressTasks = tasks.filter(
    (task) => task.status === 'En_cours',
  ).length;

  const completedTasks = tasks.filter(
    (task) => task.status === 'Terminer',
  ).length;

  const adminCount = users.filter(
    (user) => user.role === 'ADMIN',
  ).length;

  const hodCount = users.filter(
    (user) => user.role === 'HOD',
  ).length;

  const employeeCount = users.filter(
    (user) => user.role === 'EMPLOYEE',
  ).length;

  const departmentStats = departments.map((department) => ({
    name: department.nom_departement || 'Unnamed',
    count: users.filter(
      (user) =>
        getDepartmentId(user) === Number(department.id),
    ).length,
  }));

  const visibleColumns =
    selectedRole === 'all'
      ? ROLE_COLUMNS
      : ROLE_COLUMNS.filter((column) => column.key === selectedRole);

  const getRoleBadge = (role: UserRole) => {
    const configs: Record<
      UserRole,
      { cls: string; label: string; icon: React.ReactNode }
    > = {
      ADMIN: {
        cls: 'bg-[#263A81] text-white',
        label: 'Admin',
        icon: <Shield size={13} className="mr-1" />,
      },
      HOD: {
        cls: 'bg-[#263A81]/15 text-[#263A81]',
        label: 'HOD',
        icon: <UserCog size={13} className="mr-1" />,
      },
      EMPLOYEE: {
        cls: 'bg-[#263A81]/5 text-[#263A81]',
        label: 'Employee',
        icon: <Users size={13} className="mr-1" />,
      },
    };

    return configs[role] ?? configs.EMPLOYEE;
  };

  const getStatusBadge = (status: UserStatus) => {
    if (status === 'true') {
      return {
        cls: 'bg-[#263A81]/10 text-[#263A81]',
        label: 'Active',
        icon: <CheckCircle size={13} className="mr-1" />,
      };
    }

    return {
      cls: 'bg-white text-[#263A81] ring-1 ring-[#263A81]/30',
      label: 'Suspended',
      icon: <AlertCircle size={13} className="mr-1" />,
    };
  };

  const openCreateModal = () => {
    setFormData({ ...EMPTY_FORM });
    setShowPassword(false);
    setError(null);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    if (isSubmitting) return;
    setIsCreateModalOpen(false);
  };

  const openEditModal = (user: ApiUser) => {
    setSelectedUser(user);

    setEditFormData({
      nom: user.nom ?? '',
      email: user.email ?? '',
      password: '',
      role: user.role ?? 'EMPLOYEE',
      departementId: getDepartmentId(user) ?? '',
      telephone: user.telephone ?? '',
      status: String(user.status) !== 'false',
    });

    setError(null);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    if (isSubmitting) return;
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  const openDeleteModal = (user: ApiUser) => {
    setUserToDelete(user);
    setError(null);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (isSubmitting) return;
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const handleFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;

    setFormData((previous) => {
      if (name === 'departementId') {
        return {
          ...previous,
          departementId: value === '' ? '' : Number(value),
        };
      }

      if (name === 'role') {
        return {
          ...previous,
          role: value as UserRole,
        };
      }

      if (name === 'status') {
        return {
          ...previous,
          status: value === 'true',
        };
      }

      return { ...previous, [name]: value };
    });
  };

  const handleEditFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;

    setEditFormData((previous) => {
      if (name === 'departementId') {
        return {
          ...previous,
          departementId: value === '' ? '' : Number(value),
        };
      }

      if (name === 'role') {
        return {
          ...previous,
          role: value as UserRole,
        };
      }

      if (name === 'status') {
        return {
          ...previous,
          status: value === 'true',
        };
      }

      return { ...previous, [name]: value };
    });
  };

  const handleCreateUser = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createNewUser(formData);

      if (!result.success || !result.data) {
        setError(result.message || 'Failed to create user.');
        return;
      }

      showSuccess(
        setSuccessMessage,
        `User ${result.data.nom} created successfully!`,
      );

      setIsCreateModalOpen(false);
      setFormData({ ...EMPTY_FORM });

      await loadData();
    } catch (err) {
      console.error('Create user failed:', err);
      setError('An error occurred while creating the user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!selectedUser || selectedUser.id == null) {
      setError('No user selected for editing.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await updateExistingUser(
        selectedUser.id,
        editFormData,
      );

      if (!result.success || !result.data) {
        setError(result.message || 'Failed to update user.');
        return;
      }

      showSuccess(
        setSuccessMessage,
        `User ${result.data.nom} updated successfully!`,
      );

      setIsEditModalOpen(false);
      setSelectedUser(null);

      await loadData();
    } catch (err) {
      console.error('Update user failed:', err);
      setError('An error occurred while updating the user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete || userToDelete.id == null) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await deleteExistingUser(userToDelete.id);

      if (!result.success) {
        setError(result.message || 'Failed to delete user.');
        return;
      }

      showSuccess(
        setSuccessMessage,
        `User ${userToDelete.nom} deleted successfully!`,
      );

      setIsDeleteModalOpen(false);
      setUserToDelete(null);

      await loadData();
    } catch (err) {
      console.error('Delete user failed:', err);
      setError('An error occurred while deleting the user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (
    userId: number,
    currentStatus: UserStatus,
  ) => {
    setError(null);

    try {
      const result = await toggleUserStatus(userId, currentStatus);

      if (!result.success) {
        setError('Failed to update user status.');
        return;
      }

      showSuccess(
        setSuccessMessage,
        `User ${
          currentStatus === 'true' ? 'suspended' : 'activated'
        } successfully!`,
      );

      await loadData();
    } catch (err) {
      console.error('Toggle status failed:', err);
      setError('An error occurred while updating user status.');
    }
  };

  const Dot = ({ tone }: { tone: string }) => (
    <span
      className="inline-block w-2 h-2 rounded-full mr-1.5"
      style={{ backgroundColor: tone }}
    />
  );

  const StatCard = ({
    title,
    value,
    icon,
    children,
  }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <div className={`bg-white rounded-3xl p-5 ${cardShadow}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-[#6B73A8]">{title}</p>
          <p className="text-4xl font-extrabold text-[#16193A] mt-1">
            {value}
          </p>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-[#263A81]/10 flex items-center justify-center text-[#263A81]">
          {icon}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-x-3 gap-y-1 text-xs font-semibold text-[#6B73A8] flex-wrap">
        {children}
      </div>
    </div>
  );

  return (
    <AppLayout
      pageTitle="Admin Control Center"
      pageSubtitle="Account Provisioning, Role Allocation, and Master Identity Controls"
      showCreateButton
      onCreateClick={openCreateModal}
      createButtonText="Create User"
    >
      {successMessage && (
        <div className={`mb-6 p-4 bg-white border-l-4 border-[#263A81] rounded-2xl flex items-center gap-3 ${cardShadow}`}>
          <CheckCircle size={20} className="text-[#263A81]" />
          <span className="text-[#263A81] font-semibold">
            {successMessage}
          </span>
          <button
            type="button"
            className="ml-auto"
            onClick={() => setSuccessMessage(null)}
            aria-label="Close success message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className={`mb-6 p-4 bg-white border-l-4 border-[#263A81] rounded-2xl flex items-center gap-3 ${cardShadow}`}>
          <AlertCircle size={20} className="text-[#263A81]" />
          <span className="text-[#263A81] font-semibold">{error}</span>
          <button
            type="button"
            className="ml-auto"
            onClick={() => setError(null)}
            aria-label="Close error message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className={`bg-white rounded-3xl p-6 animate-pulse ${cardShadow}`}
            >
              <div className="h-16 bg-[#263A81]/10 rounded-2xl" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard title="Total Users" value={totalUsers} icon={<Users size={22} />}>
              <span><Dot tone={NAVY} />{activeUsers} Active</span>
              <span><Dot tone="#A9B3E8" />{suspendedUsers} Suspended</span>
            </StatCard>

            <StatCard title="Departments" value={totalDepartments} icon={<Building size={22} />}>
              {departmentStats.slice(0, 3).map((department) => (
                <span
                  key={department.name}
                  className="px-2.5 py-0.5 bg-[#F4F5FB] text-[#6B73A8] rounded-full"
                >
                  {department.name}: {department.count}
                </span>
              ))}
              {departmentStats.length > 3 && (
                <span className="px-2.5 py-0.5 bg-[#F4F5FB] text-[#6B73A8] rounded-full">
                  +{departmentStats.length - 3} more
                </span>
              )}
            </StatCard>

            <StatCard title="Role Distribution" value={totalUsers} icon={<Shield size={22} />}>
              <span><Dot tone={NAVY} />Admin: {adminCount}</span>
              <span><Dot tone="#5A6BC4" />HOD: {hodCount}</span>
              <span><Dot tone="#A9B3E8" />Emp: {employeeCount}</span>
            </StatCard>

            <StatCard title="Total Tasks" value={totalTasks} icon={<CheckSquare size={22} />}>
              <span><Dot tone="#A9B3E8" />{pendingTasks} To Do</span>
              <span><Dot tone="#5A6BC4" />{inProgressTasks} In Progress</span>
              <span><Dot tone={NAVY} />{completedTasks} Completed</span>
            </StatCard>
          </div>

          <ProjectsAndTasks
            users={users.map((user) => ({
              id: String(user.id),
              name: user.nom,
              email: user.email,
              role: user.role ?? 'EMPLOYEE',
              departmentId:
                getDepartmentId(user) == null
                  ? ''
                  : String(getDepartmentId(user)),
            }))}
            departments={departments.map((department) => ({
              id: String(department.id),
              name: department.nom_departement,
            }))}
          />

          <section className="mt-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-extrabold text-[#16193A]">
                  User Registry
                </h2>
                <span className={`text-xs font-bold text-[#6B73A8] bg-white px-3 py-1 rounded-full ${cardShadow}`}>
                  {filteredUsers.length} users
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B73A8]" />
                  <input
                    type="search"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className={`w-full sm:w-60 h-11 pl-11 pr-4 rounded-full bg-white text-sm font-semibold text-[#16193A] placeholder:text-[#6B73A8] focus:outline-none focus:ring-2 focus:ring-[#263A81] ${cardShadow}`}
                  />
                </div>

                <select
                  value={selectedRole}
                  onChange={(event) => setSelectedRole(event.target.value)}
                  className={selectCls}
                  aria-label="Filter by role"
                >
                  <option value="all">All Roles</option>
                  <option value="ADMIN">Admin</option>
                  <option value="HOD">HOD</option>
                  <option value="EMPLOYEE">Employee</option>
                </select>

                <select
                  value={selectedStatus}
                  onChange={(event) => setSelectedStatus(event.target.value)}
                  className={selectCls}
                  aria-label="Filter by status"
                >
                  <option value="all">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Suspended</option>
                </select>
              </div>
            </div>

            <div className="space-y-8">
              {visibleColumns.map((column) => {
                const columnUsers = filteredUsers.filter(
                  (user) => (user.role || 'EMPLOYEE') === column.key,
                );

                const roleConfig = getRoleBadge(column.key);

                return (
                  <div key={column.key}>
                    <div className={`mb-3 flex items-center justify-between rounded-2xl bg-white px-4 py-3 ${cardShadow}`}>
                      <span className="flex items-center gap-2 text-sm font-bold text-[#16193A]">
                        {column.label}
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${roleConfig.cls}`}>
                          {columnUsers.length}
                        </span>
                      </span>

                      {column.key === 'EMPLOYEE' && (
                        <button
                          type="button"
                          onClick={openCreateModal}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#263A81]/10 text-[#263A81] hover:bg-[#263A81] hover:text-white"
                          title="Create user"
                          aria-label="Create user"
                        >
                          <UserPlus size={15} />
                        </button>
                      )}
                    </div>

                    {columnUsers.length === 0 ? (
                      <div className="rounded-3xl border-2 border-dashed border-[#E6E9F6] py-6 text-center text-sm text-[#6B73A8]">
                        No users
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {columnUsers.map((user) => {
                          const status = getUserStatus(user);
                          const statusConfig = getStatusBadge(status);

                          return (
                            <div key={user.id} className={`rounded-3xl bg-white p-4 ${cardShadow}`}>
                              <div className="mb-3 flex flex-wrap gap-1.5">
                                <span className="inline-flex items-center rounded-full bg-[#263A81]/10 px-3 py-1 text-xs font-bold text-[#263A81]">
                                  <Building size={12} className="mr-1" />
                                  Dept: {getDeptLabel(user)}
                                </span>

                                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${statusConfig.cls}`}>
                                  {statusConfig.icon}
                                  {statusConfig.label}
                                </span>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#263A81] text-sm font-extrabold text-white">
                                  {getInitials(user.nom)}
                                </div>
                                <div className="min-w-0">
                                  <div className="truncate text-base font-extrabold text-[#16193A]">
                                    {user.nom || 'Unknown'}
                                  </div>
                                  <div className="flex items-center gap-1 text-xs text-[#6B73A8]">
                                    <Mail size={12} className="flex-shrink-0" />
                                    <span className="truncate">
                                      {user.email || 'No email'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="my-3 h-1 overflow-hidden rounded-full bg-[#E6E9F6]">
                                <div className="h-full w-full bg-[#263A81]" />
                              </div>

                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold text-[#6B73A8]">
                                  Joined: {formatDate(user.createdAt)}
                                </span>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => openEditModal(user)}
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F4F5FB] text-[#263A81] hover:bg-[#263A81] hover:text-white"
                                    title="Edit user"
                                    aria-label={`Edit ${user.nom}`}
                                  >
                                    <Edit size={15} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (user.id != null) {
                                        void handleToggleStatus(user.id, status);
                                      }
                                    }}
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F4F5FB] text-[#263A81] hover:bg-[#263A81] hover:text-white"
                                    title={status === 'true' ? 'Suspend user' : 'Activate user'}
                                    aria-label={status === 'true' ? 'Suspend user' : 'Activate user'}
                                  >
                                    {status === 'true' ? (
                                      <UserX size={15} />
                                    ) : (
                                      <UserCheck size={15} />
                                    )}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => openDeleteModal(user)}
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F4F5FB] text-[#263A81] hover:bg-[#263A81] hover:text-white"
                                    title="Delete user"
                                    aria-label={`Delete ${user.nom}`}
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mt-10">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-2xl font-extrabold text-[#16193A]">
                Department Inspector
              </h2>
              <span className={`text-xs font-bold text-[#6B73A8] bg-white px-3 py-1 rounded-full ${cardShadow}`}>
                {departments.length} departments
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.length === 0 ? (
                <div className="col-span-full text-center py-10 text-[#6B73A8] border-2 border-dashed border-[#E6E9F6] rounded-3xl">
                  <Building size={44} className="mx-auto opacity-40 mb-3" />
                  <p className="font-semibold">No departments found</p>
                  <p className="text-sm">Create a department to get started</p>
                </div>
              ) : (
                departments.map((department) => {
                  const rawDepartment = department as any;

                  const hodId = Number(
                    rawDepartment.chefDepartementId ??
                    rawDepartment.chef_DepartementId ??
                    rawDepartment.chef_departementId ??
                    rawDepartment.chef_departement?.id ??
                    0,
                  );

                  const hod = users.find(
                    (user) => Number(user.id) === hodId,
                  );

                  const departmentId = Number(department.id);

                  const departmentUsers = users.filter(
                    (user) => getDepartmentId(user) === departmentId,
                  );

                  const departmentUserIds = new Set(
                    departmentUsers.map((user) => Number(user.id)),
                  );

                  const taskCount = tasks.filter((task) => {
                    const rawTask = task as any;

                    const assignedUserId = Number(
                      rawTask.userId ??
                      rawTask.assignedTo ??
                      rawTask.user?.id ??
                      0,
                    );

                    const taskDeptId = getTaskDepartmentId(rawTask);

                    return taskDeptId !== null
                      ? taskDeptId === departmentId
                      : departmentUserIds.has(assignedUserId);
                  }).length;

                  return (
                    <div key={department.id} className={`bg-white rounded-3xl p-5 ${cardShadow}`}>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-extrabold text-[#16193A]">
                            {department.nom_departement || 'Unnamed'}
                          </h3>
                          <p className="text-xs text-[#6B73A8]">
                            ID: {department.id}
                          </p>
                        </div>

                        <div className="w-10 h-10 rounded-2xl bg-[#263A81]/10 flex items-center justify-center text-[#263A81]">
                          <Building size={18} />
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[#6B73A8]">Head of Department</span>
                          <span className="font-bold text-[#16193A] text-right">
                            {hod?.nom || 'Unassigned'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-[#6B73A8]">Members</span>
                          <span className="font-bold text-[#16193A]">
                            {departmentUsers.length}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-[#6B73A8]">Tasks</span>
                          <span className="font-bold text-[#16193A]">
                            {taskCount}
                          </span>
                        </div>
                      </div>

                      {rawDepartment.description && (
                        <div className="mt-3 pt-3 border-t border-[#E6E9F6]">
                          <p className="text-xs text-[#6B73A8]">
                            {rawDepartment.description}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </>
      )}

      {/* CREATE USER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#16193A]/50 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-user-title"
            className="bg-white rounded-3xl w-full max-w-[680px] max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white flex items-center gap-3.5 px-7 py-6 border-b border-[#E6E9F6]">
              <div className="w-11 h-11 flex-shrink-0 rounded-xl bg-[#E8EBF5] flex items-center justify-center text-[#263A81]">
                <UserPlus size={22} />
              </div>

              <div className="flex-1 min-w-0">
                <h2
                  id="create-user-title"
                  className="text-lg font-extrabold text-[#16193A]"
                >
                  Create New User
                </h2>
                <p className="text-[13px] text-[#5B6399]">
                  Add a new user to your organization
                </p>
              </div>

              <button
                type="button"
                onClick={closeCreateModal}
                disabled={isSubmitting}
                aria-label="Close modal"
                className="w-9 h-9 flex items-center justify-center rounded-full text-[#5B6399] hover:bg-[#EAF0FC] hover:text-[#263A81] transition disabled:opacity-60"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateUser} className="px-7 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
                {/* Full name */}
                <div>
                  <label htmlFor="nom" className={modalLabelCls}>
                    Full Name *
                  </label>
                  <input
                    id="nom"
                    name="nom"
                    type="text"
                    autoComplete="name"
                    placeholder="e.g. Jane Doe"
                    value={formData.nom}
                    onChange={handleFormChange}
                    className={`${modalInputCls} ${filledBg(formData.nom)}`}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className={modalLabelCls}>
                    Email Address *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={handleFormChange}
                    className={`${modalInputCls} ${filledBg(formData.email)}`}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="telephone" className={modalLabelCls}>
                    Phone Number
                  </label>
                  <input
                    id="telephone"
                    name="telephone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+237 6XX XXX XXX"
                    value={formData.telephone}
                    onChange={handleFormChange}
                    className={`${modalInputCls} ${filledBg(formData.telephone)}`}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Password + strength bar */}
                <div>
                  <label htmlFor="password" className={modalLabelCls}>
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={handleFormChange}
                      className={`${modalInputCls} ${filledBg(formData.password)} pr-12`}
                      required
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#5B6399] hover:text-[#263A81]"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <div
                    className="flex gap-1 mt-2"
                    role="img"
                    aria-label={`Password strength: ${passwordStrength} out of 4`}
                  >
                    {[1, 2, 3, 4].map((level) => (
                      <span
                        key={level}
                        className={`flex-1 h-1 rounded-full transition-colors ${
                          level <= passwordStrength ? 'bg-[#263A81]' : 'bg-[#CFD6EE]'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label htmlFor="role" className={modalLabelCls}>
                    Role *
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleFormChange}
                    className={`${modalInputCls} bg-white`}
                    required
                    disabled={isSubmitting}
                  >
                    <option value="EMPLOYEE">Employee</option>
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label htmlFor="departementId" className={modalLabelCls}>
                    Department
                  </label>
                  <select
                    id="departementId"
                    name="departementId"
                    value={formData.departementId}
                    onChange={handleFormChange}
                    className={`${modalInputCls} bg-white`}
                    disabled={isSubmitting}
                  >
                    <option value="">Choose a department</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.nom_departement}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 pt-6 border-t border-[#E6E9F6] flex flex-col-reverse sm:grid sm:grid-cols-2 gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={isSubmitting}
                  className="h-12 rounded-full border border-[#B9C2E3] bg-white text-sm font-bold text-[#263A81] hover:bg-[#EAF0FC] transition disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-12 rounded-full bg-[#263A81] text-sm font-bold text-white hover:bg-[#1E2F6B] transition disabled:opacity-60"
                >
                  {isSubmitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#16193A]/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-[#E6E9F6] p-6 flex items-center justify-between z-10 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#263A81]/10 flex items-center justify-center text-[#263A81]">
                  <Edit size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-[#16193A]">
                    Edit User
                  </h2>
                  <p className="text-sm text-[#6B73A8]">
                    Update {selectedUser.nom}
                  </p>
                </div>
              </div>

              <button type="button" onClick={closeEditModal} disabled={isSubmitting} aria-label="Close modal">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditUser} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-nom" className="block text-sm font-semibold mb-1.5">
                    Full Name *
                  </label>
                  <input
                    id="edit-nom"
                    name="nom"
                    value={editFormData.nom}
                    onChange={handleEditFormChange}
                    className={inputCls}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label htmlFor="edit-email" className="block text-sm font-semibold mb-1.5">
                    Email Address *
                  </label>
                  <input
                    id="edit-email"
                    name="email"
                    type="email"
                    value={editFormData.email}
                    onChange={handleEditFormChange}
                    className={inputCls}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label htmlFor="edit-telephone" className="block text-sm font-semibold mb-1.5">
                    Phone Number
                  </label>
                  <input
                    id="edit-telephone"
                    name="telephone"
                    type="tel"
                    value={editFormData.telephone}
                    onChange={handleEditFormChange}
                    className={inputCls}
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label htmlFor="edit-role" className="block text-sm font-semibold mb-1.5">
                    Role *
                  </label>
                  <select
                    id="edit-role"
                    name="role"
                    value={editFormData.role}
                    onChange={handleEditFormChange}
                    className={inputCls}
                    required
                    disabled={isSubmitting}
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="HOD">Head of Department</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-departementId" className="block text-sm font-semibold mb-1.5">
                    Department
                  </label>
                  <select
                    id="edit-departementId"
                    name="departementId"
                    value={editFormData.departementId}
                    onChange={handleEditFormChange}
                    className={inputCls}
                    disabled={isSubmitting}
                  >
                    <option value="">Unassigned</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.nom_departement}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-status" className="block text-sm font-semibold mb-1.5">
                    Status *
                  </label>
                  <select
                    id="edit-status"
                    name="status"
                    value={editFormData.status ? 'true' : 'false'}
                    onChange={handleEditFormChange}
                    className={inputCls}
                    required
                    disabled={isSubmitting}
                  >
                    <option value="true">Active</option>
                    <option value="false">Suspended</option>
                  </select>
                </div>
              </div>

              <p className="text-xs text-[#6B73A8]">
                Leave the password unchanged when editing user information.
              </p>

              <div className="flex gap-3 pt-4 border-t border-[#E6E9F6]">
                <button type="button" onClick={closeEditModal} className="flex-1 px-4 py-3 rounded-full border border-[#263A81]/30 text-[#263A81] font-semibold" disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-3 bg-[#263A81] text-white font-bold rounded-full disabled:opacity-60" disabled={isSubmitting}>
                  {isSubmitting ? 'Updating...' : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE USER MODAL */}
      {isDeleteModalOpen && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#16193A]/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-[#E6E9F6]">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#263A81]/10 flex items-center justify-center text-[#263A81]">
                  <Trash2 size={22} />
                </div>
                <h2 className="text-xl font-extrabold text-[#16193A]">
                  Delete User
                </h2>
              </div>
            </div>

            <div className="p-6">
              <p className="text-[#16193A] mb-2">
                Are you sure you want to delete{' '}
                <span className="font-bold">{userToDelete.nom}</span>?
              </p>
              <p className="text-sm text-[#6B73A8]">
                This action cannot be undone. If the user has related projects
                or tasks, the backend may prevent deletion until those
                dependencies are handled.
              </p>
            </div>

            <div className="flex gap-3 p-6 pt-0">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="flex-1 px-4 py-3 rounded-full border border-[#263A81]/30 text-[#263A81] font-semibold"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteUser()}
                className="flex-1 px-4 py-3 bg-[#263A81] text-white font-bold rounded-full disabled:opacity-60"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Deleting...' : 'Delete User'}
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
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </AppLayout>
  );
}
