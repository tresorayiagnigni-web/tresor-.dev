
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
    Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  BandRecord,
  getBandRecords,
} from "../../services/bandRecordService";

const COLORS = {
  background: "#F7F4F1",
  white: "#FFFFFF",
  primary: "#C97965",
  primaryLight: "#F9E8E3",
  text: "#292524",
  secondary: "#89817D",
  border: "#EAE4DF",
  green: "#648B69",
  red: "#C65353",
};

export default function HistoryScreen() {
  const [records, setRecords] = useState<BandRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRecord, setSelectedRecord] =
    useState<BandRecord | null>(null);

  const loadHistory = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const result = await getBandRecords();

      const sorted = [...result].sort(
        (a, b) =>
          new Date(b.date_releve).getTime() -
          new Date(a.date_releve).getTime(),
      );

      setRecords(sorted);
    } catch (error: any) {
      Alert.alert(
        "Erreur",
        error?.response?.data?.message ||
          "Impossible de récupérer l'historique.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const formatDate = (value: string) => {
    if (!value) return "Date inconnue";

    const date = new Date(`${value.slice(0, 10)}T00:00:00`);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatNumber = (
    value: number | undefined,
    unit = "",
  ) => {
    if (value === undefined || value === null) return "Non renseigné";

    return `${Number(value).toLocaleString("fr-FR")}${unit}`;
  };

  const DetailRow = ({
    label,
    value,
  }: {
    label: string;
    value: string;
  }) => (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );

  const renderRecord = (record: BandRecord) => (
    <TouchableOpacity
      key={record.id}
      style={styles.recordCard}
      onPress={() => setSelectedRecord(record)}
      activeOpacity={0.85}
    >
      <View style={styles.recordHeader}>
        <View style={styles.recordIcon}>
          <Ionicons
            name="clipboard-outline"
            size={21}
            color={COLORS.primary}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.bandName}>
            {record.band?.nom || `Bande #${record.band?.id ?? record.bandId ?? "?"}`}
          </Text>
          <Text style={styles.recordDate}>
            {formatDate(record.date_releve)}
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color={COLORS.secondary}
        />
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Mortalité</Text>
          <Text style={[styles.metricValue, { color: COLORS.red }]}>
            {record.mortalite_jour ?? 0}
          </Text>
        </View>

        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Autres sorties</Text>
          <Text style={styles.metricValue}>
            {record.autres_sorties ?? 0}
          </Text>
        </View>

        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Effectif restant</Text>
          <Text style={[styles.metricValue, { color: COLORS.green }]}>
            {Number(record.effectif_restant).toLocaleString("fr-FR")}
          </Text>
        </View>
      </View>

      <View style={styles.recordFooter}>
        <Text style={styles.footerInfo}>
          {record.semaine ? `Semaine ${record.semaine}` : "Semaine non renseignée"}
        </Text>
        <Text style={styles.footerInfo}>
          {record.age_jours !== undefined
            ? `${record.age_jours} jours`
            : "Âge non renseigné"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>
          Chargement de l'historique...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadHistory(true)}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={styles.content}
      >
        <View style={styles.heading}>
          <Text style={styles.title}>Historique des relevés</Text>
          <Text style={styles.subtitle}>
            Retrouvez les suivis enregistrés pour vos bandes.
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons
              name="documents-outline"
              size={25}
              color={COLORS.primary}
            />
          </View>

          <View>
            <Text style={styles.summaryNumber}>{records.length}</Text>
            <Text style={styles.summaryLabel}>Relevés enregistrés</Text>
          </View>
        </View>

        {records.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="time-outline"
              size={45}
              color={COLORS.secondary}
            />
            <Text style={styles.emptyTitle}>
              Aucun relevé pour le moment
            </Text>
            <Text style={styles.emptyText}>
              Les relevés enregistrés apparaîtront ici.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.listTitle}>Tous les relevés</Text>
            {records.map(renderRecord)}
          </>
        )}

        <Text style={styles.bottomText}>
          Élevage+ · Historique des suivis
        </Text>
      </ScrollView>

      <Modal
        visible={selectedRecord !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedRecord(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Détail du relevé</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedRecord
                    ? formatDate(selectedRecord.date_releve)
                    : ""}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setSelectedRecord(null)}
              >
                <Ionicons name="close" size={25} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {selectedRecord && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                <Text style={styles.detailSectionTitle}>
                  Informations générales
                </Text>
                <DetailRow
                  label="Bande"
                  value={
                    selectedRecord.band?.nom ||
                    `Bande #${selectedRecord.band?.id ?? selectedRecord.bandId ?? "?"}`
                  }
                />
                <DetailRow
                  label="Âge"
                  value={
                    selectedRecord.age_jours !== undefined
                      ? `${selectedRecord.age_jours} jours`
                      : "Non renseigné"
                  }
                />
                <DetailRow
                  label="Semaine"
                  value={
                    selectedRecord.semaine !== undefined
                      ? String(selectedRecord.semaine)
                      : "Non renseignée"
                  }
                />

                <Text style={styles.detailSectionTitle}>
                  Effectif et mortalité
                </Text>
                <DetailRow
                  label="Mortalité du jour"
                  value={formatNumber(selectedRecord.mortalite_jour)}
                />
                <DetailRow
                  label="Autres sorties"
                  value={formatNumber(selectedRecord.autres_sorties)}
                />
                <DetailRow
                  label="Effectif restant"
                  value={formatNumber(selectedRecord.effectif_restant)}
                />

                <Text style={styles.detailSectionTitle}>
                  Poids et température
                </Text>
                <DetailRow
                  label="Poids moyen"
                  value={formatNumber(selectedRecord.poids_moyen_g, " g")}
                />
                <DetailRow
                  label="Poids standard"
                  value={formatNumber(selectedRecord.poids_standard_g, " g")}
                />
                <DetailRow
                  label="Taille échantillon"
                  value={formatNumber(selectedRecord.taille_echantillon)}
                />
                <DetailRow
                  label="Température minimale"
                  value={formatNumber(selectedRecord.temperature_min_c, " °C")}
                />
                <DetailRow
                  label="Température maximale"
                  value={formatNumber(selectedRecord.temperature_max_c, " °C")}
                />

                <Text style={styles.detailSectionTitle}>
                  Alimentation et eau
                </Text>
                <DetailRow
                  label="Code aliment"
                  value={selectedRecord.code_aliment || "Non renseigné"}
                />
                <DetailRow
                  label="Ration par sujet"
                  value={formatNumber(
                    selectedRecord.ration_g_par_sujet_jour,
                    " g",
                  )}
                />
                <DetailRow
                  label="Quantité aliment"
                  value={formatNumber(
                    selectedRecord.quantite_aliment_kg,
                    " kg",
                  )}
                />
                <DetailRow
                  label="Nombre de sacs"
                  value={formatNumber(selectedRecord.nombre_sacs)}
                />
                <DetailRow
                  label="Nombre de repas"
                  value={formatNumber(selectedRecord.nombre_repas)}
                />
                <DetailRow
                  label="Consommation d'eau"
                  value={formatNumber(selectedRecord.eau_litres, " L")}
                />

                <Text style={styles.detailSectionTitle}>
                  Santé et observations
                </Text>
                <DetailRow
                  label="Vaccination"
                  value={selectedRecord.vaccination || "Non renseignée"}
                />
                <DetailRow
                  label="Traitement"
                  value={selectedRecord.traitement || "Non renseigné"}
                />
                <DetailRow
                  label="Santé"
                  value={selectedRecord.observations_sante || "Aucune"}
                />
                <DetailRow
                  label="Ventilation"
                  value={selectedRecord.ventilation || "Non renseignée"}
                />
                <DetailRow
                  label="Observations"
                  value={selectedRecord.observations || "Aucune"}
                />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 18,
    paddingBottom: 35,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    color: COLORS.secondary,
    fontSize: 12,
    marginTop: 12,
  },
  heading: {
    marginBottom: 20,
  },
  title: {
    color: COLORS.text,
    fontSize: 21,
    fontWeight: "900",
  },
  subtitle: {
    color: COLORS.secondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 17,
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 23,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryNumber: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.text,
  },
  summaryLabel: {
    fontSize: 11,
    color: COLORS.secondary,
    marginTop: 3,
  },
  listTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 12,
  },
  recordCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 17,
    padding: 15,
    marginBottom: 13,
  },
  recordHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  recordIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  bandName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
  },
  recordDate: {
    color: COLORS.secondary,
    fontSize: 11,
    marginTop: 4,
  },
  metricsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    marginTop: 15,
    paddingVertical: 13,
    gap: 6,
  },
  metric: {
    flex: 1,
    alignItems: "center",
  },
  metricLabel: {
    color: COLORS.secondary,
    fontSize: 9,
    textAlign: "center",
  },
  metricValue: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 5,
  },
  recordFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 11,
  },
  footerInfo: {
    color: COLORS.secondary,
    fontSize: 10,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 17,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 13,
  },
  emptyText: {
    color: COLORS.secondary,
    fontSize: 11,
    marginTop: 6,
    textAlign: "center",
  },
  bottomText: {
    textAlign: "center",
    color: COLORS.secondary,
    fontSize: 10,
    marginTop: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    maxHeight: "88%",
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 23,
    borderTopRightRadius: 23,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
  },
  modalSubtitle: {
    color: COLORS.secondary,
    fontSize: 11,
    marginTop: 4,
  },
  detailSectionTitle: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "900",
    marginTop: 18,
    marginBottom: 9,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabel: {
    color: COLORS.secondary,
    fontSize: 11,
    flex: 1,
  },
  detailValue: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "700",
    flex: 1,
    textAlign: "right",
  },
});
