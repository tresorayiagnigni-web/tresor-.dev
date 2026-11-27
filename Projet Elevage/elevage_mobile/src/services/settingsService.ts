import { api } from "./api";

export interface FarmSettings {
  id: number;
  nom_exploitation: string;
  logo?: string | null;
  adresse?: string | null;
  telephone?: string | null;
  email?: string | null;
  responsable?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateSettingsData {
  nom_exploitation?: string;
  logo?: string | null;
  adresse?: string | null;
  telephone?: string | null;
  email?: string | null;
  responsable?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export const getSettings = async (): Promise<FarmSettings | null> => {
  try {
    const response = await api.get<FarmSettings | null>("/settings");

    console.log("SETTINGS API STATUS:", response.status);
    console.log(
      "SETTINGS API DATA JSON:",
      JSON.stringify(response.data, null, 2),
    );
    console.log("SETTINGS API IS NULL:", response.data === null);
    console.log("SETTINGS API TYPE:", typeof response.data);

    return response.data;
  } catch (error: any) {
    console.log("SETTINGS API ERROR:", error.response?.status);
    console.log("SETTINGS API MESSAGE:", error.response?.data || error.message);

    throw error;
  }
};

export const updateSettings = async (
  id: number,
  data: UpdateSettingsData,
): Promise<FarmSettings> => {
  const response = await api.patch<FarmSettings>(`/settings/${id}`, data);
  return response.data;
};

// Envoyer le logo vers le backend
export const uploadLogo = async (
  id: number,
  image: {
    uri: string;
    name: string;
    type: string;
  },
): Promise<FarmSettings> => {
  const formData = new FormData();

  formData.append("logo", {
    uri: image.uri,
    name: image.name,
    type: image.type,
  } as any);

  const response = await api.post<FarmSettings>(
    `/settings/${id}/logo`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 30000,
    },
  );

  return response.data;
};
