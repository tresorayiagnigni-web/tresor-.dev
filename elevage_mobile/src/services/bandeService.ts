import { api } from './api'; // adapte si ton fichier d'instance axios a un autre nom

export type Bande = {
  id: string;
  nomExploitation: string;
  numeroPoulailler: string;
  race: string;
  dateDebut: string; // format ISO
  effectifInitial: number;
  effectifActuel: number;
  mortaliteCumulee: number;
  mortaliteCumuleePct: number;
  statut: 'en_cours' | 'terminee';
  createdAt: string;
  updatedAt: string;
};

export type CreateBandeDto = {
  nomExploitation: string;
  numeroPoulailler: string;
  race: string;
  dateDebut: string;
  effectifInitial: number;
};

export const getBandes = async (): Promise<Bande[]> => {
  const res = await api.get('/bandes');
  return res.data;
};

export const createBande = async (data: CreateBandeDto): Promise<Bande> => {
  const res = await api.post('/bandes', data);
  return res.data;
};

export const getBandeById = async (id: string): Promise<Bande> => {
  const res = await api.get(`/bandes/${id}`);
  return res.data;
};