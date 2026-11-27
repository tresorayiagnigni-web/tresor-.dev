import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Bande, createBande, getBandes } from "../../services/bandeService";
import { getFarms, Farm } from "../../services/farmService";
import { BandRecord, getBandRecords } from "../../services/bandRecordService";
import { Employee, getEmployees } from "../../services/employeeService";

const COLORS = {
  background: "#F7F4F1",
  white: "#FFFFFF",
  primary: "#C97965",
  primaryLight: "#F9E8E3",
  text: "#292524",
  secondary: "#89817D",
  border: "#EAE4DF",
  green: "#648B69",
  orange: "#D69A55",
  red: "#C65353",
};

type Props = {
  role: "ADMIN" | "EMPLOYEE";
};

type FormData = {
  nom: string;
  numero_batiment: string;
  race: string;
  date_demarrage: string;
  effectif_initial: string;
  aliment_demarrage: string;
};

const getToday = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const EMPTY_FORM: FormData = {
  nom: "",
  numero_batiment: "",
  race: "",
  date_demarrage: getToday(),
  effectif_initial: "",
  aliment_demarrage: "",
};

export default function BandesScreen({ role }: Props) {
  const isAdmin = role === "ADMIN";

  const [bandes, setBandes] = useState<Bande[]>([]);
  const [records, setRecords] = useState<BandRecord[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [form, setForm] = useState<FormData>(EMPTY_FORM);

  const loadData = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        const [bandsData, recordsData] = await Promise.all([
          getBandes(),
          getBandRecords(),
        ]);

        setBandes(bandsData);
        setRecords(recordsData);

        if (isAdmin) {
          const [farmsResult, employeesResult] = await Promise.allSettled([
            getFarms(),
            getEmployees(),
          ]);

          if (farmsResult.status === "fulfilled") {
            console.log("TOUTES LES EXPLOITATIONS :", farmsResult.value);

            console.log(
              "STATUTS :",
              farmsResult.value.map((farm) => ({
                id: farm.id,
                nom: farm.nom,
                status: farm.status,
                type: typeof farm.status,
              })),
            );

            setFarms(farmsResult.value);
          } else {
            console.log("ERREUR EXPLOITATIONS :", farmsResult.reason);

            Alert.alert(
              "Exploitations",
              "Impossible de récupérer les exploitations.",
            );
          }

          if (employeesResult.status === "fulfilled") {
            setEmployees(
              employeesResult.value.filter(
                (employee) =>
                  employee.role === "EMPLOYEE" && employee.status === true,
              ),
            );
          } else {
            Alert.alert(
              "Employés",
              "Impossible de récupérer la liste des employés.",
            );
          }
        }
      } catch (error: any) {
        Alert.alert(
          "Erreur",
          error?.response?.data?.message ||
            "Impossible de charger les données des bandes.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isAdmin],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateModal = () => {
    setForm({
      ...EMPTY_FORM,
      date_demarrage: getToday(),
    });
    setSelectedFarm(null);
    setSelectedEmployees([]);
    setModalVisible(true);
  };

  const toggleEmployee = (id: number) => {
    setSelectedEmployees((current) =>
      current.includes(id)
        ? current.filter((employeeId) => employeeId !== id)
        : [...current, id],
    );
  };

  const saveBande = async () => {
    if (!form.nom.trim()) {
      Alert.alert("Champ obligatoire", "Saisis le nom de la bande.");
      return;
    }

    if (!form.numero_batiment.trim() || !form.race.trim()) {
      Alert.alert(
        "Champs obligatoires",
        "Le numéro du bâtiment et la race sont requis.",
      );
      return;
    }

    if (!selectedFarm) {
      Alert.alert(
        "Exploitation obligatoire",
        "Sélectionne une exploitation active.",
      );
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date_demarrage)) {
      Alert.alert(
        "Date invalide",
        "Utilise le format AAAA-MM-JJ pour la date.",
      );
      return;
    }

    const date = new Date(`${form.date_demarrage}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      Alert.alert("Date invalide", "Vérifie la date de démarrage.");
      return;
    }

    const effectif = Number(form.effectif_initial);

    if (!Number.isInteger(effectif) || effectif < 1) {
      Alert.alert(
        "Effectif invalide",
        "L’effectif initial doit être un entier supérieur à zéro.",
      );
      return;
    }

    try {
      setSaving(true);

      await createBande({
        nom: form.nom.trim(),
        numero_batiment: form.numero_batiment.trim(),
        race: form.race.trim(),
        date_demarrage: form.date_demarrage,
        effectif_initial: effectif,
        farmId: selectedFarm.id,
        aliment_demarrage: form.aliment_demarrage.trim() || undefined,
        employeeIds: selectedEmployees,
      });

      Alert.alert("Succès", "La bande a été créée avec succès.");

      setModalVisible(false);
      setForm(EMPTY_FORM);
      setSelectedFarm(null);
      setSelectedEmployees([]);

      await loadData();
    } catch (error: any) {
      Alert.alert(
        "Erreur",
        error?.response?.data?.message || "Impossible de créer la bande.",
      );
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (value: string) => {
    if (!value) return "Non renseignée";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("fr-FR");
  };

  const getRecordsForBand = (bandId: number) => {
    return records
      .filter((record) => {
        const recordBandId = record.bandId ?? record.band?.id;
        return recordBandId === bandId;
      })
      .sort(
        (a, b) =>
          new Date(b.date_releve).getTime() - new Date(a.date_releve).getTime(),
      );
  };

  const getBandStats = (bande: Bande) => {
    const bandRecords = getRecordsForBand(bande.id);
    const latestRecord = bandRecords[0];

    const effectifActuel = latestRecord
      ? latestRecord.effectif_restant
      : bande.effectif_initial;

    const mortaliteCumulee = bandRecords.reduce(
      (total, record) => total + (Number(record.mortalite_jour) || 0),
      0,
    );

    const mortalitePct =
      bande.effectif_initial > 0
        ? (mortaliteCumulee / bande.effectif_initial) * 100
        : 0;

    return {
      effectifActuel,
      mortaliteCumulee,
      mortalitePct,
      latestRecord,
    };
  };

  const getStatusLabel = (status: Bande["status"]) => {
    switch (status) {
      case "GROWING":
        return "En cours";
      case "TRANSFERRED":
        return "Transférée";
      case "ARCHIVED":
        return "Archivée";
      default:
        return status;
    }
  };

  const getStatusColor = (status: Bande["status"]) => {
    switch (status) {
      case "GROWING":
        return COLORS.green;
      case "TRANSFERRED":
        return COLORS.orange;
      case "ARCHIVED":
        return COLORS.secondary;
      default:
        return COLORS.secondary;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            tintColor={COLORS.primary}
          />
        }
      >
        <View style={styles.heading}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Bandes de poulettes</Text>
            <Text style={styles.subtitle}>Suivi 0 → 18 semaines</Text>
          </View>

          {isAdmin && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={openCreateModal}
            >
              <Ionicons name="add" size={21} color={COLORS.white} />
              <Text style={styles.addButtonText}>Nouvelle bande</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{bandes.length}</Text>
            <Text style={styles.statLabel}>Total bandes</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: COLORS.green }]}>
              {bandes.filter((b) => b.status === "GROWING").length}
            </Text>
            <Text style={styles.statLabel}>En cours</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: COLORS.orange }]}>
              {bandes.filter((b) => b.status === "TRANSFERRED").length}
            </Text>
            <Text style={styles.statLabel}>Transférées</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={{ marginTop: 40 }}
          />
        ) : bandes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="layers-outline"
              size={48}
              color={COLORS.secondary}
            />
            <Text style={styles.emptyTitle}>Aucune bande disponible</Text>
            <Text style={styles.emptyText}>
              {isAdmin
                ? "Crée une bande pour commencer le suivi de ton élevage."
                : "Aucune bande ne t’est actuellement affectée."}
            </Text>
          </View>
        ) : (
          bandes.map((bande) => {
            const stats = getBandStats(bande);
            const statusColor = getStatusColor(bande.status);

            return (
              <View key={bande.id} style={styles.bandeCard}>
                <View style={styles.bandeHeader}>
                  <View style={styles.bandeIcon}>
                    <Ionicons
                      name="home-outline"
                      size={22}
                      color={COLORS.primary}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.bandeTitle}>{bande.nom}</Text>
                    <Text style={styles.bandeSubtitle}>
                      Bâtiment {bande.numero_batiment}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: `${statusColor}20` },
                    ]}
                  >
                    <Text style={[styles.badgeText, { color: statusColor }]}>
                      {getStatusLabel(bande.status)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.farmName}>
                  <Ionicons
                    name="business-outline"
                    size={13}
                    color={COLORS.secondary}
                  />{" "}
                  {bande.farm?.nom || "Exploitation non renseignée"}
                </Text>

                <View style={styles.bandeInfo}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Race</Text>
                    <Text style={styles.infoValue}>{bande.race}</Text>
                  </View>

                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Démarrage</Text>
                    <Text style={styles.infoValue}>
                      {formatDate(bande.date_demarrage)}
                    </Text>
                  </View>
                </View>

                <View style={styles.totalsRow}>
                  <View style={styles.totalBox}>
                    <Text style={styles.totalLabel}>Effectif initial</Text>
                    <Text style={styles.totalValue}>
                      {bande.effectif_initial.toLocaleString("fr-FR")}
                    </Text>
                  </View>

                  <View style={styles.totalBox}>
                    <Text style={styles.totalLabel}>Effectif actuel</Text>
                    <Text
                      style={[styles.totalValue, { color: COLORS.primary }]}
                    >
                      {stats.effectifActuel.toLocaleString("fr-FR")}
                    </Text>
                  </View>

                  <View style={styles.totalBox}>
                    <Text style={styles.totalLabel}>Mortalité cumulée</Text>
                    <Text style={[styles.totalValue, { color: COLORS.red }]}>
                      {stats.mortalitePct.toFixed(1)}%
                    </Text>
                  </View>
                </View>

                {stats.latestRecord ? (
                  <Text style={styles.recordDate}>
                    Dernier relevé :{" "}
                    {formatDate(stats.latestRecord.date_releve)}
                  </Text>
                ) : (
                  <Text style={styles.recordDate}>Aucun relevé enregistré</Text>
                )}

                {bande.employees && bande.employees.length > 0 && (
                  <Text style={styles.employeeText}>
                    <Ionicons
                      name="people-outline"
                      size={13}
                      color={COLORS.secondary}
                    />{" "}
                    {bande.employees.map((employee) => employee.nom).join(", ")}
                  </Text>
                )}
              </View>
            );
          })
        )}

        <Text style={styles.footer}>Elevage+ · Suivi des bandes</Text>
      </ScrollView>

      {isAdmin && (
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nouvelle bande</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={25} color={COLORS.secondary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.inputLabel}>Nom de la bande</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex : Bande B01"
                  placeholderTextColor={COLORS.secondary}
                  value={form.nom}
                  onChangeText={(value) => setForm({ ...form, nom: value })}
                />

                <Text style={styles.inputLabel}>Exploitation active</Text>
                {farms.length === 0 ? (
                  <Text style={styles.warningText}>
                    Aucune exploitation active disponible.
                  </Text>
                ) : (
                  <View style={styles.selectionList}>
                    {farms.map((farm) => (
                      <TouchableOpacity
                        key={farm.id}
                        style={[
                          styles.selectionItem,
                          selectedFarm?.id === farm.id &&
                            styles.selectionItemActive,
                        ]}
                        onPress={() => setSelectedFarm(farm)}
                      >
                        <Text
                          style={[
                            styles.selectionText,
                            selectedFarm?.id === farm.id &&
                              styles.selectionTextActive,
                          ]}
                        >
                          {farm.nom}
                        </Text>
                        <Ionicons
                          name={
                            selectedFarm?.id === farm.id
                              ? "radio-button-on"
                              : "radio-button-off"
                          }
                          size={20}
                          color={
                            selectedFarm?.id === farm.id
                              ? COLORS.primary
                              : COLORS.secondary
                          }
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <Text style={styles.inputLabel}>Numéro du bâtiment</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex : A12"
                  placeholderTextColor={COLORS.secondary}
                  value={form.numero_batiment}
                  onChangeText={(value) =>
                    setForm({ ...form, numero_batiment: value })
                  }
                />

                <Text style={styles.inputLabel}>Race</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex : Lohmann Brown"
                  placeholderTextColor={COLORS.secondary}
                  value={form.race}
                  onChangeText={(value) => setForm({ ...form, race: value })}
                />

                <Text style={styles.inputLabel}>Date de démarrage</Text>
                <TextInput
                  style={styles.input}
                  placeholder="AAAA-MM-JJ"
                  placeholderTextColor={COLORS.secondary}
                  value={form.date_demarrage}
                  onChangeText={(value) =>
                    setForm({ ...form, date_demarrage: value })
                  }
                />

                <Text style={styles.inputLabel}>Effectif initial</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex : 5000"
                  placeholderTextColor={COLORS.secondary}
                  keyboardType="numeric"
                  value={form.effectif_initial}
                  onChangeText={(value) =>
                    setForm({ ...form, effectif_initial: value })
                  }
                />

                <Text style={styles.inputLabel}>
                  Aliment de démarrage (facultatif)
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Type d'aliment"
                  placeholderTextColor={COLORS.secondary}
                  value={form.aliment_demarrage}
                  onChangeText={(value) =>
                    setForm({ ...form, aliment_demarrage: value })
                  }
                />

                <Text style={styles.inputLabel}>
                  Affecter des employés (facultatif)
                </Text>

                {employees.length === 0 ? (
                  <Text style={styles.warningText}>
                    Aucun employé actif disponible.
                  </Text>
                ) : (
                  <View style={styles.selectionList}>
                    {employees.map((employee) => {
                      const selected = selectedEmployees.includes(employee.id);

                      return (
                        <TouchableOpacity
                          key={employee.id}
                          style={[
                            styles.selectionItem,
                            selected && styles.selectionItemActive,
                          ]}
                          onPress={() => toggleEmployee(employee.id)}
                        >
                          <View>
                            <Text
                              style={[
                                styles.selectionText,
                                selected && styles.selectionTextActive,
                              ]}
                            >
                              {employee.nom}
                            </Text>
                            <Text style={styles.employeeEmail}>
                              {employee.email}
                            </Text>
                          </View>

                          <Ionicons
                            name={selected ? "checkbox" : "square-outline"}
                            size={21}
                            color={selected ? COLORS.primary : COLORS.secondary}
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.saveButton, saving && { opacity: 0.7 }]}
                  onPress={saveBande}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.saveButtonText}>Créer la bande</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    backgroundColor: COLORS.background,
  },
  heading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    gap: 8,
  },
  title: {
    fontSize: 21,
    fontWeight: "900",
    color: COLORS.text,
  },
  subtitle: {
    color: COLORS.secondary,
    fontSize: 12,
    marginTop: 4,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
  },
  statsRow: {
    flexDirection: "row",
    gap: 9,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statNumber: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "900",
  },
  statLabel: {
    color: COLORS.secondary,
    fontSize: 10,
    marginTop: 4,
  },
  bandeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 17,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bandeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  bandeIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  bandeTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },
  bandeSubtitle: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 2,
  },
  farmName: {
    fontSize: 12,
    color: COLORS.secondary,
    marginBottom: 13,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  bandeInfo: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 14,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: COLORS.secondary,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 2,
  },
  totalsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    gap: 8,
  },
  totalBox: {
    flex: 1,
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 10,
    color: COLORS.secondary,
    textAlign: "center",
  },
  totalValue: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.text,
    marginTop: 3,
  },
  recordDate: {
    fontSize: 11,
    color: COLORS.secondary,
    marginTop: 12,
  },
  employeeText: {
    fontSize: 11,
    color: COLORS.secondary,
    marginTop: 8,
  },
  emptyState: {
    backgroundColor: COLORS.white,
    borderRadius: 17,
    padding: 32,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: 14,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.secondary,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  footer: {
    textAlign: "center",
    color: COLORS.secondary,
    fontSize: 10,
    marginVertical: 28,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(30,24,21,0.5)",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    height: 46,
    paddingHorizontal: 13,
    color: COLORS.text,
    marginBottom: 14,
    fontSize: 13,
  },
  selectionList: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    marginBottom: 14,
    overflow: "hidden",
  },
  selectionItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectionItemActive: {
    backgroundColor: COLORS.primaryLight,
  },
  selectionText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: "600",
  },
  selectionTextActive: {
    color: COLORS.primary,
  },
  employeeEmail: {
    fontSize: 11,
    color: COLORS.secondary,
    marginTop: 3,
  },
  warningText: {
    fontSize: 12,
    color: COLORS.red,
    marginBottom: 14,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 13,
    padding: 15,
    alignItems: "center",
    marginTop: 6,
    marginBottom: 12,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",
  },
});
