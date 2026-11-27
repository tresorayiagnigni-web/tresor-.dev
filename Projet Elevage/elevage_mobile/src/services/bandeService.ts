
import { api } from './api';

export type BandStatus = 'GROWING' | 'TRANSFERRED' | 'ARCHIVED';

export type FarmSummary = {
  id: number;
  nom: string;
  localisation?: string | null;
  responsable?: string | null;
  telephone?: string | null;
};

export type EmployeeSummary = {
  id: number;
  nom: string;
  email: string;
};

export type Bande = {
  id: number;
  nom: string;
  numero_batiment: string;
  race: string;
  date_demarrage: string;
  effectif_initial: number;
  aliment_demarrage?: string | null;
  status: BandStatus;
  farm?: FarmSummary;
  employees?: EmployeeSummary[];
  cree_le: string;
  modifier_le: string;
};

export type CreateBandeDto = {
  nom: string;
  numero_batiment: string;
  race: string;
  date_demarrage: string;
  effectif_initial: number;
  farmId: number;
  aliment_demarrage?: string;
  employeeIds?: number[];
};

export type UpdateBandeDto = Partial<CreateBandeDto> & {
  status?: BandStatus;
};

// Récupérer les bandes accessibles à l'utilisateur connecté
export const getBandes = async (): Promise<Bande[]> => {
  const res = await api.get<Bande[]>('/bands');
  return res.data;
};

// Créer une bande (ADMIN uniquement)
export const createBande = async (
  data: CreateBandeDto,
): Promise<Bande> => {
  const res = await api.post<Bande>('/bands', data);
  return res.data;
};

// Récupérer une bande par son identifiant
export const getBandeById = async (id: number): Promise<Bande> => {
  const res = await api.get<Bande>(`/bands/${id}`);
  return res.data;
};

// Modifier une bande (ADMIN uniquement)
export const updateBande = async (
  id: number,
  data: UpdateBandeDto,
): Promise<Bande> => {
  const res = await api.patch<Bande>(`/bands/${id}`, data);
  return res.data;
};

// Archiver une bande (ADMIN uniquement)
export const archiveBande = async (id: number): Promise<void> => {
  await api.delete(`/bands/${id}`);
};
