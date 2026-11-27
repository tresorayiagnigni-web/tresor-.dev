
import { api } from './api';

export interface Farm {
  id: number;
  nom: string;
  localisation?: string | null;
  responsable?: string | null;
  telephone?: string | null;
  status: boolean | number;
  cree_le?: string;
  modifier_le?: string;
}

export interface CreateFarmData {
  nom: string;
  localisation?: string;
  responsable?: string;
  telephone?: string;
}

export type UpdateFarmData = Partial<CreateFarmData>;

export const getFarms = async (): Promise<Farm[]> => {
  const response = await api.get<Farm[]>('/farms');
  return response.data;
};

export const createFarm = async (
  data: CreateFarmData,
): Promise<Farm> => {
  const response = await api.post<Farm>('/farms', data);
  return response.data;
};

export const updateFarm = async (
  id: number,
  data: UpdateFarmData,
): Promise<Farm> => {
  const response = await api.patch<Farm>(`/farms/${id}`, data);
  return response.data;
};

export const deleteFarm = async (id: number): Promise<Farm> => {
  const response = await api.delete<Farm>(`/farms/${id}`);
  return response.data;
};
