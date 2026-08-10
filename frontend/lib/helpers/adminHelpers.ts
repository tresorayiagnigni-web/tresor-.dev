// lib/helpers/adminHelpers.ts

import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  type User as ApiUser,
  type UserRole,
  type UserStatus,
} from '@/lib/actions/userActions';
import { getTasks, type Task } from '@/lib/actions/taskActions';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  assignDepartmentHead,
  type Department,
} from '@/lib/actions/departmentActions';

// ========== FETCH FUNCTIONS ==========
export const fetchAllData = async () => {
  try {
    const [usersResult, tasksResult, deptsResult] = await Promise.all([
      getUsers(),
      getTasks(),
      getDepartments(),
    ]);

    return {
      users: usersResult.success && usersResult.data ? usersResult.data : [],
      tasks: tasksResult.success && tasksResult.data ? tasksResult.data : [],
      departments: deptsResult.success && deptsResult.data ? deptsResult.data : [],
      error: !usersResult.success ? usersResult.message : 
             !tasksResult.success ? tasksResult.message : 
             !deptsResult.success ? deptsResult.message : null,
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      users: [],
      tasks: [],
      departments: [],
      error: 'Failed to load data from server',
    };
  }
};

// ========== USER CRUD FUNCTIONS ==========
export const createNewUser = async (formData: any) => {
  try {
    const result = await createUser({
      nom: formData.nom,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      departement: formData.departement,
      telephone: formData.telephone,
    });
    return result;
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, message: 'Failed to create user' };
  }
};

export const updateExistingUser = async (userId: number, editFormData: any) => {
  try {
    const updateData: any = {
      nom: editFormData.nom,
      email: editFormData.email,
      role: editFormData.role,
      departement: editFormData.departement,
      telephone: editFormData.telephone,
    };

    if (editFormData.password) {
      updateData.password = editFormData.password;
    }

    const result = await updateUser(userId, updateData);
    return result;
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, message: 'Failed to update user' };
  }
};

export const deleteExistingUser = async (userId: number) => {
  try {
    const result = await deleteUser(userId);
    return result;
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, message: 'Failed to delete user' };
  }
};

export const toggleUserStatus = async (userId: number, currentStatus: UserStatus) => {
  try {
    const newStatus = currentStatus === 'true' ? 'false' : 'true';
    const result = await updateUser(userId, { status: newStatus });
    return result;
  } catch (error) {
    console.error('Error toggling status:', error);
    return { success: false, message: 'Failed to update user status' };
  }
};

// ========== DEPARTMENT CRUD FUNCTIONS ==========
export const fetchDepartments = async () => {
  try {
    const result = await getDepartments();
    return result;
  } catch (error) {
    console.error('Error fetching departments:', error);
    return { success: false, message: 'Failed to fetch departments' };
  }
};

export const fetchUsers = async () => {
  try {
    const result = await getUsers();
    return result;
  } catch (error) {
    console.error('Error fetching users:', error);
    return { success: false, message: 'Failed to fetch users' };
  }
};

export const createNewDepartment = async (data: { nom_departement: string; description?: string }) => {
  try {
    const result = await createDepartment({
      nom_departement: data.nom_departement,
      description: data.description || '',
    });
    return result;
  } catch (error) {
    console.error('Error creating department:', error);
    return { success: false, message: 'Failed to create department' };
  }
};

export const updateExistingDepartment = async (id: number, data: { nom_departement: string; description?: string }) => {
  try {
    const result = await updateDepartment(id, {
      nom_departement: data.nom_departement,
      description: data.description || '',
    });
    return result;
  } catch (error) {
    console.error('Error updating department:', error);
    return { success: false, message: 'Failed to update department' };
  }
};

export const deleteExistingDepartment = async (id: number) => {
  try {
    const result = await deleteDepartment(id);
    return result;
  } catch (error) {
    console.error('Error deleting department:', error);
    return { success: false, message: 'Failed to delete department' };
  }
};

export const assignHOD = async (departmentId: number, userId: number) => {
  try {
    const result = await assignDepartmentHead(departmentId, userId);
    return result;
  } catch (error) {
    console.error('Error assigning HOD:', error);
    return { success: false, message: 'Failed to assign HOD' };
  }
};

// ========== FORMATTING HELPERS ==========
export const formatDate = (dateString?: string | Date) => {
  if (!dateString) return 'N/A';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const showSuccess = (setter: (msg: string | null) => void, message: string) => {
  setter(message);
  setTimeout(() => setter(null), 4000);
};

// ========== BADGE HELPERS ==========
export const getRoleBadge = (role: UserRole) => {
  const config = {
    ADMIN: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      label: 'Admin',
    },
    HOD: {
      bg: 'bg-purple-100',
      text: 'text-purple-800',
      label: 'HOD',
    },
    EMPLOYER: {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      label: 'Employee',
    },
  };
  return config[role] || config.EMPLOYER;
};

export const getStatusBadge = (status: UserStatus) => {
  if (status === 'true') {
    return { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' };
  } else if (status === 'false') {
    return { bg: 'bg-red-100', text: 'text-red-800', label: 'Suspended' };
  } else {
    return { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' };
  }
};