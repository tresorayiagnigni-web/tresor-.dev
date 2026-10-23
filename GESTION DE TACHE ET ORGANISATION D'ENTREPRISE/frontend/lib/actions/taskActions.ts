// app/actions/taskAction.ts

'use server';

import { cookies } from 'next/headers';
import { User } from './userActions';

// ========== TYPE DEFINITIONS ==========
export type TaskStatus = 'A_faire' | 'En_cours' | 'Terminer';
export type TaskPriority = 'Bas' | 'Moyen' | 'Elevee';

export interface Task {
  id?: number;
  title: string;
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
  title: string;
  description?: string;
  status?: TaskStatus;
  priorite?: TaskPriority;
  userId: number;
  Date_limite?: string;
  projectId?: number | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priorite?: TaskPriority;
  userId?: number;
  Date_limite?: string;
   projectId?: number | null;
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

// ========== HELPERS ==========
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

const getAuthToken = async (): Promise<string | null> => {
  const cookieStore = await cookies();
  return cookieStore.get('my_secret_token')?.value || null;
};

const getHeaders = async (): Promise<HeadersInit> => {
  const token = await getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleResponse = async <T = any>(response: Response): Promise<ApiResponse<T>> => {
  try {
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data?.message || 'Une erreur est survenue',
        error: data?.error || 'Request failed',
      };
    }

    return {
      success: true,
      data: data?.data ?? data, // gère les deux formats de réponse backend
      message: data?.message || 'Opération réussie',
    };
  } catch (error) {
    return {
      success: false,
      message: 'Impossible de parser la réponse du serveur',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// ========== TASK CRUD ==========

export async function getTasks(filters?: FilterTaskDto): Promise<ApiResponse<Task[]>> {
  try {
    const headers = await getHeaders();

    const queryParams = new URLSearchParams();
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.priority) queryParams.append('priority', filters.priority);
    if (filters?.search) queryParams.append('search', filters.search);

    const url = `${BACKEND_URL}/tasks${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    return await handleResponse<Task[]>(response);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return {
      success: false,
      message: 'Impossible de récupérer les tâches',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export async function getTaskById(taskId: number): Promise<ApiResponse<Task>> {
  try {
    const headers = await getHeaders();

    const response = await fetch(`${BACKEND_URL}/tasks/${taskId}`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    return await handleResponse<Task>(response);
  } catch (error) {
    console.error(`Error fetching task ${taskId}:`, error);
    return {
      success: false,
      message: 'Impossible de récupérer la tâche',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export async function createTask(input: CreateTaskInput): Promise<ApiResponse<Task>> {
  try {
    if (!input.title?.trim()) {
      return {
        success: false,
        message: 'Le titre de la tâche est obligatoire',
        error: 'Validation failed',
      };
    }

    if (!input.userId) {
      return {
        success: false,
        message: "L'ID utilisateur est obligatoire",
        error: 'Validation failed',
      };
    }

    const headers = await getHeaders();

    const response = await fetch(`${BACKEND_URL}/tasks`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: input.title.trim(),
        description: input.description?.trim() || '',
        status: input.status || 'A_faire',
        priorite: input.priorite || 'Moyen',
        userId: input.userId,
        Date_limite: input.Date_limite,
        projectId: input.projectId || null,   // ← ajoute cette ligne
      }),
    });

    return await handleResponse<Task>(response);
  } catch (error) {
    console.error('Error creating task:', error);
    return {
      success: false,
      message: 'Impossible de créer la tâche',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export async function updateTask(
  taskId: number,
  input: UpdateTaskInput
): Promise<ApiResponse<Task>> {
  try {
    if (!taskId) {
      return {
        success: false,
        message: "L'ID de la tâche est obligatoire",
        error: 'Validation failed',
      };
    }

    const headers = await getHeaders();

    // On n'envoie que les champs définis
    const body: Record<string, any> = {};
    if (input.title !== undefined) body.title = input.title.trim();
    if (input.description !== undefined) body.description = input.description?.trim();
    if (input.status !== undefined) body.status = input.status;
    if (input.priorite !== undefined) body.priorite = input.priorite;
    if (input.userId !== undefined) body.userId = input.userId;
    if (input.Date_limite !== undefined) body.Date_limite = input.Date_limite;

    const response = await fetch(`${BACKEND_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });

    return await handleResponse<Task>(response);
  } catch (error) {
    console.error(`Error updating task ${taskId}:`, error);
    return {
      success: false,
      message: 'Impossible de mettre à jour la tâche',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export async function updateTaskStatus(
  taskId: number,
  status: TaskStatus
): Promise<ApiResponse<Task>> {
  return updateTask(taskId, { status });
}

export async function deleteTask(taskId: number): Promise<ApiResponse> {
  try {
    if (!taskId) {
      return {
        success: false,
        message: "L'ID de la tâche est obligatoire",
        error: 'Validation failed',
      };
    }

    const headers = await getHeaders();

    const response = await fetch(`${BACKEND_URL}/tasks/${taskId}`, {
      method: 'DELETE',
      headers,
    });

    return await handleResponse(response);
  } catch (error) {
    console.error(`Error deleting task ${taskId}:`, error);
    return {
      success: false,
      message: 'Impossible de supprimer la tâche',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export async function getTasksByUser(userId: number): Promise<ApiResponse<Task[]>> {
  try {
    const headers = await getHeaders();

    const response = await fetch(`${BACKEND_URL}/tasks?userId=${userId}`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    return await handleResponse<Task[]>(response);
  } catch (error) {
    console.error(`Error fetching tasks for user ${userId}:`, error);
    return {
      success: false,
      message: "Impossible de récupérer les tâches de l'utilisateur",
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export async function getTasksByStatus(status: TaskStatus): Promise<ApiResponse<Task[]>> {
  return getTasks({ status });
}

export async function assignTask(taskId: number, userId: number): Promise<ApiResponse<Task>> {
  return updateTask(taskId, { userId });
}

export async function getDepartmentUsers(): Promise<ApiResponse<User[]>> {
  try {
    const headers = await getHeaders();

    const response = await fetch(
      `${BACKEND_URL}/users/my-department/employees`,
      {
        method: 'GET',
        headers,
        cache: 'no-store',
      }
    );

    return await handleResponse<User[]>(response);
  } catch (error) {
    console.error('Error loading department members:', error);
    return {
      success: false,
      message: 'Impossible de charger les membres du département',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}