// app/actions/departmentActions.ts

'use server';

import { cookies } from 'next/headers';

// ========== TYPE DEFINITIONS ==========
export interface Department {
  id?: number;
  nom_departement: string;
  chef_departementId?: number;
  description?: string;
  cree_le?: string;
  isActive?: boolean;
  code?: string;
  chef_departement?: string;
}

export interface CreateDepartmentInput {
  nom_departement: string;
  chef_departementId?: number;
  description?: string;
}

export interface UpdateDepartmentInput {
  nom_departement?: string;
  chef_departementId?: number;
  description?: string;
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

// ========== HELPER: Normalize department data ==========
const normalizeDepartment = (dept: any): Department => {
  return {
    id: dept.id,
    nom_departement: dept.nom_departement,
    chef_departementId: dept.chef_departementId ? Number(dept.chef_departementId) : undefined,
    description: dept.description,
    cree_le: dept.cree_le,
    isActive: dept.isActive !== undefined ? dept.isActive : true,
    code: dept.code,
    chef_departement: dept.chef_departement,
  };
};

// ========== DEPARTMENT CRUD OPERATIONS ==========

export async function getDepartments(): Promise<ApiResponse<Department[]>> {
  try {
    const headers = await getHeaders();
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/departments`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    const result = await handleResponse(response);
    
    if (result.success && result.data) {
      const data = Array.isArray(result.data) ? result.data : [result.data];
      result.data = data.map(normalizeDepartment);
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching departments:', error);
    return {
      success: false,
      message: 'Failed to fetch departments',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export async function getDepartmentById(departmentId: number): Promise<ApiResponse<Department>> {
  try {
    const headers = await getHeaders();
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/departments/${departmentId}`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    const result = await handleResponse(response);
    
    if (result.success && result.data) {
      result.data = normalizeDepartment(result.data);
    }
    
    return result;
  } catch (error) {
    console.error(`Error fetching department ${departmentId}:`, error);
    return {
      success: false,
      message: 'Failed to fetch department',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export async function createDepartment(input: CreateDepartmentInput): Promise<ApiResponse<Department>> {
  try {
    if (!input.nom_departement?.trim()) {
      return {
        success: false,
        message: 'Department name is required',
        error: 'Validation failed',
      };
    }

    const headers = await getHeaders();
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/departments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        nom_departement: input.nom_departement.trim(),
        chef_departementId: input.chef_departementId,
        description: input.description?.trim() || '',
      }),
    });

    const result = await handleResponse(response);
    
    if (result.success && result.data) {
      result.data = normalizeDepartment(result.data);
    }
    
    return result;
  } catch (error) {
    console.error('Error creating department:', error);
    return {
      success: false,
      message: 'Failed to create department',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export async function updateDepartment(departmentId: number, input: UpdateDepartmentInput): Promise<ApiResponse<Department>> {
  try {
    if (!departmentId) {
      return {
        success: false,
        message: 'Department ID is required',
        error: 'Validation failed',
      };
    }

    const headers = await getHeaders();
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/departments/${departmentId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        nom_departement: input.nom_departement?.trim(),
        chef_departementId: input.chef_departementId,
        description: input.description?.trim(),
      }),
    });

    const result = await handleResponse(response);
    
    if (result.success && result.data) {
      result.data = normalizeDepartment(result.data);
    }
    
    return result;
  } catch (error) {
    console.error(`Error updating department ${departmentId}:`, error);
    return {
      success: false,
      message: 'Failed to update department',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export async function deleteDepartment(departmentId: number): Promise<ApiResponse> {
  try {
    if (!departmentId) {
      return {
        success: false,
        message: 'Department ID is required',
        error: 'Validation failed',
      };
    }

    const headers = await getHeaders();
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/departments/${departmentId}`, {
      method: 'DELETE',
      headers,
    });

    return await handleResponse(response);
  } catch (error) {
    console.error(`Error deleting department ${departmentId}:`, error);
    return {
      success: false,
      message: 'Failed to delete department',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export async function assignDepartmentHead(departmentId: number, userId: number): Promise<ApiResponse<Department>> {
  try {
    if (!departmentId || !userId) {
      return {
        success: false,
        message: 'Department ID and User ID are required',
        error: 'Validation failed',
      };
    }

    const headers = await getHeaders();
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/departments/${departmentId}/assign-head`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ 
        userId: Number(userId)
      }),
    });

    const result = await handleResponse(response);
    
    if (result.success && result.data) {
      result.data = normalizeDepartment(result.data);
    }
    
    return result;
  } catch (error) {
    console.error(`Error assigning head to department ${departmentId}:`, error);
    return {
      success: false,
      message: 'Failed to assign department head',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}