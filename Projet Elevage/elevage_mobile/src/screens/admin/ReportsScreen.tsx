
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  getBandRecords,
  BandRecord,
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
  orange: "#D69A55",
  red: "#D96C65",
  blue: "#6488A8",
};

type ReportCardProps = {
  title: string;
  value: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
};

const ReportCard = ({
  title,
  value,
  subtitle,
  icon,
  color,
}: ReportCardProps) => (
  <View style={styles.reportCard}>
    <View style={styles.reportCardHeader}>
      <View style={[styles.iconBox, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
    </View>

    <Text style={styles.cardValue}>{value}</Text>
    <Text style={styles.cardSubtitle}>{subtitle}</Text>
  </View>
);

const formatNumber = (value: number): string =>
  value.toLocaleString("fr-FR");

const formatDate = (value?: string): string => {
  if (!value) return "Date inconnue";

  const date = value.slice(0, 10);
  const [year, month, day] = date.split("-");

  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
};

export default function ReportsScreen() {
  const [records, setRecords] = useState<BandRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadReports = useCallback(async () => {
    try {
      setError("");
      const data = await getBandRecords();
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Impossible de charger les rapports. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const summary = useMemo(() => {
    const totalMortalite = records.reduce(
      (sum, record) => sum + (Number(record.mortalite_jour) || 0),
      0,
    );

    const totalSorties = records.reduce(
      (sum, record) => sum + (Number(record.autres_sorties) || 0),
      0,
    );

    const totalAlveoles = records.reduce(
      (sum, record) => sum + (Number(record.alveoles_collectees) || 0),
      0,
    );

    const totalSacs = records.reduce(
      (sum, record) => sum + (Number(record.nombre_sacs) || 0),
      0,
    );

    const totalAliment = records.reduce(
      (sum, record) => sum + (Number(record.quantite_aliment_kg) || 0),
      0,
    );

    const totalEau = records.reduce(
      (sum, record) => sum + (Number(record.eau_litres) || 0),
      0,
    );

    const vaccinations = records.filter(
      (record) => Boolean(record.vaccination?.trim()),
    ).length;

    const traitements = records.filter(
      (record) => Boolean(record.traitement?.trim()),
    ).length;

    const observations = records.filter(
      (record) =>
        Boolean(record.observations_sante?.trim()) ||
        Boolean(record.observations?.trim()),
    ).length;

    const latestRecords = [...records].sort((a, b) =>
      (b.date_releve || "").localeCompare(a.date_releve || ""),
    );

    const effectifs = new Map<number, number>();

    latestRecords.forEach((record) => {
      const bandId = Number(record.bandId ?? record.band?.id);

      if (bandId && !effectifs.has(bandId)) {
        effectifs.set(
          bandId,
          Number(record.effectif_restant) || 0,
        );
      }
    });

    const totalEffectif = Array.from(effectifs.values()).reduce(
      (sum, value) => sum + value,
      0,
    );

    const latestRecord = latestRecords[0];

    return {
      totalMortalite,
      totalSorties,
      totalAlveoles,
      totalSacs,
      totalAliment,
      totalEau,
      vaccinations,
      traitements,
      observations,
      totalEffectif,
      nombreBandes: effectifs.size,
      latestRecords: latestRecords.slice(0, 10),
      latestRecord,
    };
  }, [records]);

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement des rapports...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons
          name="cloud-offline-outline"
          size={42}
          color={COLORS.red}
        />
        <Text style={styles.errorText}>{error}</Text>

        <TouchableOpacity style={styles.retryButton} onPress={loadReports}>
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
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
          tintColor={COLORS.primary}
        />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Rapports</Text>
          <Text style={styles.subtitle}>
            Synthèse des activités de votre élevage
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons
            name="bar-chart-outline"
            size={27}
            color={COLORS.primary}
          />
        </View>
      </View>

      <View style={styles.infoBanner}>
        <Ionicons
          name="information-circle-outline"
          size={21}
          color={COLORS.primary}
        />
        <Text style={styles.infoText}>
          Les statistiques sont calculées à partir des relevés enregistrés.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Vue générale</Text>

      <View style={styles.cardsGrid}>
        <ReportCard
          title="Effectif actuel"
          value={formatNumber(summary.totalEffectif)}
          subtitle={`${summary.nombreBandes} bande(s) avec relevés`}
          icon="people-outline"
          color={COLORS.blue}
        />

        <ReportCard
          title="Mortalité"
          value={formatNumber(summary.totalMortalite)}
          subtitle="Total des mortalités relevées"
          icon="alert-circle-outline"
          color={COLORS.red}
        />

        <ReportCard
          title="Production"
          value={formatNumber(summary.totalAlveoles)}
          subtitle="Alvéoles collectées"
          icon="egg-outline"
          color={COLORS.green}
        />

        <ReportCard
          title="Alimentation"
          value={`${formatNumber(summary.totalSacs)} sacs`}
          subtitle={`${formatNumber(summary.totalAliment)} kg consommés`}
          icon="leaf-outline"
          color={COLORS.orange}
        />
      </View>

      <Text style={styles.sectionTitle}>Rapport de production</Text>

      <View style={styles.detailCard}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total des alvéoles</Text>
          <Text style={styles.detailValue}>
            {formatNumber(summary.totalAlveoles)}
          </Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Nombre de relevés</Text>
          <Text style={styles.detailValue}>
            {formatNumber(records.length)}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Rapport d'alimentation</Text>

      <View style={styles.detailCard}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Sacs consommés</Text>
          <Text style={styles.detailValue}>
            {formatNumber(summary.totalSacs)}
          </Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Aliments consommés</Text>
          <Text style={styles.detailValue}>
            {formatNumber(summary.totalAliment)} kg
          </Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Eau consommée</Text>
          <Text style={styles.detailValue}>
            {formatNumber(summary.totalEau)} L
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Rapport sanitaire</Text>

      <View style={styles.detailCard}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Vaccinations renseignées</Text>
          <Text style={styles.detailValue}>
            {formatNumber(summary.vaccinations)}
          </Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Traitements renseignés</Text>
          <Text style={styles.detailValue}>
            {formatNumber(summary.traitements)}
          </Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Observations sanitaires</Text>
          <Text style={styles.detailValue}>
            {formatNumber(summary.observations)}
          </Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Mortalité enregistrée</Text>
          <Text style={[styles.detailValue, { color: COLORS.red }]}>
            {formatNumber(summary.totalMortalite)}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Derniers relevés</Text>

      {summary.latestRecords.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons
            name="document-text-outline"
            size={35}
            color={COLORS.secondary}
          />
          <Text style={styles.emptyText}>
            Aucun relevé disponible pour le moment.
          </Text>
        </View>
      ) : (
        summary.latestRecords.map((record) => (
          <View key={record.id} style={styles.recordCard}>
            <View style={styles.recordHeader}>
              <View>
                <Text style={styles.recordTitle}>
                  {record.band?.nom || `Bande ${record.bandId ?? record.band?.id ?? ""}`}
                </Text>
                <Text style={styles.recordDate}>
                  {formatDate(record.date_releve)}
                </Text>
              </View>

              <Ionicons
                name="document-text-outline"
                size={23}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.recordStats}>
              <Text style={styles.recordStat}>
                Effectif : {formatNumber(Number(record.effectif_restant) || 0)}
              </Text>
              <Text style={styles.recordStat}>
                Mortalité : {formatNumber(Number(record.mortalite_jour) || 0)}
              </Text>
              <Text style={styles.recordStat}>
                Alvéoles : {formatNumber(Number(record.alveoles_collectees) || 0)}
              </Text>
            </View>
          </View>
        ))
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Elevage+ · Rapports de gestion
        </Text>
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
    padding: 18,
    paddingBottom: 35,
  },
  centered: {
    flex: 1,
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
    padding: 25,
  },
  loadingText: {
    color: COLORS.secondary,
    marginTop: 12,
  },
  errorText: {
    color: COLORS.text,
    textAlign: "center",
    marginTop: 15,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 18,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: "700",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  title: {
    fontSize: 25,
    fontWeight: "800",
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.secondary,
    marginTop: 5,
  },
  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    padding: 13,
    borderRadius: 12,
    marginBottom: 23,
    gap: 9,
  },
  infoText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 12,
    marginTop: 8,
  },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 22,
  },
  reportCard: {
    width: "48%",
    flexGrow: 1,
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reportCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 15,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    flex: 1,
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: "600",
  },
  cardValue: {
    color: COLORS.text,
    fontSize: 21,
    fontWeight: "800",
  },
  cardSubtitle: {
    color: COLORS.secondary,
    fontSize: 11,
    marginTop: 5,
  },
  detailCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  detailLabel: {
    flex: 1,
    color: COLORS.secondary,
    fontSize: 13,
  },
  detailValue: {
    color: COLORS.text,
    fontWeight: "800",
    fontSize: 14,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  recordCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recordTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },
  recordDate: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 4,
  },
  recordStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  recordStat: {
    color: COLORS.secondary,
    fontSize: 11,
    backgroundColor: COLORS.background,
    padding: 8,
    borderRadius: 8,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    padding: 25,
    borderRadius: 14,
    alignItems: "center",
  },
  emptyText: {
    color: COLORS.secondary,
    textAlign: "center",
    marginTop: 10,
  },
  footer: {
    alignItems: "center",
    marginTop: 25,
  },
  footerText: {
    color: COLORS.secondary,
    fontSize: 11,
  },
});
