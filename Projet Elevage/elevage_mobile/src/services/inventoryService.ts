import { api } from "./api";

// ============================================
// STOCK ALIMENTAIRE
// ============================================

export interface StockItem {
  code_aliment: string;
  total_recu: number;
  total_consomme: number;
  stock_disponible: number;
}

export interface StockSummary {
  unite: "sacs";
  nombre_types_aliments: number;
  stocks: StockItem[];
  consommation_sans_code: number;
}

// ============================================
// APPROVISIONNEMENTS
// ============================================

export interface FeedDelivery {
  id: number;
  code_aliment: string;
  date_reception: string;
  quantite_tonnes: number;
  nombre_sacs: number;
  fournisseur?: string | null;
  observations?: string | null;
  createdBy?: {
    id: number;
    nom: string;
    email: string;
  };
  cree_le?: string;
}

export interface CreateFeedDeliveryData {
  code_aliment: string;
  date_reception: string;
  quantite_tonnes: number;
  farmId?: number;
  fournisseur?: string;
  observations?: string;
}

export const getStockSummary = async (): Promise<StockSummary> => {
  const response = await api.get("/inventory/stock");
  const result = response.data;

  // Ancienne structure : compatibilité avec les réponses directes.
  if (Array.isArray(result?.stocks)) {
    return {
      unite: "sacs",
      nombre_types_aliments: Number(result.nombre_types_aliments) || 0,
      stocks: result.stocks,
      consommation_sans_code: Number(result.consommation_sans_code) || 0,
    };
  }

  // Nouvelle structure : stocks organisés par ferme.
  const fermes = Array.isArray(result?.fermes) ? result.fermes : [];

  const stocksMap = new Map<string, StockSummary["stocks"][number]>();

  let consommationSansCode = 0;

  for (const ferme of fermes) {
    consommationSansCode += Number(ferme.consommation_sans_code) || 0;

    const stocksFerme = Array.isArray(ferme.stocks) ? ferme.stocks : [];

    for (const item of stocksFerme) {
      const code = String(item.code_aliment || "").trim();

      if (!code) continue;

      const current = stocksMap.get(code);

      if (current) {
        current.total_recu += Number(item.total_recu) || 0;
        current.total_consomme += Number(item.total_consomme) || 0;
        current.stock_disponible += Number(item.stock_disponible) || 0;
      } else {
        stocksMap.set(code, {
          code_aliment: code,
          total_recu: Number(item.total_recu) || 0,
          total_consomme: Number(item.total_consomme) || 0,
          stock_disponible: Number(item.stock_disponible) || 0,
        });
      }
    }
  }

  const stocks = Array.from(stocksMap.values());

  return {
    unite: "sacs",
    nombre_types_aliments: stocks.length,
    stocks,
    consommation_sans_code: consommationSansCode,
  };
};

export const getFeedDeliveries = async (): Promise<FeedDelivery[]> => {
  const response = await api.get<FeedDelivery[]>("/inventory/deliveries");
  return response.data;
};

export const createFeedDelivery = async (
  data: CreateFeedDeliveryData,
): Promise<FeedDelivery> => {
  const response = await api.post<FeedDelivery>("/inventory/deliveries", data);

  return response.data;
};

// ============================================
// INVENTAIRES PHYSIQUES
// ============================================

export type PhysicalInventoryStatus = "BROUILLON" | "TERMINE";

export type PhysicalInventoryItemType = "ALIMENT" | "OEUF" | "MATERIEL";

export type EquipmentCondition = "BON_ETAT" | "ENDOMMAGE" | "HORS_SERVICE";

// Exploitation associée à une bande
export interface PhysicalInventoryFarm {
  id: number;
  nom: string;
}

// Bande associée à un inventaire
export interface PhysicalInventoryBand {
  id: number;
  nom: string;
  numero_batiment?: string;
  race?: string;
  farm?: PhysicalInventoryFarm | null;
}

// Élément d'un inventaire physique
export interface PhysicalInventoryItem {
  id: number;
  type: PhysicalInventoryItemType;
  designation: string;
  quantite_theorique: number;
  quantite_physique: number;
  ecart: number;
  etat_materiel: EquipmentCondition | null;
  unite: string;
  observations?: string | null;
}

// Inventaire physique
export interface PhysicalInventory {
  id: number;
  date_inventaire: string;
  statut: PhysicalInventoryStatus;
  observations?: string | null;

  // Null pour les anciens inventaires sans bande associée
  bandId?: number | null;
  band?: PhysicalInventoryBand | null;

  items: PhysicalInventoryItem[];

  createdBy?: {
    id: number;
    nom: string;
    email: string;
  };

  cree_le: string;
}

// Données nécessaires pour créer un inventaire
export interface CreatePhysicalInventoryData {
  date_inventaire: string;
  bandId: number;
  observations?: string;
}

// Données nécessaires pour ajouter un élément
export interface CreatePhysicalInventoryItemData {
  type: PhysicalInventoryItemType;
  designation: string;
  quantite_physique: number;
  etat_materiel?: EquipmentCondition;
  observations?: string;
}

// ============================================
// CATALOGUE DU MATÉRIEL
// ============================================

export interface InventoryEquipment {
  id: number;
  designation: string;
  description?: string | null;
  unite: string;
  quantite_reference: number;
  actif: boolean;
}

// Référence d'un matériel pour une bande précise
export interface BandEquipmentReference {
  id: number;
  bandId: number;
  equipmentId: number;
  designation: string;
  description?: string | null;
  unite: string;
  quantite_reference: number;
  actif: boolean;
}

export interface CreateInventoryEquipmentData {
  designation: string;
  description?: string;
  unite?: string;
  quantite_reference: number;
  actif?: boolean;
}

// ============================================
// SERVICES DES INVENTAIRES PHYSIQUES
// ============================================

// Récupérer les inventaires accessibles à l'utilisateur connecté
export const getPhysicalInventories = async (): Promise<
  PhysicalInventory[]
> => {
  const response = await api.get<PhysicalInventory[]>("/inventory/physical");

  return response.data;
};

// Récupérer un inventaire par son identifiant
export const getPhysicalInventory = async (
  id: number,
): Promise<PhysicalInventory> => {
  const response = await api.get<PhysicalInventory>(
    `/inventory/physical/${id}`,
  );

  return response.data;
};

// Créer un inventaire physique pour une bande
export const createPhysicalInventory = async (
  data: CreatePhysicalInventoryData,
): Promise<PhysicalInventory> => {
  const response = await api.post<PhysicalInventory>(
    "/inventory/physical",
    data,
  );

  return response.data;
};

// Ajouter un élément à un inventaire
export const addPhysicalInventoryItem = async (
  inventoryId: number,
  data: CreatePhysicalInventoryItemData,
): Promise<PhysicalInventoryItem> => {
  const response = await api.post<PhysicalInventoryItem>(
    `/inventory/physical/${inventoryId}/items`,
    data,
  );

  return response.data;
};

// Terminer un inventaire
export const completePhysicalInventory = async (
  id: number,
): Promise<PhysicalInventory> => {
  const response = await api.patch<PhysicalInventory>(
    `/inventory/physical/${id}/complete`,
  );

  return response.data;
};

// Supprimer un inventaire (selon les autorisations du backend)
export const deletePhysicalInventory = async (
  id: number,
): Promise<{ message: string; id: number }> => {
  const response = await api.delete<{ message: string; id: number }>(
    `/inventory/physical/${id}`,
  );

  return response.data;
};

// ============================================
// SERVICES DU CATALOGUE MATÉRIEL
// ============================================

// Consulter le catalogue matériel
export const getInventoryEquipment = async (): Promise<
  InventoryEquipment[]
> => {
  const response = await api.get<InventoryEquipment[]>("/inventory/equipment");

  return response.data;
};

// Ajouter un matériel au catalogue commun
export const createInventoryEquipment = async (
  data: CreateInventoryEquipmentData,
): Promise<InventoryEquipment> => {
  const response = await api.post<InventoryEquipment>(
    "/inventory/equipment",
    data,
  );

  return response.data;
};

// Récupérer les références de matériel d'une bande
export const getBandEquipment = async (
  bandId: number,
): Promise<BandEquipmentReference[]> => {
  const response = await api.get<BandEquipmentReference[]>(
    `/inventory/bands/${bandId}/equipment`,
  );

  return response.data;
};

// Modifier la quantité de référence d'un matériel pour une bande
export const setBandEquipmentReference = async (
  bandId: number,
  equipmentId: number,
  quantite_reference: number,
): Promise<unknown> => {
  const response = await api.post(
    `/inventory/bands/${bandId}/equipment/${equipmentId}/reference`,
    { quantite_reference },
  );

  return response.data;
};

// ============================================
// STOCK RÉEL DU MATÉRIEL PAR FERME
// ============================================

export interface FarmEquipmentStock {
  id: number;

  farm: {
    id: number;
    nom: string;
  };

  equipment: {
    id: number;
    designation: string;
    unite: string;
  };

  quantite_totale: number;
  bon_etat: number;
  endommage: number;
  hors_service: number;

  cree_le: string;
  modifier_le: string;
}

// Données d'un nouvel approvisionnement matériel
export interface CreateEquipmentDeliveryData {
  equipmentId: number;
  farmId?: number;
  quantite: number;
  observations?: string;
}

// Réponse du backend après un approvisionnement
export interface EquipmentDeliveryResponse {
  message: string;
  stock: FarmEquipmentStock;
}

// Nouvelle répartition des états
export interface UpdateEquipmentDistributionData {
  bon_etat: number;
  endommage: number;
  hors_service: number;
  observations?: string;
}

// Types de mouvements matériels
export type EquipmentStockMovementType = "APPROVISIONNEMENT" | "REPARTITION";

// Historique des mouvements
export interface EquipmentStockMovement {
  id: number;
  type: EquipmentStockMovementType;

  quantite_totale_avant: number;
  quantite_totale_apres: number;

  bon_etat_avant: number;
  bon_etat_apres: number;

  endommage_avant: number;
  endommage_apres: number;

  hors_service_avant: number;
  hors_service_apres: number;

  observations?: string | null;
  cree_le: string;

  createdBy?: {
    id: number;
    nom: string;
  };
}

// ============================================
// CONSULTER LE STOCK RÉEL DU MATÉRIEL
// ============================================

export const getEquipmentStocks = async (): Promise<FarmEquipmentStock[]> => {
  const response = await api.get<FarmEquipmentStock[]>(
    "/inventory/equipment-stock",
  );

  return response.data;
};

// ============================================
// NOUVEL APPROVISIONNEMENT MATÉRIEL
// ============================================

export const createEquipmentDelivery = async (
  data: CreateEquipmentDeliveryData,
): Promise<EquipmentDeliveryResponse> => {
  const response = await api.post<EquipmentDeliveryResponse>(
    "/inventory/equipment-deliveries",
    data,
  );

  return response.data;
};

// ============================================
// MODIFIER LA RÉPARTITION DES ÉTATS
// ============================================

export const updateEquipmentDistribution = async (
  stockId: number,
  data: UpdateEquipmentDistributionData,
): Promise<EquipmentDeliveryResponse> => {
  const response = await api.patch<EquipmentDeliveryResponse>(
    `/inventory/equipment-stock/${stockId}/distribution`,
    data,
  );

  return response.data;
};

// ============================================
// HISTORIQUE D'UN STOCK MATÉRIEL
// ============================================

export const getEquipmentStockHistory = async (
  stockId: number,
): Promise<EquipmentStockMovement[]> => {
  const response = await api.get<EquipmentStockMovement[]>(
    `/inventory/equipment-stock/${stockId}/movements`,
  );

  return response.data;
};
