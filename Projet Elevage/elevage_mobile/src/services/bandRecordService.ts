
import { api } from "./api";

export interface BandRecord {
  id: number;
  date_releve: string;
  mortalite_jour: number;
  autres_sorties: number;
  effectif_restant: number;

  age_jours?: number;
  semaine?: number;

  alveoles_collectees?: number | null;

  poids_moyen_g?: number;
  poids_standard_g?: number;
  taille_echantillon?: number;

  temperature_min_c?: number;
  temperature_max_c?: number;

  code_aliment?: string;
  ration_g_par_sujet_jour?: number;
  quantite_aliment_kg?: number;
  nombre_sacs?: number;
  nombre_repas?: number;

  eau_litres?: number;

  vaccination?: string;
  traitement?: string;
  observations_sante?: string;
  ventilation?: string;
  observations?: string;
  photoUrl?: string;

  band?: {
    id: number;
    nom?: string;
    date_demarrage?: string;
    effectif_initial?: number;
  };

  bandId?: number;
}

export interface CreateBandRecordData {
  bandId: number;
  date_releve: string;

  mortalite_jour?: number;
  autres_sorties?: number;

  alveoles_collectees?: number;

  poids_moyen_g?: number;
  poids_standard_g?: number;
  taille_echantillon?: number;

  temperature_min_c?: number;
  temperature_max_c?: number;

  code_aliment?: string;
  ration_g_par_sujet_jour?: number;
  quantite_aliment_kg?: number;
  nombre_sacs?: number;
  nombre_repas?: number;

  eau_litres?: number;

  vaccination?: string;
  traitement?: string;
  observations_sante?: string;
  ventilation?: string;
  observations?: string;
  photoUrl?: string;
}

export const getBandRecords = async (): Promise<BandRecord[]> => {
  const response = await api.get<BandRecord[]>("/band-records");
  return response.data;
};

export const getBandRecord = async (
  id: number,
): Promise<BandRecord> => {
  const response = await api.get<BandRecord>(`/band-records/${id}`);
  return response.data;
};

export const createBandRecord = async (
  data: CreateBandRecordData,
): Promise<BandRecord> => {
  const response = await api.post<BandRecord>("/band-records", data);
  return response.data;
};
