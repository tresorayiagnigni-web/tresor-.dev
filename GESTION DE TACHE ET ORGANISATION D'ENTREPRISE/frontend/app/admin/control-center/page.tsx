'use client';

import ProjectsAndTasks from "./ProjectsAndTasks";
import React, { useState, useEffect } from 'react';
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
  Key,
  Eye,
  EyeOff,
  CheckSquare,
  User,
} from 'lucide-react';
import { type User as ApiUser, type UserRole } from '@/lib/actions/userActions';
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
import { type UserStatus } from '@/lib/actions/userActions';

// ========== TYPE DEFINITIONS ==========
interface UserFormData {
  nom: string;
  email: string;
  password: string;
  role: UserRole;
  departementId: number | '';
  telephone: string;
  status: boolean;
}

// ========== DESIGN TOKENS (white + navy only) ==========
const NAVY = '#263A81';
const inputCls =
  'w-full h-11 px-4 rounded-2xl border border-[#E6E9F6] bg-white text-[#16193A] placeholder:text-[#6B73A8] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition';
const selectCls =
  'h-11 px-4 rounded-full bg-white text-[#16193A] text-sm font-semibold shadow-[0_2px_12px_rgba(38,58,129,0.08)] focus:outline-none focus:ring-2 focus:ring-[#263A81] transition';
const cardShadow = 'shadow-[0_2px_12px_rgba(38,58,129,0.08)]';

const ROLE_COLUMNS: { key: UserRole; label: string }[] = [
  { key: 'ADMIN', label: 'Admin' },
  { key: 'HOD', label: 'HOD' },
  { key: 'EMPLOYEE', label: 'Employee' },
];

// ========== MAIN COMPONENT ==========
const AdminControlCenterPage = () => {
  // ========== STATE MANAGEMENT ==========
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<ApiUser | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Form data
  const [formData, setFormData] = useState<UserFormData>({
    nom: '',
    email: '',
    password: '',
    role: 'EMPLOYEE',
    departementId: '',
    telephone: '',
    status: true,
  });

  const [editFormData, setEditFormData] = useState<UserFormData>({
    nom: '',
    email: '',
    password: '',
    role: 'EMPLOYEE',
    departementId: '',
    telephone: '',
    status: true,
  });

  // ========== LOAD DATA ==========
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    const result = await fetchAllData();
    setUsers(result.users);
    setTasks(result.tasks);
    setDepartments(result.departments);
    if (result.error) setError(result.error);
    setIsLoading(false);
  };

  useEffect(() => {
    let cancelled = false;

    const initialLoad = async () => {
      setIsLoading(true);
      const result = await fetchAllData();
      if (cancelled) return;

      setUsers(result.users);
      setTasks(result.tasks);
      setDepartments(result.departments);
      if (result.error) setError(result.error);
      setIsLoading(false);
    };
    initialLoad();
    return () => {
      cancelled = true;
    };
  }, []);

  // ========== HELPERS ==========
  // Status can come back as boolean or as 'true' / 'false' string
  const getUserStatus = (user: ApiUser): UserStatus =>
    String(user.status) === 'false' ? 'false' : 'true';

  const getDeptLabel = (user: ApiUser): string => {
    const raw: any = user.departementId;
    if (typeof raw === 'number') {
      const dept = departments.find((d) => d.id === raw);
      return dept?.nom_departement || String(raw);
    }
    return raw?.nom || raw?.name || raw?.departementId || 'Unassigned';
  };

  const getInitials = (name?: string) =>
    (name || 'U')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  // ========== DERIVED STATE ==========
  const filteredUsers = users.filter((user) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (user.nom || '').toLowerCase().includes(q) ||
      (user.email || '').toLowerCase().includes(q) ||
      String(getDeptLabel(user)).toLowerCase().includes(q);
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || getUserStatus(user) === selectedStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Stats calculations
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => getUserStatus(u) === 'true').length;
  const suspendedUsers = users.filter((u) => getUserStatus(u) === 'false').length;
  const totalDepartments = departments.length;
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter((t) => t.status === 'A_faire').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'En_cours').length;
  const completedTasks = tasks.filter((t) => t.status === 'Terminer').length;

  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const hodCount = users.filter((u) => u.role === 'HOD').length;
  const employeeCount = users.filter((u) => u.role === 'EMPLOYEE').length;

  const departmentStats = departments.map((dept) => ({
    name: dept.nom_departement || 'Unnamed',
    count: users.filter((u) => u.departementId === dept.id).length,
    hod: users.find((u) => u.id === dept.chef_DepartementId)?.nom,
  }));

  const visibleColumns =
    selectedRole === 'all' ? ROLE_COLUMNS : ROLE_COLUMNS.filter((c) => c.key === selectedRole);
  const boardCols =
    visibleColumns.length === 1
      ? 'lg:grid-cols-1'
      : visibleColumns.length === 2
      ? 'lg:grid-cols-2'
      : 'lg:grid-cols-3';

  // ========== BADGES (navy tints only) ==========
  const getRoleBadge = (role: UserRole) => {
    const config = {
      ADMIN: {
        cls: 'bg-[#263A81] text-white',
        icon: <Shield size={13} className="mr-1" />,
        label: 'Admin',
      },
      HOD: {
        cls: 'bg-[#263A81]/15 text-[#263A81]',
        icon: <UserCog size={13} className="mr-1" />,
        label: 'HOD',
      },
      EMPLOYEE: {
        cls: 'bg-[#263A81]/5 text-[#263A81]',
        icon: <User size={13} className="mr-1" />,
        label: 'Employee',
      },
    };
    return config[role] || config.EMPLOYEE;
  };

  const getStatusBadge = (status: UserStatus) => {
    const config: Record<UserStatus, { cls: string; icon: React.ReactNode; label: string }> = {
      true: {
        cls: 'bg-[#263A81]/10 text-[#263A81]',
        icon: <CheckCircle size={13} className="mr-1" />,
        label: 'Active',
      },
      false: {
        cls: 'bg-white text-[#263A81] ring-1 ring-[#263A81]/30',
        icon: <AlertCircle size={13} className="mr-1" />,
        label: 'Suspended',
      },
    };
    return config[status];
  };

  // ========== MODAL HANDLERS ==========
  const openCreateModal = () => {
    setFormData({
      nom: '',
      email: '',
      password: '',
      role: 'EMPLOYEE',
      departementId: '',
      telephone: '',
      status: true,
    });
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const openEditModal = (user: ApiUser) => {
    setSelectedUser(user);

    setEditFormData({
      nom: user.nom || '',
      email: user.email || '',
      password: '',
      role: user.role || 'EMPLOYEE',
      departementId:
        typeof user.departementId === 'number'
          ? user.departementId
          : (user.departement as any)?.departementId ?? '',
      telephone: user.telephone || '',
      status: Boolean(user.status),
    });

    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  const openDeleteModal = (user: ApiUser) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  // ========== CRUD OPERATIONS ==========
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const result = await createNewUser(formData);
    if (result.success && result.data) {
      setUsers([result.data, ...users]);
      showSuccess(setSuccessMessage, `User ${result.data.nom} created successfully!`);
      closeCreateModal();
      loadData();
    } else {
      setError(result.message || 'Failed to create user');
    }
    setIsSubmitting(false);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSubmitting(true);
    setError(null);

    const result = await updateExistingUser(selectedUser.id!, editFormData);
    if (result.success && result.data) {
      setUsers(users.map((user) => (user.id === selectedUser.id ? result.data! : user)));
      showSuccess(setSuccessMessage, `User ${result.data.nom} updated successfully!`);
      closeEditModal();
      loadData();
    } else {
      setError(result.message || 'Failed to update user');
    }
    setIsSubmitting(false);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsSubmitting(true);
    setError(null);

    const result = await deleteExistingUser(userToDelete.id!);
    if (result.success) {
      setUsers(users.filter((user) => user.id !== userToDelete.id));
      showSuccess(setSuccessMessage, `User ${userToDelete.nom} deleted successfully!`);
      closeDeleteModal();
      loadData();
    } else {
      setError(result.message || 'Failed to delete user');
    }
    setIsSubmitting(false);
  };

  const handleToggleStatus = async (userId: number, currentStatus: UserStatus) => {
    const result = await toggleUserStatus(userId, currentStatus);
    if (result.success && result.data) {
      setUsers(users.map((user) => (user.id === userId ? result.data! : user)));
      const newStatus = currentStatus === 'true' ? 'false' : 'true';
      showSuccess(setSuccessMessage, `User ${newStatus === 'true' ? 'activated' : 'suspended'} successfully!`);
    } else {
      setError('Failed to update user status');
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: name === 'departementId' ? (value === '' ? '' : Number(value)) : value }));
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: name === 'departementId' ? (value === '' ? '' : Number(value)) : value,
    }));
  };

  // ========== SMALL UI PIECES ==========
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
          <p className="text-4xl font-extrabold text-[#16193A] mt-1">{value}</p>
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

  const Dot = ({ tone }: { tone: string }) => (
    <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: tone }} />
  );

  // ========== RENDER ==========
  return (
    <AppLayout
      pageTitle="Admin Control Center"
      pageSubtitle="Account Provisioning, Role Allocation, and Master Identity Controls"
      showCreateButton={true}
      onCreateClick={openCreateModal}
      createButtonText="Create User"
    >
      {/* Success Banner */}
      {successMessage && (
        <div className={`mb-6 p-4 bg-white border-l-4 border-[#263A81] rounded-2xl flex items-center gap-3 animate-fade-in ${cardShadow}`}>
          <CheckCircle size={20} className="text-[#263A81]" />
          <span className="text-[#263A81] font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className={`mb-6 p-4 bg-white border-l-4 border-[#263A81] rounded-2xl flex items-center gap-3 animate-fade-in ${cardShadow}`}>
          <AlertCircle size={20} className="text-[#263A81]" />
          <span className="text-[#263A81] font-semibold">{error}</span>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`bg-white rounded-3xl p-6 animate-pulse ${cardShadow}`}>
              <div className="h-16 bg-[#263A81]/10 rounded-2xl"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* ===== STATS DASHBOARD ===== */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard title="Total Users" value={totalUsers} icon={<Users size={22} />}>
              <span><Dot tone={NAVY} />{activeUsers} Active</span>
              <span><Dot tone="#A9B3E8" />{suspendedUsers} Suspended</span>
            </StatCard>

            <StatCard title="Departments" value={totalDepartments} icon={<Building size={22} />}>
              {departmentStats.slice(0, 3).map((dept, index) => (
                <span key={index} className="px-2.5 py-0.5 bg-[#F4F5FB] text-[#6B73A8] rounded-full">
                  {dept.name}: {dept.count}
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
            users={users.map((u) => ({
            id: String(u.id),
            name: u.nom,
            email: u.email,
            role: u.role ?? "EMPLOYEE",
            departmentId:
              u.departementId != null
              ? String(u.departementId)
            : "",
            }))}
            departments={departments.map((d) => ({
              id: String(d.id),
              name: d.nom_departement,
           }))}
          />

          {/* ===== USER REGISTRY (GRILLE HORIZONTALE PAR RÔLE) ===== */}
<section>
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
    <div className="flex items-center gap-3">
      <h2 className="text-2xl font-extrabold text-[#16193A]">User Registry</h2>
      <span
        className={`text-xs font-bold text-[#6B73A8] bg-white px-3 py-1 rounded-full ${cardShadow}`}
      >
        {filteredUsers.length} users
      </span>
    </div>

    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B73A8]"
        />
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full sm:w-60 h-11 pl-11 pr-4 rounded-full bg-white text-sm font-semibold text-[#16193A] placeholder:text-[#6B73A8] focus:outline-none focus:ring-2 focus:ring-[#263A81] transition ${cardShadow}`}
        />
      </div>
      <select
        value={selectedRole}
        onChange={(e) => setSelectedRole(e.target.value)}
        className={selectCls}
      >
        <option value="all">All Roles</option>
        <option value="ADMIN">Admin</option>
        <option value="HOD">HOD</option>
        <option value="EMPLOYEE">Employee</option>
      </select>
      <select
        value={selectedStatus}
        onChange={(e) => setSelectedStatus(e.target.value)}
        className={selectCls}
      >
        <option value="all">All Status</option>
        <option value="true">Active</option>
        <option value="false">Suspended</option>
      </select>
    </div>
  </div>

  <div className="space-y-8">
    {visibleColumns.map((col) => {
      const colUsers = filteredUsers.filter(
        (u) => (u.role || 'EMPLOYEE') === col.key,
      );
      const roleConfig = getRoleBadge(col.key);

      return (
        <div key={col.key}>
          {/* Header de section */}
          <div
            className={`mb-3 flex items-center justify-between rounded-2xl bg-white px-4 py-3 ${cardShadow}`}
          >
            <span className="flex items-center gap-2 text-sm font-bold text-[#16193A]">
              {col.label}
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${roleConfig.cls}`}
              >
                {colUsers.length}
              </span>
            </span>
            {col.key === 'EMPLOYEE' && (
              <button
                onClick={openCreateModal}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-[#263A81]/10 text-[#263A81] transition hover:bg-[#263A81] hover:text-white"
                title="Create user"
                aria-label="Create user"
              >
                <UserPlus size={14} />
              </button>
            )}
          </div>

          {colUsers.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-[#E6E9F6] py-6 text-center text-sm text-[#6B73A8]">
              No users
            </div>
          ) : (
            /* Grille horizontale comme Projets & Tâches */
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {colUsers.map((user) => {
                const userStatus = getUserStatus(user);
                const statusConfig = getStatusBadge(userStatus);

                return (
                  <div
                    key={user.id}
                    className={`rounded-3xl bg-white p-4 ${cardShadow}`}
                  >
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center rounded-full bg-[#263A81]/10 px-3 py-1 text-xs font-bold text-[#263A81]">
                        <Building size={12} className="mr-1" />
                        Dept: {getDeptLabel(user)}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${statusConfig.cls}`}
                      >
                        {statusConfig.icon}
                        {statusConfig.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4A5CC2] to-[#263A81] text-sm font-extrabold text-white">
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
                      <div className="h-full w-full bg-gradient-to-r from-[#263A81] to-[#4A5CC2]" />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#6B73A8]">
                        Joined: {formatDate(user.createdAt)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(user)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F4F5FB] text-[#263A81] transition hover:bg-[#263A81] hover:text-white"
                          title="Edit user"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() =>
                            handleToggleStatus(user.id!, userStatus)
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F4F5FB] text-[#263A81] transition hover:bg-[#263A81] hover:text-white"
                          title={
                            userStatus === 'true'
                              ? 'Suspend user'
                              : 'Activate user'
                          }
                        >
                          {userStatus === 'true' ? (
                            <UserX size={15} />
                          ) : (
                            <UserCheck size={15} />
                          )}
                        </button>
                        <button
                          onClick={() => openDeleteModal(user)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F4F5FB] text-[#263A81] transition hover:bg-[#263A81] hover:text-white"
                          title="Delete user"
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

          {/* ===== DEPARTMENT INSPECTOR ===== */}
          <section className="mt-10">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-2xl font-extrabold text-[#16193A]">Department Inspector</h2>
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
                departments.map((dept) => {
                  const hodId = dept.chef_DepartementId ? Number(dept.chef_DepartementId) : undefined;
                  const hod = users.find((u) => u.id === hodId);
                  const deptEmployeeCount = users.filter((u) => u.departementId === dept.id).length;
                  const taskCount = tasks.filter(
                    (t) => t.userId && users.find((u) => u.id === t.userId && u.departementId === dept.id)
                  ).length;

                  return (
                    <div key={dept.id} className={`bg-white rounded-3xl p-5 ${cardShadow}`}>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-extrabold text-[#16193A]">{dept.nom_departement || 'Unnamed'}</h3>
                          <p className="text-xs text-[#6B73A8]">ID: {dept.id}</p>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-[#263A81]/10 flex items-center justify-center text-[#263A81]">
                          <Building size={18} />
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-[#6B73A8]">Head of Department</span>
                          <span className="font-bold text-[#16193A]">{hod?.nom || 'Unassigned'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#6B73A8]">Employees</span>
                          <span className="font-bold text-[#16193A]">{deptEmployeeCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#6B73A8]">Active Tasks</span>
                          <span className="font-bold text-[#16193A]">{taskCount}</span>
                        </div>
                      </div>

                      {dept.description && (
                        <div className="mt-3 pt-3 border-t border-[#E6E9F6]">
                          <p className="text-xs text-[#6B73A8]">{dept.description}</p>
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

      {/* ===== CREATE USER MODAL ===== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#16193A]/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
            <div className="sticky top-0 bg-white border-b border-[#E6E9F6] p-6 flex items-center justify-between z-10 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#263A81]/10 flex items-center justify-center text-[#263A81]">
                  <UserPlus size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-[#16193A]">Create New User</h2>
                  <p className="text-sm text-[#6B73A8]">Add a new user to your organization</p>
                </div>
              </div>
              <button
                onClick={closeCreateModal}
                className="w-10 h-10 rounded-full bg-[#F4F5FB] flex items-center justify-center hover:bg-[#263A81]/10 transition"
                aria-label="Close modal"
              >
                <X size={20} className="text-[#263A81]" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nom" className="block text-sm font-semibold text-[#16193A] mb-1.5">
                    Full Name <span className="text-[#263A81]">*</span>
                  </label>
                  <input
                    type="text"
                    id="nom"
                    name="nom"
                    value={formData.nom}
                    onChange={handleFormChange}
                    placeholder="Enter full name"
                    className={inputCls}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-[#16193A] mb-1.5">
                    Email Address <span className="text-[#263A81]">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B73A8]" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      placeholder="user@company.com"
                      className={`${inputCls} pl-11`}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="telephone" className="block text-sm font-semibold text-[#16193A] mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="telephone"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleFormChange}
                    placeholder="+1 (555) 000-0000"
                    className={inputCls}
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-[#16193A] mb-1.5">
                    Password <span className="text-[#263A81]">*</span>
                  </label>
                  <div className="relative">
                    <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B73A8]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleFormChange}
                      placeholder="Set a password"
                      className={`${inputCls} pl-11 pr-12`}
                      required
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B73A8] hover:text-[#263A81] transition"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-semibold text-[#16193A] mb-1.5">
                    Role <span className="text-[#263A81]">*</span>
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleFormChange}
                    className={inputCls}
                    required
                    disabled={isSubmitting}
                  >
                    <option value="EMPLOYEE">Employee</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="departementId" className="block text-sm font-semibold text-[#16193A] mb-1.5">
                    Department
                  </label>
                  <select
                    id="departementId"
                    name="departementId"
                    value={formData.departementId || ''}
                    onChange={handleFormChange}
                    className={inputCls}
                    disabled={isSubmitting}
                  >
                    <option value="">Choisir un département</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.nom_departement}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#E6E9F6]">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="flex-1 px-4 py-3 rounded-full border border-[#263A81]/30 text-[#263A81] font-semibold hover:bg-[#F4F5FB] transition"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-[#263A81] text-white font-bold rounded-full hover:bg-[#1e2f6a] shadow-[0_8px_18px_rgba(38,58,129,0.3)] transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#16193A]/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
            <div className="sticky top-0 bg-white border-b border-[#E6E9F6] p-6 flex items-center justify-between z-10 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#263A81]/10 flex items-center justify-center text-[#263A81]">
                  <Edit size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-[#16193A]">Edit User</h2>
                  <p className="text-sm text-[#6B73A8]">Update user information for {selectedUser.nom}</p>
                </div>
              </div>
              <button
                onClick={closeEditModal}
                className="w-10 h-10 rounded-full bg-[#F4F5FB] flex items-center justify-center hover:bg-[#263A81]/10 transition"
                aria-label="Close modal"
              >
                <X size={20} className="text-[#263A81]" />
              </button>
            </div>

            <form onSubmit={handleEditUser} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-nom" className="block text-sm font-semibold text-[#16193A] mb-1.5">
                    Full Name <span className="text-[#263A81]">*</span>
                  </label>
                  <input
                    type="text"
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
                  <label htmlFor="edit-email" className="block text-sm font-semibold text-[#16193A] mb-1.5">
                    Email Address <span className="text-[#263A81]">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B73A8]" />
                    <input
                      type="email"
                      id="edit-email"
                      name="email"
                      value={editFormData.email}
                      onChange={handleEditFormChange}
                      className={`${inputCls} pl-11`}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="edit-telephone" className="block text-sm font-semibold text-[#16193A] mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="edit-telephone"
                    name="telephone"
                    value={editFormData.telephone}
                    onChange={handleEditFormChange}
                    className={inputCls}
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label htmlFor="edit-role" className="block text-sm font-semibold text-[#16193A] mb-1.5">
                    Role <span className="text-[#263A81]">*</span>
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
                  <label htmlFor="edit-departementId" className="block text-sm font-semibold text-[#16193A] mb-1.5">
                    Department
                  </label>
                  <select
                    id="edit-departementId"
                    name="departementId"
                    value={editFormData.departementId ?? ''}
                    onChange={handleEditFormChange}
                    className={inputCls}
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

                <div>
                  <label htmlFor="edit-status" className="block text-sm font-semibold text-[#16193A] mb-1.5">
                    Status <span className="text-[#263A81]">*</span>
                  </label>
                  <select
                    id="edit-status"
                    name="status"
                    value={editFormData.status ? 'true' : 'false'}
                    onChange={(e) => {
                      setEditFormData((prev) => ({ ...prev, status: e.target.value === 'true' }));
                    }}
                    className={inputCls}
                    required
                    disabled={isSubmitting}
                  >
                    <option value="true">Active</option>
                    <option value="false">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#E6E9F6]">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 px-4 py-3 rounded-full border border-[#263A81]/30 text-[#263A81] font-semibold hover:bg-[#F4F5FB] transition"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-[#263A81] text-white font-bold rounded-full hover:bg-[#1e2f6a] shadow-[0_8px_18px_rgba(38,58,129,0.3)] transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60"
                  disabled={isSubmitting}
                >
                  <Edit size={18} />
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      {isDeleteModalOpen && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#16193A]/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl animate-scale-in">
            <div className="p-6 border-b border-[#E6E9F6]">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#263A81]/10 flex items-center justify-center text-[#263A81]">
                  <Trash2 size={22} />
                </div>
                <h2 className="text-xl font-extrabold text-[#16193A]">Delete User</h2>
              </div>
            </div>

            <div className="p-6">
              <p className="text-[#16193A] mb-2">
                Are you sure you want to delete <span className="font-bold">{userToDelete.nom}</span>?
              </p>
              <p className="text-sm text-[#6B73A8]">
                This action cannot be undone. All associated data will be permanently removed.
              </p>
            </div>

            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={closeDeleteModal}
                className="flex-1 px-4 py-3 rounded-full border border-[#263A81]/30 text-[#263A81] font-semibold hover:bg-[#F4F5FB] transition"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="flex-1 px-4 py-3 bg-[#263A81] text-white font-bold rounded-full hover:bg-[#1e2f6a] shadow-[0_8px_18px_rgba(38,58,129,0.3)] transition disabled:opacity-60"
                disabled={isSubmitting}
              >
                Delete User
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
      `}</style>
    </AppLayout>
  );
};

export default AdminControlCenterPage;