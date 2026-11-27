import { api } from './api';

export interface Employee {
  id: number;
  nom: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE';
  status: boolean;
  cree_le?: string;
  modifier_le?: string;
}

export const getEmployees = async (): Promise<Employee[]> => {
  const response = await api.get<Employee[]>('/users');
  return response.data;
};

export const getEmployeeById = async (
  id: number,
): Promise<Employee> => {
  const response = await api.get<Employee>(`/users/${id}`);
  return response.data;
};
