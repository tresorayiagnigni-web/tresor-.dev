// app/actions/userActions.ts

'use server';

import { cookies } from 'next/headers';

export type UserRole = 'ADMIN' | 'HOD' | 'EMPLOYER';
export type UserStatus = 'true' | 'false';

export interface User {
  id?: number;
  nom: string;
  email: string;
  password?: string;
  departement?: string;
  telephone?: string;
  createdAt?: string;
  status?: UserStatus | boolean;
  role?: UserRole;
  departmentId?: number;
}

export interface CreateUserInput {
  nom: string;
  email: string;
  password: string;
  role: UserRole;
  departement?: string;
  telephone?: string;
  status?: UserStatus;
}

export interface UpdateUserInput {
  nom?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  departement?: string;
  telephone?: string;
  status?: UserStatus;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ========== HELPER FUNCTIONS ==========
const getAuthToken = async (): Promise<string | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get('my_secret_token')?.value;
  return token || null;
};

const getHeaders = async (): Promise<HeadersInit> => {
  const token = await getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (response: Response): Promise<ApiResponse> => {
  try {
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        message: data?.message || 'An error occurred',
        error: data?.error || 'Request failed',
      };
    }
    
    return {
      success: true,
      data: data,
      message: data?.message || 'Operation successful',
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to parse server response',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// ========== USER CRUD OPERATIONS ==========

export async function getUsers(): Promise<ApiResponse<User[]>> {
  try {
    const headers = await getHeaders();
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users`, {
      method: 'GET',
      headers,
    });

    return await handleResponse(response);
  } catch (error) {
    return {
      success: false,
      message: 'Failed to fetch users',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export async function getUserById(userId: number): Promise<ApiResponse<User>> {
  try {
    const headers = await getHeaders();
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${userId}`, {
      method: 'GET',
      headers,
    });

    return await handleResponse(response);
  } catch (error) {
    return {
      success: false,
      message: 'Failed to fetch user',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export async function createUser(input: CreateUserInput): Promise<ApiResponse<User>> {
  try {
    const headers = await getHeaders();
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users`, {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
    });

    return await handleResponse(response);
  } catch (error) {
    return {
      success: false,
      message: 'Failed to create user',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export async function updateUser(userId: number, input: UpdateUserInput): Promise<ApiResponse<User>> {
  try {
    const headers = await getHeaders();
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${userId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(input),
    });

    return await handleResponse(response);
  } catch (error) {
    return {
      success: false,
      message: 'Failed to update user',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export async function deleteUser(userId: number): Promise<ApiResponse> {
  try {
    const headers = await getHeaders();
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${userId}`, {
      method: 'DELETE',
      headers,
    });

    return await handleResponse(response);
  } catch (error) {
    return {
      success: false,
      message: 'Failed to delete user',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export async function getUsersByDepartment(departmentId: number): Promise<ApiResponse<User[]>> {
  try {
    const headers = await getHeaders();
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users?departmentId=${departmentId}`, {
      method: 'GET',
      headers,
    });

    return await handleResponse(response);
  } catch (error) {
    return {
      success: false,
      message: 'Failed to fetch users by department',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export async function getUsersByRole(role: UserRole): Promise<ApiResponse<User[]>> {
  try {
    const headers = await getHeaders();
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users?role=${role}`, {
      method: 'GET',
      headers,
    });

    return await handleResponse(response);
  } catch (error) {
    return {
      success: false,
      message: 'Failed to fetch users by role',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}