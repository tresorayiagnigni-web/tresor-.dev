
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BandRecord } from "../../services/bandRecordService";

const COLORS = {
  background: "#F7F4F1",
  white: "#FFFFFF",
  primary: "#C97965",
  primaryLight: "#F9E8E3",
  text: "#292524",
  secondary: "#89817D",
  border: "#EAE4DF",
  green: "#648B69",
};

interface Props {
  records: BandRecord[];
  loading?: boolean;
}

type Period = "7 jours" | "30 jours" | "Tout";

const getLocalDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatNumber = (value: number): string =>
  value.toLocaleString("fr-FR", {
    maximumFractionDigits: 2,
  });

const getProduction = (record: BandRecord): number | null => {
  const value = record.alveoles_collectees;

  if (value === null || value === undefined) return null;

  const numberValue = Number(value);

  return Number.isFinite(numberValue) && numberValue >= 0
    ? numberValue
    : null;
};

export default function ProductionScreen({ records, loading = false }: Props) {
  const [period, setPeriod] = useState<Period>("7 jours");

  const today = new Date();
  const todayKey = getLocalDateKey(today);

  const periodStart = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);

    if (period === "7 jours") {
      date.setDate(date.getDate() - 6);
    } else if (period === "30 jours") {
      date.setDate(date.getDate() - 29);
    } else {
      return null;
    }

    return getLocalDateKey(date);
  }, [period]);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const date = record.date_releve?.slice(0, 10);

      if (!date) return false;
      if (periodStart && date < periodStart) return false;
      if (date > todayKey) return false;

      return getProduction(record) !== null;
    });
  }, [records, periodStart, todayKey]);

  const totalProduction = useMemo(
    () =>
      filteredRecords.reduce(
        (total, record) => total + (getProduction(record) ?? 0),
        0,
      ),
    [filteredRecords],
  );

  const todayProduction = useMemo(
    () =>
      records
        .filter((record) => record.date_releve?.slice(0, 10) === todayKey)
        .reduce((total, record) => total + (getProduction(record) ?? 0), 0),
    [records, todayKey],
  );

  const productionByBand = useMemo(() => {
    const grouped = new Map<string, number>();

    filteredRecords.forEach((record) => {
      const bandId = record.bandId ?? record.band?.id;
      const bandName =
        record.band?.nom ||
        (bandId !== undefined ? `Bande ${bandId}` : "Bande inconnue");

      grouped.set(
        bandName,
        (grouped.get(bandName) ?? 0) + (getProduction(record) ?? 0),
      );
    });

    return Array.from(grouped.entries())
      .map(([nom, production]) => ({ nom, production }))
      .sort((a, b) => b.production - a.production);
  }, [filteredRecords]);

  const dailyChart = useMemo(() => {
    const days = period === "30 jours" ? 7 : 7;

    return Array.from({ length: days }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - index));

      const dateKey = getLocalDateKey(date);

      const total = records
        .filter((record) => record.date_releve?.slice(0, 10) === dateKey)
        .reduce((sum, record) => sum + (getProduction(record) ?? 0), 0);

      return {
        date: dateKey,
        label: date.toLocaleDateString("fr-FR", {
          weekday: "short",
        }),
        total,
      };
    });
  }, [records, todayKey]);

  const maxChartValue = Math.max(
    ...dailyChart.map((item) => item.total),
    1,
  );

  const averageProduction =
    filteredRecords.length > 0
      ? totalProduction / filteredRecords.length
      : 0;

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <View>
          <Text style={styles.title}>Production</Text>
          <Text style={styles.subtitle}>
            Suivi des œufs collectés dans votre exploitation
          </Text>
        </View>

        <View style={styles.headingIcon}>
          <Ionicons name="egg-outline" size={27} color={COLORS.primary} />
        </View>
      </View>

      <View style={styles.periodContainer}>
        {(["7 jours", "30 jours", "Tout"] as Period[]).map((item) => (
          <TouchableOpacity
            key={item}
            onPress={() => setPeriod(item)}
            style={[
              styles.periodButton,
              period === item && styles.periodButtonActive,
            ]}
          >
            <Text
              style={[
                styles.periodText,
                period === item && styles.periodTextActive,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Chargement des données...</Text>
        </View>
      ) : (
        <>
          <View style={styles.mainCard}>
            <Text style={styles.mainLabel}>Production de la période</Text>
            <Text style={styles.mainValue}>
              {formatNumber(totalProduction)}
            </Text>
            <Text style={styles.mainUnit}>Alvéoles collectées</Text>
            <View style={styles.mainIcon}>
              <Ionicons
                name="trending-up-outline"
                size={23}
                color={COLORS.white}
              />
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons
                name="today-outline"
                size={22}
                color={COLORS.primary}
              />
              <Text style={styles.statValue}>
                {formatNumber(todayProduction)}
              </Text>
              <Text style={styles.statLabel}>Aujourd'hui</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons
                name="document-text-outline"
                size={22}
                color={COLORS.green}
              />
              <Text style={styles.statValue}>
                {filteredRecords.length}
              </Text>
              <Text style={styles.statLabel}>Relevés avec production</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons
                name="analytics-outline"
                size={22}
                color={COLORS.primary}
              />
              <Text style={styles.statValue}>
                {formatNumber(averageProduction)}
              </Text>
              <Text style={styles.statLabel}>Moyenne par relevé</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons
                name="layers-outline"
                size={22}
                color={COLORS.green}
              />
              <Text style={styles.statValue}>
                {productionByBand.length}
              </Text>
              <Text style={styles.statLabel}>Bandes concernées</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                Évolution sur les 7 derniers jours
              </Text>
              <Ionicons
                name="bar-chart-outline"
                size={21}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.chart}>
              {dailyChart.map((item) => {
                const height =
                  item.total > 0
                    ? Math.max((item.total / maxChartValue) * 115, 5)
                    : 3;

                return (
                  <View key={item.date} style={styles.chartColumn}>
                    <Text style={styles.chartValue} numberOfLines={1}>
                      {formatNumber(item.total)}
                    </Text>

                    <View style={styles.barContainer}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height,
                            backgroundColor:
                              item.date === todayKey
                                ? COLORS.primary
                                : COLORS.primaryLight,
                          },
                        ]}
                      />
                    </View>

                    <Text style={styles.chartLabel}>{item.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Production par bande</Text>
              <Ionicons
                name="layers-outline"
                size={21}
                color={COLORS.primary}
              />
            </View>

            {productionByBand.length === 0 ? (
              <Text style={styles.emptyText}>
                Aucune production enregistrée pour cette période.
              </Text>
            ) : (
              productionByBand.map((band, index) => {
                const percentage =
                  totalProduction > 0
                    ? (band.production / totalProduction) * 100
                    : 0;

                return (
                  <View key={band.nom}>
                    {index > 0 && <View style={styles.divider} />}

                    <View style={styles.bandRow}>
                      <View style={styles.bandInfo}>
                        <Text style={styles.bandName}>{band.nom}</Text>
                        <View style={styles.progressBackground}>
                          <View
                            style={[
                              styles.progressBar,
                              { width: `${percentage}%` },
                            ]}
                          />
                        </View>
                      </View>

                      <Text style={styles.bandValue}>
                        {formatNumber(band.production)}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {filteredRecords.length === 0 && (
            <View style={styles.emptyCard}>
              <Ionicons
                name="egg-outline"
                size={32}
                color={COLORS.secondary}
              />
              <Text style={styles.emptyText}>
                Aucune donnée de production disponible pour cette période.
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 15,
  },
  heading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    fontSize: 23,
    fontWeight: "900",
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.secondary,
    marginTop: 5,
  },
  headingIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  periodContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 13,
    padding: 4,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  periodButtonActive: {
    backgroundColor: COLORS.primary,
  },
  periodText: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: "700",
  },
  periodTextActive: {
    color: COLORS.white,
  },
  mainCard: {
    backgroundColor: COLORS.primary,
    padding: 22,
    borderRadius: 20,
    marginBottom: 14,
    position: "relative",
    overflow: "hidden",
  },
  mainLabel: {
    color: "#FFFFFFDD",
    fontSize: 12,
    fontWeight: "600",
  },
  mainValue: {
    color: COLORS.white,
    fontSize: 34,
    fontWeight: "900",
    marginTop: 12,
  },
  mainUnit: {
    color: "#FFFFFFDD",
    fontSize: 11,
    marginTop: 4,
  },
  mainIcon: {
    position: "absolute",
    right: 20,
    top: 22,
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: "#FFFFFF30",
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: {
    fontSize: 19,
    fontWeight: "900",
    color: COLORS.text,
    marginTop: 10,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.secondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.white,
    padding: 17,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
    flex: 1,
  },
  chart: {
    height: 165,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  chartColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    height: "100%",
  },
  chartValue: {
    fontSize: 8,
    color: COLORS.secondary,
    marginBottom: 6,
  },
  barContainer: {
    height: 120,
    width: "65%",
    justifyContent: "flex-end",
  },
  bar: {
    width: "100%",
    borderRadius: 6,
    minHeight: 3,
  },
  chartLabel: {
    fontSize: 9,
    color: COLORS.secondary,
    marginTop: 8,
    textTransform: "capitalize",
  },
  bandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 9,
  },
  bandInfo: {
    flex: 1,
  },
  bandName: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },
  progressBackground: {
    height: 6,
    backgroundColor: COLORS.background,
    borderRadius: 5,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 5,
  },
  bandValue: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.text,
    minWidth: 55,
    textAlign: "right",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    padding: 25,
    borderRadius: 17,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: {
    color: COLORS.secondary,
    fontSize: 11,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 10,
  },
});
