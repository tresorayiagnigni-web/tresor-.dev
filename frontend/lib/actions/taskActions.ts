// app/actions/taskAction.ts

'use server';

import { cookies } from 'next/headers';

// ========== TYPE DEFINITIONS ==========
export type TaskStatus = 'A_faire' | 'En_cours' | 'Terminer';
export type TaskPriority = 'Bas' | 'Moyen' | 'Elevee';

export interface Task {
  id?: number;
  titre: string;
  description?: string;
  status: TaskStatus;
  priorite: TaskPriority;
  userId: number;
  Date_limite?: string;
  cree_le?: string;
  date_modif?: string;
  user?: {
    id: number;
    nom: string;
    email: string;
  };
}

export interface CreateTaskInput {
  titre: string;
  description?: string;
  status?: TaskStatus;
  priorite?: TaskPriority;
  userId: number;
  Date_limite?: string;
}

export interface UpdateTaskInput {
  titre?: string;
  description?: string;
  status?: TaskStatus;
  priorite?: TaskPriority;
  userId?: number;
  Date_limite?: string;
}

export interface FilterTaskDto {
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
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

// ========== TASK CRUD OPERATIONS ==========

export async function getTasks(filters?: FilterTaskDto): Promise<ApiResponse<Task[]>> {
  try {
    const headers = await getHeaders();
    
    const queryParams = new URLSearchParams();
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.priority) queryParams.append('priority', filters.priority);
    if (filters?.search) queryParams.append('search', filters.search);
    
    const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/tasks${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return {
      success: false,
      message: 'Failed to fetch tasks',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export async function getTaskById(taskId: number): Promise<ApiResponse<Task>> {
  try {
    const headers = await getHeaders();
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tasks/${taskId}`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    return await handleResponse(response);
  } catch (error) {
    console.error(`Error fetching task ${taskId}:`, error);
    return {
      success: false,
      message: 'Failed to fetch task',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export async function createTask(input: CreateTaskInput): Promise<ApiResponse<Task>> {
  try {
    if (!input.titre?.trim()) {
      return {
        success: false,
        message: 'Task title is required',
        error: 'Validation failed',
      };
    }

    if (!input.userId) {
      return {
        success: false,
        message: 'User ID is required',
        error: 'Validation failed',
      };
    }

    const headers = await getHeaders();
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tasks`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        titre: input.titre.trim(),
        description: input.description?.trim() || '',
        status: input.status || 'A_faire',
        priorite: input.priorite || 'Moyen',
        userId: input.userId,
        Date_limite: input.Date_limite,
      }),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error creating task:', error);
    return {
      success: false,
      message: 'Failed to create task',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export async function updateTask(taskId: number, input: UpdateTaskInput): Promise<ApiResponse<Task>> {
  try {
    if (!taskId) {
      return {
        success: false,
        message: 'Task ID is required',
        error: 'Validation failed',
      };
    }

    const headers = await getHeaders();
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        titre: input.titre?.trim(),
        description: input.description?.trim(),
        status: input.status,
        priorite: input.priorite,
        userId: input.userId,
        Date_limite: input.Date_limite,
      }),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error(`Error updating task ${taskId}:`, error);
    return {
      success: false,
      message: 'Failed to update task',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export async function updateTaskStatus(taskId: number, status: TaskStatus): Promise<ApiResponse<Task>> {
  try {
    if (!taskId) {
      return {
        success: false,
        message: 'Task ID is required',
        error: 'Validation failed',
      };
    }

    const headers = await getHeaders();
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status }),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error(`Error updating task status ${taskId}:`, error);
    return {
      success: false,
      message: 'Failed to update task status',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export async function deleteTask(taskId: number): Promise<ApiResponse> {
  try {
    if (!taskId) {
      return {
        success: false,
        message: 'Task ID is required',
        error: 'Validation failed',
      };
    }

    const headers = await getHeaders();
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tasks/${taskId}`, {
      method: 'DELETE',
      headers,
    });

    return await handleResponse(response);
  } catch (error) {
    console.error(`Error deleting task ${taskId}:`, error);
    return {
      success: false,
      message: 'Failed to delete task',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export async function getTasksByUser(userId: number): Promise<ApiResponse<Task[]>> {
  try {
    const headers = await getHeaders();
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tasks?userId=${userId}`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    return await handleResponse(response);
  } catch (error) {
    console.error(`Error fetching tasks for user ${userId}:`, error);
    return {
      success: false,
      message: 'Failed to fetch user tasks',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export async function getTasksByStatus(status: TaskStatus): Promise<ApiResponse<Task[]>> {
  return await getTasks({ status });
}

export async function assignTask(taskId: number, userId: number): Promise<ApiResponse<Task>> {
  return await updateTask(taskId, { userId });
}