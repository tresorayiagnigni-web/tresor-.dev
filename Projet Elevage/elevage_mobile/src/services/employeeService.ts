
import { api } from './api';

export interface Employee {
  id: number;
  nom: string;
  email: string;
  role: 'EMPLOYEE';
  status: boolean;
  cree_le: string;
  modifier_le: string;
}

export interface CreateEmployeeDto {
  nom: string;
  email: string;
  password: string;
}

export interface UpdateEmployeeDto {
  nom?: string;
  email?: string;
  password?: string;
}

// Récupérer tous les employés
export const getEmployees = async (): Promise<Employee[]> => {
  const response = await api.get<Employee[]>('/users');
  return response.data;
};

// Récupérer un employé
export const getEmployeeById = async (
  id: number,
): Promise<Employee> => {
  const response = await api.get<Employee>(`/users/${id}`);
  return response.data;
};

// Ajouter un employé
export const createEmployee = async (
  data: CreateEmployeeDto,
): Promise<Employee> => {
  const response = await api.post<Employee>('/users', data);
  return response.data;
};

// Modifier un employé
export const updateEmployee = async (
  id: number,
  data: UpdateEmployeeDto,
): Promise<Employee> => {
  const response = await api.patch<Employee>(`/users/${id}`, data);
  return response.data;
};

// Activer ou désactiver un employé
export const updateEmployeeStatus = async (
  id: number,
  status: boolean,
): Promise<Employee> => {
  const response = await api.patch<Employee>(
    `/users/${id}/status`,
    { status },
  );
  return response.data;
};

// Supprimer un employé
export const deleteEmployee = async (
  id: number,
): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(
    `/users/${id}`,
  );
  return response.data;
};

// Restaurer un employé supprimé
export const restoreEmployee = async (
  id: number,
): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>(
    `/users/${id}/restore`,
  );

  return response.data;
};