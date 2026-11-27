import React, { useCallback, useEffect, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import {
  getStockSummary,
  getFeedDeliveries,
  createFeedDelivery,
  getInventoryEquipment,
  createInventoryEquipment,
  StockSummary,
  FeedDelivery,
  InventoryEquipment,

  // STOCK RÉEL DU MATÉRIEL
  getEquipmentStocks,
  createEquipmentDelivery,
  updateEquipmentDistribution,
  getEquipmentStockHistory,
  FarmEquipmentStock,
  EquipmentStockMovement,
} from "../../services/inventoryService";

import { getFarms, Farm } from "../../services/farmService";

import { getBandRecords, BandRecord } from "../../services/bandRecordService";

type InventoryRole = "ADMIN" | "EMPLOYEE";

type Props = {
  role?: InventoryRole;
};

const COLORS = {
  background: "#F7F4F1",
  white: "#FFFFFF",
  primary: "#C97965",
  primaryLight: "#F9E8E3",
  text: "#292524",
  secondary: "#89817D",
  border: "#EAE4DF",
  green: "#648B69",
  red: "#D96C65",
};

const today = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatNumber = (value: number | string | null | undefined) =>
  Number(value || 0).toLocaleString("fr-FR", {
    maximumFractionDigits: 2,
  });

const formatDate = (value: string) => {
  if (!value) return "Date inconnue";
  const parts = value.slice(0, 10).split("-");
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : value;
};

const getErrorMessage = (error: any) => {
  const message = error?.response?.data?.message;

  if (Array.isArray(message)) return message.join("\n");
  if (typeof message === "string") return message;

  return "Une erreur est survenue. Vérifie ta connexion et réessaie.";
};

export default function InventoryScreen({ role = "ADMIN" }: Props) {
  const isAdmin = role === "ADMIN";

  // DONNÉES GÉNÉRALES
  const [stock, setStock] = useState<StockSummary | null>(null);
  const [deliveries, setDeliveries] = useState<FeedDelivery[]>([]);
  const [records, setRecords] = useState<BandRecord[]>([]);

  // INVENTAIRES PHYSIQUES
  const [equipmentList, setEquipmentList] = useState<InventoryEquipment[]>([]);

  // CATALOGUE DU MATÉRIEL
  const [showEquipmentForm, setShowEquipmentForm] = useState(false);
  const [equipmentDesignation, setEquipmentDesignation] = useState("");
  const [equipmentDescription, setEquipmentDescription] = useState("");
  const [equipmentUnit, setEquipmentUnit] = useState("unité");
  const [equipmentReference, setEquipmentReference] = useState("");
  const [equipmentActive, setEquipmentActive] = useState(true);
  const [equipmentSubmitting, setEquipmentSubmitting] = useState(false);

  // ============================================
  // STOCK RÉEL DU MATÉRIEL PAR FERME
  // ============================================

  const [equipmentStocks, setEquipmentStocks] = useState<FarmEquipmentStock[]>(
    [],
  );

  const [farms, setFarms] = useState<Farm[]>([]);

  // FERME DESTINATAIRE DE L'APPROVISIONNEMENT ALIMENTAIRE
  const [feedDeliveryFarmId, setFeedDeliveryFarmId] = useState<number | null>(
    null,
  );

  // APPROVISIONNEMENT MATÉRIEL
  const [showEquipmentDeliveryForm, setShowEquipmentDeliveryForm] =
    useState(false);

  const [deliveryEquipmentId, setDeliveryEquipmentId] = useState<number | null>(
    null,
  );

  const [deliveryFarmId, setDeliveryFarmId] = useState<number | null>(null);

  const [deliveryQuantity, setDeliveryQuantity] = useState("");
  const [deliveryObservations, setDeliveryObservations] = useState("");
  const [equipmentDeliverySubmitting, setEquipmentDeliverySubmitting] =
    useState(false);

  // RÉPARTITION DU MATÉRIEL
  const [distributionStockId, setDistributionStockId] = useState<number | null>(
    null,
  );

  const [distributionGood, setDistributionGood] = useState("");
  const [distributionDamaged, setDistributionDamaged] = useState("");
  const [distributionOutOfService, setDistributionOutOfService] = useState("");

  const [distributionObservations, setDistributionObservations] = useState("");

  const [distributionSubmitting, setDistributionSubmitting] = useState(false);

  // HISTORIQUE DU MATÉRIEL
  const [selectedHistoryStockId, setSelectedHistoryStockId] = useState<
    number | null
  >(null);

  const [equipmentMovements, setEquipmentMovements] = useState<
    EquipmentStockMovement[]
  >([]);

  const [equipmentHistoryLoading, setEquipmentHistoryLoading] = useState(false);

  const [showEquipmentDropdown, setShowEquipmentDropdown] = useState(false);

  // CHARGEMENT
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // APPROVISIONNEMENT : ADMIN UNIQUEMENT
  const [codeAliment, setCodeAliment] = useState("");
  const [dateReception, setDateReception] = useState(today());
  const [quantiteTonnes, setQuantiteTonnes] = useState("");
  const [fournisseur, setFournisseur] = useState("");
  const [observations, setObservations] = useState("");

  const loadData = useCallback(async () => {
    try {
      // DONNÉES DU CATALOGUE ET DU STOCK RÉEL DU MATÉRIEL
      const [equipmentData, equipmentStockData] = await Promise.all([
        getInventoryEquipment(),
        getEquipmentStocks(),
      ]);

      setEquipmentList(equipmentData);
      setEquipmentStocks(equipmentStockData);

      // DONNÉES ADMINISTRATEUR
      if (isAdmin) {
        const [stockData, deliveryData, recordData, farmsData] =
          await Promise.all([
            getStockSummary(),
            getFeedDeliveries(),
            getBandRecords(),
            getFarms(),
          ]);

        setStock(stockData);
        setDeliveries(deliveryData);
        setRecords(recordData);
        setFarms(farmsData);
      } else {
        // L'EMPLOYÉ NE VOIT PAS LES DONNÉES ADMINISTRATEUR
        setStock(null);
        setDeliveries([]);
        setRecords([]);
        setFarms([]);
      }
    } catch (error) {
      Alert.alert("Erreur", getErrorMessage(error));
    }
  }, [isAdmin]);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await loadData();
      setLoading(false);
    };

    initialize();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // CONVERSION TONNES -> SACS
  const tonnes = Number(quantiteTonnes.replace(",", "."));

  const sacsEstimes =
    quantiteTonnes.trim() !== "" && Number.isFinite(tonnes) && tonnes > 0
      ? tonnes * 20
      : 0;

  // HISTORIQUE DES MOUVEMENTS : ADMIN UNIQUEMENT
  type StockMovement = {
    id: string;
    type: "ENTREE" | "SORTIE";
    code_aliment: string;
    date: string;
    nombre_sacs: number;
    origine: string;
  };

  const movements: StockMovement[] = [
    ...deliveries.map((delivery) => ({
      id: `entree-${delivery.id}`,
      type: "ENTREE" as const,
      code_aliment: delivery.code_aliment,
      date: delivery.date_reception,
      nombre_sacs: Number(delivery.nombre_sacs) || 0,
      origine: delivery.fournisseur || "Approvisionnement",
    })),

    ...records
      .filter((record) => Number(record.nombre_sacs) > 0)
      .map((record) => ({
        id: `sortie-${record.id}`,
        type: "SORTIE" as const,
        code_aliment: record.code_aliment?.trim() || "Aliment non précisé",
        date: record.date_releve,
        nombre_sacs: Number(record.nombre_sacs) || 0,
        origine: record.band?.nom || "Consommation journalière",
      })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  // VALIDATION DES QUANTITÉS
  const validateQuantity = (value: string): number | null => {
    const normalized = value.trim().replace(",", ".");

    if (normalized === "" || !/^\d+(\.\d{1,2})?$/.test(normalized)) {
      return null;
    }

    const quantity = Number(normalized);

    return Number.isFinite(quantity) && quantity >= 0 ? quantity : null;
  };

  // ============================================
  // APPROVISIONNEMENT DU STOCK MATÉRIEL
  // ============================================

  const handleCreateEquipmentDelivery = async () => {
    if (!deliveryEquipmentId) {
      Alert.alert("Information manquante", "Sélectionne un matériel.");
      return;
    }

    // L'administrateur doit choisir une ferme.
    // L'employé laisse le backend déterminer sa ferme.
    if (isAdmin && !deliveryFarmId) {
      Alert.alert("Information manquante", "Sélectionne une ferme.");
      return;
    }

    const quantity = validateQuantity(deliveryQuantity);

    if (quantity === null || quantity <= 0) {
      Alert.alert(
        "Quantité invalide",
        "Saisis une quantité supérieure à zéro avec deux décimales maximum.",
      );
      return;
    }

    try {
      setEquipmentDeliverySubmitting(true);

      await createEquipmentDelivery({
        equipmentId: deliveryEquipmentId,
        ...(isAdmin && deliveryFarmId ? { farmId: deliveryFarmId } : {}),
        quantite: quantity,
        observations: deliveryObservations.trim() || undefined,
      });

      setDeliveryEquipmentId(null);
      setDeliveryFarmId(null);
      setDeliveryQuantity("");
      setDeliveryObservations("");
      setShowEquipmentDeliveryForm(false);

      await loadData();

      Alert.alert(
        "Approvisionnement enregistré",
        "Le stock matériel a été actualisé avec succès.",
      );
    } catch (error) {
      Alert.alert("Échec de l'approvisionnement", getErrorMessage(error));
    } finally {
      setEquipmentDeliverySubmitting(false);
    }
  };

  // ============================================
  // RÉPARTITION DU STOCK MATÉRIEL
  // ============================================

  const handleUpdateEquipmentDistribution = async () => {
    if (!distributionStockId) {
      Alert.alert("Erreur", "Aucun stock matériel sélectionné.");
      return;
    }

    const selectedStock = equipmentStocks.find(
      (item) => item.id === distributionStockId,
    );

    if (!selectedStock) {
      Alert.alert("Erreur", "Ce stock matériel est introuvable.");
      return;
    }

    const good = validateQuantity(distributionGood);
    const damaged = validateQuantity(distributionDamaged);
    const outOfService = validateQuantity(distributionOutOfService);

    if (good === null || damaged === null || outOfService === null) {
      Alert.alert(
        "Quantités invalides",
        "Saisis des quantités positives ou nulles, avec deux décimales maximum, dans les trois champs.",
      );
      return;
    }

    // Comparaison en centièmes pour éviter les erreurs décimales.
    const toCents = (value: number) => Math.round(value * 100);

    const totalDistributed =
      toCents(good) + toCents(damaged) + toCents(outOfService);

    const totalStock = toCents(Number(selectedStock.quantite_totale));

    if (totalDistributed !== totalStock) {
      Alert.alert(
        "Répartition incorrecte",
        `La somme des quantités doit être égale au stock total (${formatNumber(selectedStock.quantite_totale)} ${selectedStock.equipment.unite}).`,
      );
      return;
    }

    try {
      setDistributionSubmitting(true);

      await updateEquipmentDistribution(distributionStockId, {
        bon_etat: good,
        endommage: damaged,
        hors_service: outOfService,
        observations: distributionObservations.trim() || undefined,
      });

      setDistributionStockId(null);
      setDistributionGood("");
      setDistributionDamaged("");
      setDistributionOutOfService("");
      setDistributionObservations("");

      await loadData();

      Alert.alert(
        "Répartition enregistrée",
        "Les quantités par état ont été mises à jour.",
      );
    } catch (error) {
      Alert.alert("Échec de la répartition", getErrorMessage(error));
    } finally {
      setDistributionSubmitting(false);
    }
  };

  // ============================================
  // HISTORIQUE DES MOUVEMENTS DU MATÉRIEL
  // ============================================

  const handleLoadEquipmentHistory = async (stockId: number) => {
    try {
      setEquipmentHistoryLoading(true);
      setSelectedHistoryStockId(stockId);
      setEquipmentMovements([]);

      const history = await getEquipmentStockHistory(stockId);

      setEquipmentMovements(history);
    } catch (error) {
      setSelectedHistoryStockId(null);

      Alert.alert("Erreur", getErrorMessage(error));
    } finally {
      setEquipmentHistoryLoading(false);
    }
  };

  // ENREGISTRER UN MATÉRIEL DANS LE CATALOGUE COMMUN
  const handleCreateEquipment = async () => {
    const designation = equipmentDesignation.trim();
    const description = equipmentDescription.trim();
    const unite = equipmentUnit.trim() || "unité";
    const reference = validateQuantity(equipmentReference);

    if (!designation) {
      Alert.alert(
        "Information manquante",
        "Saisis la désignation du matériel.",
      );
      return;
    }

    if (reference === null) {
      Alert.alert(
        "Quantité invalide",
        "Saisis une quantité de référence valide.",
      );
      return;
    }

    try {
      setEquipmentSubmitting(true);

      await createInventoryEquipment({
        designation,
        description: description || undefined,
        unite,
        quantite_reference: reference,
        actif: equipmentActive,
      });

      setEquipmentDesignation("");
      setEquipmentDescription("");
      setEquipmentUnit("unité");
      setEquipmentReference("");
      setEquipmentActive(true);
      setShowEquipmentForm(false);

      await loadData();

      Alert.alert(
        "Matériel enregistré",
        `${designation} a été ajouté au catalogue commun.`,
      );
    } catch (error) {
      Alert.alert("Échec de l'enregistrement", getErrorMessage(error));
    } finally {
      setEquipmentSubmitting(false);
    }
  };

  // ENREGISTRER UN APPROVISIONNEMENT : ADMIN ET EMPLOYEE
  const handleSubmit = async () => {
    const normalizedCode = codeAliment.trim();
    const normalizedQuantity = quantiteTonnes.trim().replace(",", ".");

    if (!normalizedCode) {
      Alert.alert("Information manquante", "Saisis le code de l'aliment.");
      return;
    }

    if (!dateReception.trim()) {
      Alert.alert("Information manquante", "Saisis la date de réception.");
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateReception)) {
      Alert.alert("Date invalide", "Utilise le format AAAA-MM-JJ.");
      return;
    }

    if (!/^\d+(\.\d{1,3})?$/.test(normalizedQuantity)) {
      Alert.alert(
        "Quantité invalide",
        "Saisis une quantité positive avec trois décimales maximum.",
      );
      return;
    }

    const quantity = Number(normalizedQuantity);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      Alert.alert(
        "Quantité invalide",
        "La quantité doit être supérieure à zéro.",
      );
      return;
    }

    // L'administrateur doit sélectionner une ferme.
    // L'employé laisse le backend déterminer sa ferme.
    if (isAdmin && !feedDeliveryFarmId) {
      Alert.alert("Information manquante", "Sélectionne une ferme.");
      return;
    }

    try {
      setSubmitting(true);

      await createFeedDelivery({
        code_aliment: normalizedCode,
        date_reception: dateReception,
        quantite_tonnes: quantity,
        ...(isAdmin && feedDeliveryFarmId
          ? { farmId: feedDeliveryFarmId }
          : {}),
        fournisseur: fournisseur.trim() || undefined,
        observations: observations.trim() || undefined,
      });

      // Réinitialisation du formulaire
      setCodeAliment("");
      setQuantiteTonnes("");
      setFournisseur("");
      setObservations("");
      setDateReception(today());
      setFeedDeliveryFarmId(null);

      await loadData();

      Alert.alert(
        "Approvisionnement enregistré",
        `${formatNumber(quantity * 20)} sacs ont été ajoutés au stock.`,
      );
    } catch (error) {
      Alert.alert("Échec de l'enregistrement", getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  // CHAMP DE SAISIE RÉUTILISABLE
  const renderField = (
    label: string,
    value: string,
    onChangeText: (value: string) => void,
    placeholder: string,
    options?: {
      keyboardType?: "default" | "decimal-pad";
      multiline?: boolean;
    },
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, options?.multiline && styles.multilineInput]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.secondary}
        keyboardType={options?.keyboardType || "default"}
        multiline={options?.multiline}
        textAlignVertical={options?.multiline ? "top" : "center"}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement des inventaires...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[COLORS.primary]}
        />
      }
    >
      {/* EN-TÊTE */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Inventaires</Text>
          <Text style={styles.subtitle}>
            {isAdmin
              ? "Gestion des inventaires et du stock"
              : "Inventaires de tes bandes assignées"}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={refreshing}
        >
          <Ionicons name="refresh-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* CATALOGUE COMMUN DU MATÉRIEL */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Catalogue du matériel</Text>
          <Text style={styles.inventorySubtitle}>
            Matériels disponibles pour les inventaires
          </Text>
        </View>

        <View style={styles.inventoryCount}>
          <Text style={styles.inventoryCountText}>{equipmentList.length}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.newInventoryButton}
        onPress={() => setShowEquipmentForm((previous) => !previous)}
      >
        <Ionicons name="add-circle-outline" size={20} color={COLORS.white} />
        <Text style={styles.newInventoryButtonText}>
          {showEquipmentForm ? "Fermer le formulaire" : "Ajouter un matériel"}
        </Text>
      </TouchableOpacity>

      {/* FORMULAIRE DE CRÉATION DU MATÉRIEL */}
      {showEquipmentForm && (
        <View style={styles.formCard}>
          <Text style={styles.inventoryFormTitle}>Nouveau matériel</Text>

          {renderField(
            "Désignation *",
            equipmentDesignation,
            setEquipmentDesignation,
            "Ex : Abreuvoir automatique",
          )}

          {renderField(
            "Description",
            equipmentDescription,
            setEquipmentDescription,
            "Description du matériel (facultatif)",
            { multiline: true },
          )}

          {renderField(
            "Unité",
            equipmentUnit,
            setEquipmentUnit,
            "Ex : unité, pièce, lot",
          )}

          {renderField(
            "Quantité de référence *",
            equipmentReference,
            setEquipmentReference,
            "Ex : 25",
            { keyboardType: "decimal-pad" },
          )}

          <TouchableOpacity
            style={styles.equipmentOption}
            onPress={() => setEquipmentActive((previous) => !previous)}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={styles.equipmentOptionText}>Matériel actif</Text>

              <Ionicons
                name={equipmentActive ? "checkbox" : "square-outline"}
                size={22}
                color={equipmentActive ? COLORS.green : COLORS.secondary}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.submitButton,
              equipmentSubmitting && styles.disabledButton,
            ]}
            onPress={handleCreateEquipment}
            disabled={equipmentSubmitting}
          >
            {equipmentSubmitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color={COLORS.white} />
                <Text style={styles.submitText}>Enregistrer le matériel</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowEquipmentForm(false)}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* LISTE DU CATALOGUE */}
      {equipmentList.length > 0 ? (
        equipmentList.map((equipment) => (
          <View key={equipment.id} style={styles.inventoryItemCard}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={styles.inventoryItemName}>
                {equipment.designation}
              </Text>

              <Text
                style={{
                  color: equipment.actif ? COLORS.green : COLORS.red,
                  fontSize: 11,
                  fontWeight: "800",
                }}
              >
                {equipment.actif ? "ACTIF" : "INACTIF"}
              </Text>
            </View>

            {equipment.description ? (
              <Text style={styles.inventoryItemType}>
                {equipment.description}
              </Text>
            ) : null}

            <Text style={styles.inventoryQuantityText}>
              Référence : {formatNumber(equipment.quantite_reference)}{" "}
              {equipment.unite}
            </Text>
          </View>
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Ionicons
            name="construct-outline"
            size={28}
            color={COLORS.secondary}
          />
          <Text style={styles.emptyText}>
            Aucun matériel enregistré dans le catalogue.
          </Text>
        </View>
      )}

      {/* ============================================ */}
      {/* STOCK RÉEL DU MATÉRIEL PAR FERME */}
      {/* ============================================ */}

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Stock réel du matériel</Text>
          <Text style={styles.inventorySubtitle}>
            Suivi des équipements et de leur état par ferme
          </Text>
        </View>

        <View style={styles.inventoryCount}>
          <Text style={styles.inventoryCountText}>
            {equipmentStocks.length}
          </Text>
        </View>
      </View>

      {/* BOUTON APPROVISIONNEMENT */}
      <TouchableOpacity
        style={styles.newInventoryButton}
        onPress={() => {
          setShowEquipmentDeliveryForm((previous) => !previous);
          setDistributionStockId(null);
        }}
      >
        <Ionicons name="add-circle-outline" size={20} color={COLORS.white} />
        <Text style={styles.newInventoryButtonText}>
          {showEquipmentDeliveryForm
            ? "Fermer le formulaire"
            : "Nouvel approvisionnement matériel"}
        </Text>
      </TouchableOpacity>

      {/* FORMULAIRE APPROVISIONNEMENT */}
      {showEquipmentDeliveryForm && (
        <View style={styles.formCard}>
          <Text style={styles.inventoryFormTitle}>
            Nouvel approvisionnement en matériel
          </Text>

          <Text style={styles.label}>Matériel *</Text>

          {equipmentList
            .filter((equipment) => equipment.actif)
            .map((equipment) => (
              <TouchableOpacity
                key={equipment.id}
                style={[
                  styles.equipmentOption,
                  deliveryEquipmentId === equipment.id && {
                    borderColor: COLORS.primary,
                    backgroundColor: COLORS.primaryLight,
                  },
                ]}
                onPress={() => setDeliveryEquipmentId(equipment.id)}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={styles.equipmentOptionText}>
                    {equipment.designation}
                  </Text>

                  <Ionicons
                    name={
                      deliveryEquipmentId === equipment.id
                        ? "radio-button-on"
                        : "radio-button-off"
                    }
                    size={21}
                    color={COLORS.primary}
                  />
                </View>
              </TouchableOpacity>
            ))}

          {/* CHOIX DE LA FERME : ADMIN UNIQUEMENT */}
          {isAdmin && (
            <>
              <Text style={[styles.label, { marginTop: 12 }]}>
                Ferme destinataire *
              </Text>

              {farms.map((farm) => (
                <TouchableOpacity
                  key={farm.id}
                  style={[
                    styles.equipmentOption,
                    deliveryFarmId === farm.id && {
                      borderColor: COLORS.primary,
                      backgroundColor: COLORS.primaryLight,
                    },
                  ]}
                  onPress={() => setDeliveryFarmId(farm.id)}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text style={styles.equipmentOptionText}>{farm.nom}</Text>

                    <Ionicons
                      name={
                        deliveryFarmId === farm.id
                          ? "radio-button-on"
                          : "radio-button-off"
                      }
                      size={21}
                      color={COLORS.primary}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          {!isAdmin && (
            <Text style={styles.inventorySubtitle}>
              La ferme sera automatiquement déterminée selon ton affectation.
            </Text>
          )}

          {renderField(
            "Quantité reçue *",
            deliveryQuantity,
            setDeliveryQuantity,
            "Ex : 50",
            { keyboardType: "decimal-pad" },
          )}

          {renderField(
            "Observations",
            deliveryObservations,
            setDeliveryObservations,
            "Fournisseur, remarques...",
            { multiline: true },
          )}

          <TouchableOpacity
            style={[
              styles.submitButton,
              equipmentDeliverySubmitting && styles.disabledButton,
            ]}
            onPress={handleCreateEquipmentDelivery}
            disabled={equipmentDeliverySubmitting}
          >
            {equipmentDeliverySubmitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color={COLORS.white} />
                <Text style={styles.submitText}>
                  Enregistrer l'approvisionnement
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowEquipmentDeliveryForm(false)}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* LISTE DES STOCKS MATÉRIELS */}
      {equipmentStocks.length > 0 ? (
        equipmentStocks.map((item) => (
          <View key={item.id} style={styles.inventoryItemCard}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.inventoryItemName}>
                  {item.equipment.designation}
                </Text>

                <Text style={styles.inventorySubtitle}>
                  Ferme : {item.farm.nom}
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: COLORS.primaryLight,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 10,
                }}
              >
                <Text
                  style={{
                    color: COLORS.primary,
                    fontWeight: "800",
                    fontSize: 13,
                  }}
                >
                  {formatNumber(item.quantite_totale)} {item.equipment.unite}
                </Text>
              </View>
            </View>

            <View style={{ marginTop: 14, gap: 9 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ color: COLORS.green, fontWeight: "700" }}>
                  Bon état
                </Text>
                <Text style={{ color: COLORS.text, fontWeight: "700" }}>
                  {formatNumber(item.bon_etat)}
                </Text>
              </View>

              <View
                style={{
                  height: 7,
                  backgroundColor: COLORS.border,
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    height: 7,
                    width: `${
                      Number(item.quantite_totale) > 0
                        ? (Number(item.bon_etat) /
                            Number(item.quantite_totale)) *
                          100
                        : 0
                    }%`,
                    backgroundColor: COLORS.green,
                    borderRadius: 10,
                  }}
                />
              </View>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ color: "#C58A42", fontWeight: "700" }}>
                  Endommagé
                </Text>
                <Text style={{ color: COLORS.text, fontWeight: "700" }}>
                  {formatNumber(item.endommage)}
                </Text>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ color: COLORS.red, fontWeight: "700" }}>
                  Hors service
                </Text>
                <Text style={{ color: COLORS.text, fontWeight: "700" }}>
                  {formatNumber(item.hors_service)}
                </Text>
              </View>
            </View>

            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: COLORS.border,
                marginTop: 14,
                paddingTop: 12,
                gap: 9,
              }}
            >
              <TouchableOpacity
                style={styles.equipmentOption}
                onPress={() => {
                  setDistributionStockId(
                    distributionStockId === item.id ? null : item.id,
                  );

                  setDistributionGood(String(item.bon_etat));
                  setDistributionDamaged(String(item.endommage));
                  setDistributionOutOfService(String(item.hors_service));
                  setDistributionObservations("");
                  setShowEquipmentDeliveryForm(false);
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={styles.equipmentOptionText}>
                    Répartir les quantités
                  </Text>

                  <Ionicons
                    name="options-outline"
                    size={20}
                    color={COLORS.primary}
                  />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.equipmentOption}
                onPress={() => handleLoadEquipmentHistory(item.id)}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={styles.equipmentOptionText}>
                    Historique des mouvements
                  </Text>

                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={COLORS.primary}
                  />
                </View>
              </TouchableOpacity>
            </View>

            {/* FORMULAIRE DE RÉPARTITION */}
            {distributionStockId === item.id && (
              <View
                style={{
                  marginTop: 14,
                  padding: 12,
                  backgroundColor: COLORS.background,
                  borderRadius: 12,
                }}
              >
                <Text style={styles.inventoryFormTitle}>
                  Répartition du matériel
                </Text>

                <Text style={styles.inventorySubtitle}>
                  Stock total : {formatNumber(item.quantite_totale)}{" "}
                  {item.equipment.unite}
                </Text>

                {renderField(
                  "Quantité en bon état",
                  distributionGood,
                  setDistributionGood,
                  "0",
                  { keyboardType: "decimal-pad" },
                )}

                {renderField(
                  "Quantité endommagée",
                  distributionDamaged,
                  setDistributionDamaged,
                  "0",
                  { keyboardType: "decimal-pad" },
                )}

                {renderField(
                  "Quantité hors service",
                  distributionOutOfService,
                  setDistributionOutOfService,
                  "0",
                  { keyboardType: "decimal-pad" },
                )}

                {renderField(
                  "Observations",
                  distributionObservations,
                  setDistributionObservations,
                  "Remarques facultatives...",
                  { multiline: true },
                )}

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    distributionSubmitting && styles.disabledButton,
                  ]}
                  onPress={handleUpdateEquipmentDistribution}
                  disabled={distributionSubmitting}
                >
                  {distributionSubmitting ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <>
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={20}
                        color={COLORS.white}
                      />
                      <Text style={styles.submitText}>
                        Enregistrer la répartition
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setDistributionStockId(null)}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* HISTORIQUE DU STOCK SÉLECTIONNÉ */}
            {selectedHistoryStockId === item.id && (
              <View
                style={{
                  marginTop: 14,
                  padding: 12,
                  backgroundColor: COLORS.background,
                  borderRadius: 12,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={styles.inventoryFormTitle}>
                    Historique des mouvements
                  </Text>

                  <TouchableOpacity
                    onPress={() => {
                      setSelectedHistoryStockId(null);
                      setEquipmentMovements([]);
                    }}
                  >
                    <Ionicons
                      name="close-circle-outline"
                      size={23}
                      color={COLORS.secondary}
                    />
                  </TouchableOpacity>
                </View>

                {equipmentHistoryLoading ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : equipmentMovements.length > 0 ? (
                  equipmentMovements.map((movement) => (
                    <View
                      key={movement.id}
                      style={{
                        padding: 13,
                        marginBottom: 10,
                        backgroundColor: COLORS.background,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                      }}
                    >
                      <Text
                        style={{
                          color:
                            movement.type === "APPROVISIONNEMENT"
                              ? COLORS.green
                              : COLORS.primary,
                          fontWeight: "800",
                        }}
                      >
                        {movement.type === "APPROVISIONNEMENT"
                          ? "APPROVISIONNEMENT"
                          : "RÉPARTITION"}
                      </Text>

                      <Text style={styles.inventorySubtitle}>
                        Date : {formatDate(movement.cree_le)}
                      </Text>

                      <Text style={styles.inventoryQuantityText}>
                        Stock : {formatNumber(movement.quantite_totale_avant)}
                        {" → "}
                        {formatNumber(movement.quantite_totale_apres)}
                      </Text>

                      <Text style={styles.inventoryQuantityText}>
                        Bon état : {formatNumber(movement.bon_etat_apres)}
                        {" | "}
                        Endommagé : {formatNumber(movement.endommage_apres)}
                        {" | "}
                        Hors service :{" "}
                        {formatNumber(movement.hors_service_apres)}
                      </Text>

                      {movement.createdBy?.nom ? (
                        <Text style={styles.inventorySubtitle}>
                          Enregistré par : {movement.createdBy.nom}
                        </Text>
                      ) : null}

                      {movement.observations ? (
                        <Text style={styles.inventorySubtitle}>
                          {movement.observations}
                        </Text>
                      ) : null}
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>
                    Aucun mouvement enregistré pour ce stock.
                  </Text>
                )}
              </View>
            )}
          </View>
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Ionicons name="cube-outline" size={28} color={COLORS.secondary} />
          <Text style={styles.emptyText}>
            Aucun stock matériel disponible pour cette ferme.
          </Text>
        </View>
      )}

      {/* APPROVISIONNEMENT EN ALIMENT : ADMIN ET EMPLOYEE */}

      <View>
        <Text style={styles.sectionTitle}>Nouvel approvisionnement</Text>

        <View style={styles.formCard}>
          {/* CHOIX DE LA FERME : ADMIN UNIQUEMENT */}
          {isAdmin && (
            <>
              <Text style={[styles.label, { marginTop: 12 }]}>
                Ferme destinataire *
              </Text>

              {farms.map((farm) => (
                <TouchableOpacity
                  key={farm.id}
                  style={[
                    styles.equipmentOption,
                    feedDeliveryFarmId === farm.id && {
                      borderColor: COLORS.primary,
                      backgroundColor: COLORS.primaryLight,
                    },
                  ]}
                  onPress={() => setFeedDeliveryFarmId(farm.id)}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text style={styles.equipmentOptionText}>{farm.nom}</Text>

                    <Ionicons
                      name={
                        feedDeliveryFarmId === farm.id
                          ? "radio-button-on"
                          : "radio-button-off"
                      }
                      size={21}
                      color={COLORS.primary}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          {!isAdmin && (
            <Text style={styles.inventorySubtitle}>
              La ferme sera automatiquement déterminée selon ton affectation.
            </Text>
          )}

          {renderField(
            "Code de l'aliment *",
            codeAliment,
            setCodeAliment,
            "Exemple : DEMARRAGE",
          )}

          {renderField(
            "Date de réception *",
            dateReception,
            setDateReception,
            "AAAA-MM-JJ",
          )}

          {renderField(
            "Quantité reçue (tonnes) *",
            quantiteTonnes,
            setQuantiteTonnes,
            "Exemple : 2.5",
            { keyboardType: "decimal-pad" },
          )}

          <View style={styles.conversionBox}>
            <Ionicons
              name="calculator-outline"
              size={22}
              color={COLORS.green}
            />

            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text
                style={{ fontSize: 14, fontWeight: "600", color: COLORS.green }}
              >
                Total sacs :{" "}
                {formatNumber(
                  (Number(quantiteTonnes.replace(",", ".")) || 0) * 20,
                )}{" "}
                sacs
              </Text>
            </View>
          </View>

          {renderField(
            "Fournisseur",
            fournisseur,
            setFournisseur,
            "Nom du fournisseur",
          )}

          {renderField(
            "Observations",
            observations,
            setObservations,
            "Remarques éventuelles...",
            { multiline: true },
          )}

          <TouchableOpacity
            style={[styles.submitButton, submitting && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.submitButtonText}>
              {submitting
                ? "Enregistrement..."
                : "Enregistrer l'approvisionnement"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* CONTENEUR DE L'HISTORIQUE */}
        <View>
          {/* HISTORIQUE DES MOUVEMENTS : ADMIN UNIQUEMENT */}

          {/* HISTORIQUE DES MOUVEMENTS : ADMIN UNIQUEMENT */}

          {isAdmin && (
            <>
              <Text style={styles.sectionTitle}>Historique des mouvements</Text>

              <View style={styles.movementLegend}>
                <Text style={styles.legendEntry}>+ Entrées</Text>
                <Text style={styles.legendExit}>− Sorties</Text>
              </View>

              {movements.length > 0 ? (
                movements.map((movement) => {
                  const isEntry = movement.type === "ENTREE";

                  return (
                    <View key={movement.id} style={styles.historyCard}>
                      <View
                        style={[
                          styles.historyIcon,
                          {
                            backgroundColor: isEntry ? "#EDF4ED" : "#FCEBE9",
                          },
                        ]}
                      >
                        <Ionicons
                          name={
                            isEntry ? "arrow-down-outline" : "arrow-up-outline"
                          }
                          size={22}
                          color={isEntry ? COLORS.green : COLORS.red}
                        />
                      </View>

                      <View style={styles.historyInfo}>
                        <Text style={styles.historyName}>
                          {movement.code_aliment}
                        </Text>

                        <Text style={styles.historyDate}>
                          {formatDate(movement.date)}
                        </Text>

                        <Text style={styles.historySupplier}>
                          {isEntry ? "Approvisionnement" : "Consommation"} ·{" "}
                          {movement.origine}
                        </Text>
                      </View>

                      <View style={styles.historyQuantity}>
                        <Text
                          style={[
                            styles.historyNumber,
                            {
                              color: isEntry ? COLORS.green : COLORS.red,
                            },
                          ]}
                        >
                          {isEntry ? "+" : "-"}
                          {formatNumber(movement.nombre_sacs)}
                        </Text>

                        <Text style={styles.historyUnit}>sacs</Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>
                    Aucun mouvement de stock enregistré.
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 35,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.secondary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  headerTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  title: {
    fontSize: 23,
    fontWeight: "800",
    color: COLORS.text,
  },
  subtitle: {
    color: COLORS.secondary,
    fontSize: 13,
    marginTop: 5,
  },
  refreshButton: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 13,
    marginTop: 12,
  },
  inventorySubtitle: {
    color: COLORS.secondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
    marginBottom: 4,
  },
  inventoryCount: {
    backgroundColor: COLORS.primaryLight,
    width: 35,
    height: 35,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  inventoryCountText: {
    color: COLORS.primary,
    fontWeight: "800",
  },
  newInventoryButton: {
    backgroundColor: COLORS.primary,
    minHeight: 48,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 9,
    marginBottom: 15,
  },
  newInventoryButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "800",
  },
  formCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 18,
  },
  inventoryFormTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 15,
  },
  bandList: {
    marginBottom: 15,
  },
  bandOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  bandOptionActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  bandOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },
  bandOptionInfo: {
    flex: 1,
    marginLeft: 10,
  },
  bandOptionName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
  },
  bandOptionDetails: {
    color: COLORS.secondary,
    fontSize: 11,
    marginTop: 3,
  },
  inventoryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inventoryIcon: {
    width: 43,
    height: 43,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  inventoryInfo: {
    flex: 1,
    marginLeft: 11,
    paddingRight: 6,
  },
  inventoryName: {
    color: COLORS.text,
    fontWeight: "800",
    fontSize: 14,
  },
  inventoryDate: {
    color: COLORS.secondary,
    fontSize: 12,
    marginTop: 4,
  },
  inventoryBand: {
    color: COLORS.secondary,
    fontSize: 11,
    marginTop: 3,
  },
  inventoryItems: {
    color: COLORS.secondary,
    fontSize: 11,
    marginTop: 4,
  },
  inventoryStatus: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: "flex-start",
  },
  inventoryCompleted: {
    backgroundColor: "#EDF4ED",
  },
  inventoryDraft: {
    backgroundColor: COLORS.primaryLight,
  },
  inventoryStatusText: {
    fontSize: 10,
    fontWeight: "800",
  },
  inventoryDetailCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 18,
  },
  inventoryDetailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  detailHeaderText: {
    flex: 1,
    paddingRight: 10,
  },
  inventoryDetailTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "800",
  },
  closeDetailButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  inventoryDetailSection: {
    color: COLORS.text,
    fontWeight: "800",
    fontSize: 14,
    marginTop: 20,
    marginBottom: 10,
  },
  inventoryItemCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 13,
    marginBottom: 10,
  },
  inventoryItemName: {
    color: COLORS.text,
    fontWeight: "800",
    fontSize: 14,
  },
  inventoryItemType: {
    color: COLORS.secondary,
    fontSize: 11,
    marginTop: 4,
  },
  inventoryItemQuantities: {
    marginTop: 10,
    gap: 5,
  },
  inventoryQuantityText: {
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 5,
    marginBottom: 3,
  },
  inventoryDifference: {
    marginTop: 7,
    fontWeight: "800",
  },
  itemFormCard: {
    backgroundColor: COLORS.background,
    padding: 14,
    borderRadius: 13,
    marginBottom: 18,
  },
  itemTypeRow: {
    flexDirection: "row",
    gap: 7,
    marginBottom: 16,
  },
  itemTypeButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  itemTypeButtonActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  itemTypeButtonText: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: "700",
  },
  itemTypeButtonTextActive: {
    color: COLORS.primary,
  },
  infoBox: {
    backgroundColor: "#EDF4ED",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },
  infoText: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  equipmentOption: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  equipmentOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  equipmentOptionText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },
  equipmentDropdown: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 8,
    marginTop: 5,
    marginBottom: 10,
  },
  equipmentDetailCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 11,
    padding: 11,
    marginTop: 8,
    marginBottom: 8,
  },
  equipmentStateLabel: {
    marginTop: 12,
  },
  cancelButton: {
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  cancelButtonText: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: "700",
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 25,
    alignItems: "center",
    marginBottom: 15,
  },
  emptyText: {
    color: COLORS.secondary,
    textAlign: "center",
    marginTop: 7,
    fontSize: 13,
  },
  field: {
    marginBottom: 15,
  },
  label: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 7,
  },
  input: {
    minHeight: 47,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 11,
    paddingHorizontal: 13,
    color: COLORS.text,
    fontSize: 14,
    backgroundColor: COLORS.background,
  },
  multilineInput: {
    minHeight: 85,
    paddingTop: 12,
  },
  conversionBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EDF4ED",
    borderRadius: 12,
    padding: 13,
    marginBottom: 17,
    gap: 12,
  },
  conversionInfo: {
    flex: 1,
  },
  conversionTitle: {
    color: COLORS.secondary,
    fontSize: 12,
  },
  conversionValue: {
    color: COLORS.green,
    fontSize: 20,
    fontWeight: "800",
    marginTop: 3,
  },
  conversionHint: {
    color: COLORS.secondary,
    fontSize: 11,
    marginTop: 2,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    minHeight: 50,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 9,
    marginTop: 5,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "800",
  },
  movementLegend: {
    flexDirection: "row",
    gap: 18,
    marginBottom: 12,
  },
  legendEntry: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: "700",
  },
  legendExit: {
    color: COLORS.red,
    fontSize: 12,
    fontWeight: "700",
  },
  historyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  historyIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  historyInfo: {
    flex: 1,
    marginLeft: 11,
  },
  historyName: {
    color: COLORS.text,
    fontWeight: "800",
    fontSize: 14,
  },
  historyDate: {
    color: COLORS.secondary,
    fontSize: 12,
    marginTop: 3,
  },
  historySupplier: {
    color: COLORS.secondary,
    fontSize: 11,
    marginTop: 3,
  },
  historyQuantity: {
    alignItems: "flex-end",
  },
  historyNumber: {
    color: COLORS.green,
    fontWeight: "800",
    fontSize: 17,
  },
  historyUnit: {
    color: COLORS.secondary,
    fontSize: 11,
  },

  conversionText: {
    fontSize: 13,
    color: COLORS.text,
    marginVertical: 2,
  },

  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
});
