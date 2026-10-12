// app/actions/userActions.ts

'use server';

import { ApiError } from 'next/dist/server/api-utils';
import { cookies } from 'next/headers';

export type UserRole = 'ADMIN' | 'HOD' | 'EMPLOYEE';
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
  departementId?: number;
}

export interface CreateUserInput {
  nom: string;
  email: string;
  password: string;
  role: UserRole;
  departementId?: number | '';
  telephone?: string;
  status?: UserStatus;
}

export interface UpdateUserInput {
  nom?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  departementId?: number | '';
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
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/profile`, {
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
    const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/employee`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        nom: input.nom,
        email: input.email,
        password: input.password,
        telephone: input.telephone,
        departementId: Number(input.departementId) || null,
      }),
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
      method: 'PATCH',
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

// Dans userActions.ts

// export async function getCurrentUser(): Promise<ApiResponse<User>> {
//   try {
//     const headers = await getHeaders();
    
//     const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/profile`, {
//       method: 'GET',
//       headers,
//     });

//     return await handleResponse(response);
//   } catch (error) {
//     return {
//       success: false,
//       message: 'Failed to fetch current user',
//       error: error instanceof Error ? error.message : 'Network error',
//     };
//   }
// }

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