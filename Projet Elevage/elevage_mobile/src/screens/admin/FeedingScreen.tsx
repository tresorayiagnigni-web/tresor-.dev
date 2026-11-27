import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  FeedingData,
  DailyFeedingSummary,
  getFeedingData,
  getDailyFeedingSummary,
} from "../../services/feedingService";

const COLORS = {
  primary: "#256D45",
  background: "#F5F7F5",
  white: "#FFFFFF",
  text: "#26352B",
  muted: "#7B887E",
  border: "#E5EBE6",
  greenLight: "#E8F4EC",
  orange: "#E58A32",
  orangeLight: "#FFF3E5",
  blue: "#3985C8",
  blueLight: "#EAF3FC",
};

const formatNumber = (value: number, suffix = "") =>
  `${Number(value || 0).toLocaleString("fr-FR", {
    maximumFractionDigits: 2,
  })}${suffix}`;

const formatDate = (date: string) => {
  if (!date) return "Date inconnue";

  const parsed = new Date(`${date.slice(0, 10)}T00:00:00`);

  return Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
};

export default function FeedingScreen() {
  const [data, setData] = useState<FeedingData | null>(null);
  const [dailySummary, setDailySummary] = useState<DailyFeedingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const result = await getFeedingData();

      setData(result);
      setDailySummary(getDailyFeedingSummary(result.records));

      if (
        result.errors.records ||
        result.errors.stock ||
        result.errors.deliveries
      ) {
        console.warn(
          "Certaines données d'alimentation n'ont pas été chargées :",
          {
            releves: result.errors.records,
            stock: result.errors.stock,
            livraisons: result.errors.deliveries,
          },
        );
      }
    } catch (error) {
      console.error("Erreur chargement alimentation :", error);
      Alert.alert(
        "Erreur",
        "Impossible de récupérer les données d'alimentation.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const totalSacsConsommes = dailySummary.reduce(
    (total, item) => total + item.nombre_sacs,
    0,
  );

  const totalKgConsommes = dailySummary.reduce(
    (total, item) => total + item.quantite_aliment_kg,
    0,
  );

  const totalEau = dailySummary.reduce(
    (total, item) => total + item.eau_litres,
    0,
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement de l'alimentation...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.centered}>
        <Ionicons name="cloud-offline-outline" size={42} color={COLORS.muted} />
        <Text style={styles.emptyText}>Données indisponibles.</Text>
        <Text style={styles.retryText} onPress={loadData}>
          Réessayer
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Alimentation</Text>
          <Text style={styles.subtitle}>
            Suivi des stocks et des consommations
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons name="leaf-outline" size={27} color={COLORS.primary} />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Vue générale</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View
            style={[styles.statIcon, { backgroundColor: COLORS.greenLight }]}
          >
            <Ionicons name="cube-outline" size={21} color={COLORS.primary} />
          </View>
          <Text style={styles.statLabel}>Types d'aliments</Text>
          <Text style={styles.statValue}>
            {data.stock.nombre_types_aliments}
          </Text>
        </View>

        <View style={styles.statCard}>
          <View
            style={[styles.statIcon, { backgroundColor: COLORS.orangeLight }]}
          >
            <Ionicons name="archive-outline" size={21} color={COLORS.orange} />
          </View>
          <Text style={styles.statLabel}>Sacs consommés</Text>
          <Text style={styles.statValue}>
            {formatNumber(totalSacsConsommes)}
          </Text>
        </View>

        <View style={styles.statCard}>
          <View
            style={[styles.statIcon, { backgroundColor: COLORS.blueLight }]}
          >
            <Ionicons name="water-outline" size={21} color={COLORS.blue} />
          </View>
          <Text style={styles.statLabel}>Eau consommée</Text>
          <Text style={styles.statValue}>{formatNumber(totalEau, " L")}</Text>
        </View>

        <View style={styles.statCard}>
          <View
            style={[styles.statIcon, { backgroundColor: COLORS.greenLight }]}
          >
            <Ionicons name="scale-outline" size={21} color={COLORS.primary} />
          </View>
          <Text style={styles.statLabel}>Aliment consommé</Text>
          <Text style={styles.statValue}>
            {formatNumber(totalKgConsommes, " kg")}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Stock disponible</Text>

      {(data.stock?.stocks ?? []).length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            Aucun stock alimentaire enregistré.
          </Text>
        </View>
      ) : (
        (data.stock?.stocks ?? []).map((item) => (
          <View key={item.code_aliment} style={styles.stockCard}>
            <View style={styles.stockHeader}>
              <Text style={styles.stockName}>{item.code_aliment}</Text>
              <View style={styles.stockBadge}>
                <Text style={styles.stockBadgeText}>
                  {formatNumber(item.stock_disponible)} sacs
                </Text>
              </View>
            </View>

            <View style={styles.stockDetails}>
              <Text style={styles.detailText}>
                Reçu : {formatNumber(item.total_recu)} sacs
              </Text>
              <Text style={styles.detailText}>
                Consommé : {formatNumber(item.total_consomme)} sacs
              </Text>
            </View>

            <View style={styles.progressBackground}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${
                      item.total_recu > 0
                        ? Math.min(
                            100,
                            Math.max(
                              0,
                              (item.stock_disponible / item.total_recu) * 100,
                            ),
                          )
                        : 0
                    }%`,
                  },
                ]}
              />
            </View>
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>Consommations quotidiennes</Text>

      {dailySummary.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            Aucun relevé d'alimentation disponible.
          </Text>
        </View>
      ) : (
        dailySummary.map((item) => (
          <View key={item.date} style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyDate}>{formatDate(item.date)}</Text>
              <Text style={styles.historyBands}>
                {item.nombre_bandes} relevé(s)
              </Text>
            </View>

            <View style={styles.historyRow}>
              <Text style={styles.detailText}>Aliment</Text>
              <Text style={styles.historyValue}>
                {formatNumber(item.nombre_sacs)} sacs
              </Text>
            </View>

            <View style={styles.historyRow}>
              <Text style={styles.detailText}>Quantité</Text>
              <Text style={styles.historyValue}>
                {formatNumber(item.quantite_aliment_kg)} kg
              </Text>
            </View>

            <View style={styles.historyRow}>
              <Text style={styles.detailText}>Eau</Text>
              <Text style={styles.historyValue}>
                {formatNumber(item.eau_litres)} L
              </Text>
            </View>
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>Derniers approvisionnements</Text>

      {data.deliveries.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            Aucun approvisionnement enregistré.
          </Text>
        </View>
      ) : (
        data.deliveries.slice(0, 10).map((delivery) => (
          <View key={delivery.id} style={styles.deliveryCard}>
            <View style={styles.deliveryIcon}>
              <Ionicons
                name="download-outline"
                size={22}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.deliveryInfo}>
              <Text style={styles.deliveryName}>{delivery.code_aliment}</Text>
              <Text style={styles.detailText}>
                {formatDate(delivery.date_reception)}
              </Text>
              <Text style={styles.detailText}>
                Fournisseur : {delivery.fournisseur || "Non précisé"}
              </Text>
            </View>

            <View style={styles.deliveryQuantity}>
              <Text style={styles.deliverySacks}>
                {formatNumber(delivery.nombre_sacs)}
              </Text>
              <Text style={styles.detailText}>sacs</Text>
            </View>
          </View>
        ))
      )}
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
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
    padding: 25,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.muted,
    fontSize: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  title: {
    fontSize: 25,
    fontWeight: "800",
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 5,
  },
  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: COLORS.greenLight,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 13,
    marginTop: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 15,
  },
  statCard: {
    width: "48%",
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.muted,
  },
  statValue: {
    fontSize: 19,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: 5,
  },
  stockCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 15,
    marginBottom: 11,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stockHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stockName: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
    flex: 1,
  },
  stockBadge: {
    backgroundColor: COLORS.greenLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
  },
  stockBadgeText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  stockDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginTop: 13,
    gap: 8,
  },
  detailText: {
    fontSize: 12,
    color: COLORS.muted,
  },
  progressBackground: {
    height: 7,
    backgroundColor: "#EDF1ED",
    borderRadius: 10,
    marginTop: 13,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 10,
  },
  historyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 15,
    marginBottom: 11,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
  },
  historyBands: {
    fontSize: 11,
    color: COLORS.primary,
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  historyValue: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
  },
  deliveryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 13,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  deliveryIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.greenLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  deliveryInfo: {
    flex: 1,
    gap: 4,
  },
  deliveryName: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
  },
  deliveryQuantity: {
    alignItems: "flex-end",
    marginLeft: 8,
  },
  deliverySacks: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.primary,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.muted,
    textAlign: "center",
  },
  retryText: {
    color: COLORS.primary,
    fontWeight: "700",
    marginTop: 12,
  },
});
