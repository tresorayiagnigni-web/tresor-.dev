'use server';

import { cookies } from 'next/headers';

// =====================================================
// TYPES PARTAGÉS
// =====================================================

export type Role = 'ADMIN' | 'HOD' | 'EMPLOYEE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
export type WorkStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';

export interface Department {
  id: string;
  name: string;
}

export interface UserLite {
  id: string;
  name: string;
  email: string;
  role: Role;
  departmentId?: string | null;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  departementId?: number;
  departement?: {
    id: number;
    nom_departement: string;
  };
  dueDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
  departmentIds?: string[];
  status: WorkStatus;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  // projectId?: string | null;
  assigneeIds: string[];
  priority: Priority;
  dueDate?: string | null;
  status: WorkStatus;
  projectId?: number;          // ← nouveau
  project?: Project;
}

export type NewProject = Omit<Project, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'departement'>;

export type UpdateProjectInput = Partial<NewProject> & {
  status?: WorkStatus;
};

export type NewTask = Omit<Task, 'id' | 'status'>;

export type UpdateTaskInput = Partial<NewTask> & {
  status?: WorkStatus;
};

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

async function getHeaders(): Promise<HeadersInit> {
  const cookieStore = await cookies();
  const token = cookieStore.get('my_secret_token')?.value;

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  try {
    const headers = await getHeaders();

    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
      cache: 'no-store',
    });

    const text = await response.text();
    let body: any = null;

    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = { message: text };
      }
    }

    if (!response.ok) {
      return {
        success: false,
        message: body?.message || `Erreur HTTP ${response.status}`,
        error:
          typeof body?.error === 'string' ? body.error : undefined,
      };
    }

    return {
      success: true,
      data: body?.data ?? body,
      message: body?.message || 'Opération réussie',
    };
  } catch (error) {
    console.error(`Erreur API ${endpoint}:`, error);

    return {
      success: false,
      message: 'Impossible de communiquer avec le serveur.',
      error:
        error instanceof Error
          ? error.message
          : 'Erreur réseau inconnue',
    };
  }
}

export async function createProject(
  input: NewProject,
): Promise<ApiResponse<Project>> {
  if (!input.name?.trim()) {
    return {
      success: false,
      message: 'Le nom du projet est obligatoire.',
    };
  }

  return request<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      name: input.name.trim(),
      description: input.description?.trim() || '',
    }),
  });
}

export async function listProjects(): Promise<ApiResponse<Project[]>> {
  const result = await request<Project[] | { items: Project[] }>(
    '/projects',
    { method: 'GET' },
  );

  if (!result.success) {
    return {
      success: false,
      message: result.message,
      error: result.error,
    };
  }

  const value = result.data;
  const projects = Array.isArray(value)
    ? value
    : value && Array.isArray(value.items)
      ? value.items
      : null;

  if (!projects) {
    return {
      success: false,
      message: 'Le serveur a renvoyé une liste de projets invalide.',
    };
  }

  return {
    success: true,
    data: projects,
    message: result.message,
  };
}

export async function getProjects(): Promise<ApiResponse<Project[]>> {
  return listProjects();
}

export async function getProjectById(
  id: string,
): Promise<ApiResponse<Project>> {
  if (!id?.trim()) {
    return {
      success: false,
      message: 'Identifiant du projet manquant.',
    };
  }

  return request<Project>(`/projects/${encodeURIComponent(id)}`, {
    method: 'GET',
  });
}

export async function updateProject(
  id: string,
  input: UpdateProjectInput,
): Promise<ApiResponse<Project>> {
  if (!id?.trim()) {
    return {
      success: false,
      message: 'Identifiant du projet manquant.',
    };
  }

  if (input.name !== undefined && !input.name.trim()) {
    return {
      success: false,
      message: 'Le nom du projet ne peut pas être vide.',
    };
  }

  const body = {
    ...input,
    ...(input.name !== undefined ? { name: input.name.trim() } : {}),
    ...(input.description !== undefined
      ? { description: input.description.trim() }
      : {}),
  };

  return request<Project>(`/projects/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deleteProject(
  id: string,
): Promise<ApiResponse<null>> {
  if (!id?.trim()) {
    return {
      success: false,
      message: 'Identifiant du projet manquant.',
    };
  }

  const result = await request<unknown>(
    `/projects/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  );

  if (!result.success) {
    return {
      success: false,
      message: result.message,
      error: result.error,
    };
  }

  return {
    success: true,
    data: null,
    message: result.message || 'Projet supprimé avec succès.',
  };
}

export async function createTask(
  input: NewTask,
): Promise<ApiResponse<Task>> {
  if (!input.title?.trim()) {
    return {
      success: false,
      message: 'Le titre de la tâche est obligatoire.',
    };
  }

  return request<Task>('/tasks', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      title: input.title.trim(),
      description: input.description?.trim() || '',
      assigneeIds: input.assigneeIds ?? [],
    }),
  });
}

export async function listTasks(): Promise<ApiResponse<Task[]>> {
  const result = await request<Task[] | { items: Task[] }>(
    '/tasks',
    { method: 'GET' },
  );

  if (!result.success) {
    return {
      success: false,
      message: result.message,
      error: result.error,
    };
  }

  const value = result.data;
  const tasks = Array.isArray(value)
    ? value
    : value && Array.isArray(value.items)
      ? value.items
      : null;

  if (!tasks) {
    return {
      success: false,
      message: 'Le serveur a renvoyé une liste de tâches invalide.',
    };
  }

  return {
    success: true,
    data: tasks,
    message: result.message,
  };
}

export async function getTasks(): Promise<ApiResponse<Task[]>> {
  return listTasks();
}

export async function getTaskById(
  id: string,
): Promise<ApiResponse<Task>> {
  if (!id?.trim()) {
    return {
      success: false,
      message: 'Identifiant de la tâche manquant.',
    };
  }

  return request<Task>(`/tasks/${encodeURIComponent(id)}`, {
    method: 'GET',
  });
}

export async function updateTask(
  id: string,
  input: UpdateTaskInput,
): Promise<ApiResponse<Task>> {
  if (!id?.trim()) {
    return {
      success: false,
      message: 'Identifiant de la tâche manquant.',
    };
  }

  if (input.title !== undefined && !input.title.trim()) {
    return {
      success: false,
      message: 'Le titre de la tâche ne peut pas être vide.',
    };
  }

  const body = {
    ...input,
    ...(input.title !== undefined ? { title: input.title.trim() } : {}),
    ...(input.description !== undefined
      ? { description: input.description.trim() }
      : {}),
  };

  return request<Task>(`/tasks/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deleteTask(
  id: string,
): Promise<ApiResponse<null>> {
  if (!id?.trim()) {
    return {
      success: false,
      message: 'Identifiant de la tâche manquant.',
    };
  }

  const result = await request<unknown>(
    `/tasks/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  );

  if (!result.success) {
    return {
      success: false,
      message: result.message,
      error: result.error,
    };
  }

  return {
    success: true,
    data: null,
    message: result.message || 'Tâche supprimée avec succès.',
  };
}

export async function listMyDepartmentProjects(): Promise<ApiResponse<Project[]>> {
  const result = await request<Project[] | { items: Project[] }>(
    '/projects/my-department',
    { method: 'GET' },
  );

  if (!result.success) {
    return {
      success: false,
      message: result.message,
      error: result.error,
    };
  }

  const value = result.data;
  const projects = Array.isArray(value)
    ? value
    : value && Array.isArray(value.items)
      ? value.items
      : null;

  if (!projects) {
    return {
      success: false,
      message: 'Liste de projets invalide.',
    };
  }

  return {
    success: true,
    data: projects,
    message: result.message,
  };
}