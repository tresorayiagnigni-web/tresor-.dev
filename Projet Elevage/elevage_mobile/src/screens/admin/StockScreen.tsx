import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  getStockSummary,
  getFeedDeliveries,
  getEquipmentStocks,
  StockSummary,
  FeedDelivery,
  FarmEquipmentStock,
} from "../../services/inventoryService";

import { getBandRecords, BandRecord } from "../../services/bandRecordService";

const COLORS = {
  background: "#F7F4F1",
  white: "#FFFFFF",
  primary: "#C97965",
  text: "#292524",
  secondary: "#89817D",
  border: "#EAE4DF",
  green: "#648B69",
  red: "#D96C65",
};

const formatNumber = (value: number) =>
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

  return "Impossible de charger les données du stock.";
};

export default function StockScreen() {
  const [stock, setStock] = useState<StockSummary | null>(null);
  const [deliveries, setDeliveries] = useState<FeedDelivery[]>([]);
  const [records, setRecords] = useState<BandRecord[]>([]);
  const [equipmentStocks, setEquipmentStocks] = useState<FarmEquipmentStock[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [stockData, deliveryData, recordData, equipmentStockData] =
        await Promise.all([
          getStockSummary(),
          getFeedDeliveries(),
          getBandRecords(),
          getEquipmentStocks(),
        ]);

      setStock(stockData);
      setDeliveries(deliveryData);
      setRecords(recordData);
      setEquipmentStocks(equipmentStockData);
    } catch (error) {
      Alert.alert("Erreur", getErrorMessage(error));
    }
  }, []);

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

  const todayDate = new Date();

  const todayKey = [
    todayDate.getFullYear(),
    String(todayDate.getMonth() + 1).padStart(2, "0"),
    String(todayDate.getDate()).padStart(2, "0"),
  ].join("-");

  const weekStartDate = new Date(todayDate);
  const dayOffset = (todayDate.getDay() + 6) % 7;
  weekStartDate.setDate(todayDate.getDate() - dayOffset);

  const weekStartKey = [
    weekStartDate.getFullYear(),
    String(weekStartDate.getMonth() + 1).padStart(2, "0"),
    String(weekStartDate.getDate()).padStart(2, "0"),
  ].join("-");

  const eggRecords = records.filter(
    (record) => Number(record.alveoles_collectees) > 0,
  );

  const weeklyEggProduction = eggRecords
    .filter((record) => {
      const recordDate = record.date_releve.slice(0, 10);
      return recordDate >= weekStartKey && recordDate <= todayKey;
    })
    .reduce(
      (total, record) => total + Number(record.alveoles_collectees || 0),
      0,
    );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement du stock...</Text>
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
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Gestion du stock</Text>
          <Text style={styles.subtitle}>Aliments et approvisionnements</Text>
        </View>

        <Ionicons name="cube-outline" size={32} color={COLORS.primary} />
      </View>

      <Text style={styles.sectionTitle}>Production d'œufs</Text>

      <View style={styles.stockCard}>
        <View style={styles.stockHeader}>
          <Ionicons name="egg-outline" size={28} color={COLORS.primary} />

          <View style={styles.stockInfo}>
            <Text style={styles.feedName}>Production cette semaine</Text>
            <Text style={styles.muted}>Depuis lundi jusqu'à aujourd'hui</Text>
          </View>

          <View style={styles.quantityBox}>
            <Text style={styles.quantity}>
              {formatNumber(weeklyEggProduction)}
            </Text>
            <Text style={styles.muted}>Alvéoles</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Relevés quotidiens</Text>

      {eggRecords.length > 0 ? (
        [...eggRecords]
          .sort((a, b) => b.date_releve.localeCompare(a.date_releve))
          .map((record) => (
            <View key={`egg-${record.id}`} style={styles.deliveryCard}>
              <View style={styles.deliveryHeader}>
                <View style={styles.deliveryIcon}>
                  <Ionicons
                    name="egg-outline"
                    size={23}
                    color={COLORS.primary}
                  />
                </View>

                <View style={styles.deliveryInfo}>
                  <Text style={styles.feedName}>
                    {record.band?.nom || "Bande non précisée"}
                  </Text>
                  <Text style={styles.muted}>
                    {formatDate(record.date_releve)}
                  </Text>
                </View>

                <View style={styles.quantityBox}>
                  <Text style={styles.quantity}>
                    {formatNumber(Number(record.alveoles_collectees) || 0)}
                  </Text>
                  <Text style={styles.muted}>Alvéoles</Text>
                </View>
              </View>
            </View>
          ))
      ) : (
        <Text style={styles.emptyText}>
          Aucune production d'œufs enregistrée.
        </Text>
      )}

      <Text style={styles.sectionTitle}>Stock alimentaire disponible</Text>

      {(stock?.stocks ?? []).length > 0 ? (
       (stock?.stocks ?? []).map((item) => (
          <View key={item.code_aliment} style={styles.stockCard}>
            <View style={styles.stockHeader}>
              <Ionicons name="leaf-outline" size={24} color={COLORS.primary} />

              <View style={styles.stockInfo}>
                <Text style={styles.feedName}>{item.code_aliment}</Text>
                <Text style={styles.muted}>Stock disponible</Text>
              </View>

              <View style={styles.quantityBox}>
                <Text style={styles.quantity}>
                  {formatNumber(item.stock_disponible)}
                </Text>
                <Text style={styles.muted}>sacs</Text>
              </View>
            </View>

            <View style={styles.stockDetails}>
              <Text style={styles.detail}>
                Reçu : {formatNumber(item.total_recu)} sacs
              </Text>
              <Text style={styles.detail}>
                Consommé : {formatNumber(item.total_consomme)} sacs
              </Text>
            </View>

            {item.stock_disponible <= 14 && (
              <Text style={styles.warning}>
                <Ionicons name="warning-outline" size={15} /> Stock faible
              </Text>
            )}
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>
          Aucun stock alimentaire enregistré.
        </Text>
      )}

      <Text style={styles.sectionTitle}>Stock réel des équipements</Text>

      {equipmentStocks.length > 0 ? (
        equipmentStocks.map((item) => (
          <View key={item.id} style={styles.stockCard}>
            <View style={styles.stockHeader}>
              <Ionicons
                name="construct-outline"
                size={25}
                color={COLORS.primary}
              />

              <View style={styles.stockInfo}>
                <Text style={styles.feedName}>
                  {item.equipment.designation}
                </Text>

                <Text style={styles.muted}>Ferme : {item.farm.nom}</Text>
              </View>

              <View style={styles.quantityBox}>
                <Text style={styles.quantity}>
                  {formatNumber(item.quantite_totale)}
                </Text>

                <Text style={styles.muted}>{item.equipment.unite}</Text>
              </View>
            </View>

            <View style={styles.stockDetails}>
              <Text style={[styles.detail, { color: COLORS.green }]}>
                Bon état : {formatNumber(item.bon_etat)} {item.equipment.unite}
              </Text>

              <Text style={[styles.detail, { color: "#E69A3A" }]}>
                Endommagé : {formatNumber(item.endommage)}{" "}
                {item.equipment.unite}
              </Text>

              <Text style={[styles.detail, { color: COLORS.red }]}>
                Hors service : {formatNumber(item.hors_service)}{" "}
                {item.equipment.unite}
              </Text>
            </View>

            <Text style={styles.muted}>
              Dernière modification : {formatDate(item.modifier_le)}
            </Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>
          Aucun stock matériel enregistré pour le moment.
        </Text>
      )}

      <Text style={styles.sectionTitle}>Historique des livraisons</Text>

      {deliveries.length > 0 ? (
        [...deliveries]
          .sort((a, b) => b.date_reception.localeCompare(a.date_reception))
          .map((delivery) => (
            <View key={delivery.id} style={styles.deliveryCard}>
              <View style={styles.deliveryHeader}>
                <View style={styles.deliveryIcon}>
                  <Ionicons
                    name="download-outline"
                    size={23}
                    color={COLORS.green}
                  />
                </View>

                <View style={styles.deliveryInfo}>
                  <Text style={styles.feedName}>{delivery.code_aliment}</Text>
                  <Text style={styles.muted}>
                    {delivery.fournisseur || "Fournisseur non précisé"}
                  </Text>
                </View>
              </View>

              <View style={styles.dateRow}>
                <Ionicons
                  name="calendar-outline"
                  size={17}
                  color={COLORS.secondary}
                />
                <Text style={styles.dateText}>
                  Réception : {formatDate(delivery.date_reception)}
                </Text>
              </View>

              <View style={styles.deliveryQuantities}>
                <View>
                  <Text style={styles.quantity}>
                    {formatNumber(delivery.quantite_tonnes)}
                  </Text>
                  <Text style={styles.muted}>Tonnes</Text>
                </View>

                <View>
                  <Text style={styles.quantity}>
                    {formatNumber(delivery.nombre_sacs)}
                  </Text>
                  <Text style={styles.muted}>Sacs reçus</Text>
                </View>
              </View>

              {delivery.observations ? (
                <Text style={styles.observations}>{delivery.observations}</Text>
              ) : null}
            </View>
          ))
      ) : (
        <Text style={styles.emptyText}>Aucune livraison enregistrée.</Text>
      )}

      <Text style={styles.sectionTitle}>Historique des consommations</Text>

      {records.filter(
        (record) =>
          Number(record.nombre_sacs) > 0 ||
          Number(record.quantite_aliment_kg) > 0,
      ).length > 0 ? (
        [...records]
          .filter(
            (record) =>
              Number(record.nombre_sacs) > 0 ||
              Number(record.quantite_aliment_kg) > 0,
          )
          .sort((a, b) => b.date_releve.localeCompare(a.date_releve))
          .map((record) => (
            <View key={record.id} style={styles.deliveryCard}>
              <View style={styles.deliveryHeader}>
                <View style={styles.deliveryIcon}>
                  <Ionicons
                    name="arrow-up-circle-outline"
                    size={23}
                    color={COLORS.red}
                  />
                </View>

                <View style={styles.deliveryInfo}>
                  <Text style={styles.feedName}>
                    {record.code_aliment || "Aliment non précisé"}
                  </Text>
                  <Text style={styles.muted}>
                    {record.band?.nom || "Bande non précisée"}
                  </Text>
                </View>
              </View>

              <View style={styles.dateRow}>
                <Ionicons
                  name="calendar-outline"
                  size={17}
                  color={COLORS.secondary}
                />
                <Text style={styles.dateText}>
                  Consommation : {formatDate(record.date_releve)}
                </Text>
              </View>

              <View style={styles.deliveryQuantities}>
                <View>
                  <Text style={styles.quantity}>
                    {formatNumber(Number(record.nombre_sacs) || 0)}
                  </Text>
                  <Text style={styles.muted}>Sacs consommés</Text>
                </View>

                <View>
                  <Text style={styles.quantity}>
                    {formatNumber(Number(record.quantite_aliment_kg) || 0)}
                  </Text>
                  <Text style={styles.muted}>Kilogrammes</Text>
                </View>
              </View>
            </View>
          ))
      ) : (
        <Text style={styles.emptyText}>Aucune consommation enregistrée.</Text>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 12,
    marginTop: 15,
  },
  stockCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stockHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stockInfo: {
    flex: 1,
  },
  feedName: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },
  muted: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 3,
  },
  quantityBox: {
    alignItems: "flex-end",
  },
  quantity: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.green,
  },
  stockDetails: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 13,
    paddingTop: 11,
    gap: 5,
  },
  detail: {
    color: COLORS.secondary,
    fontSize: 12,
  },
  warning: {
    color: COLORS.red,
    fontWeight: "700",
    fontSize: 12,
    marginTop: 10,
  },
  deliveryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  deliveryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  deliveryIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#EDF4ED",
    justifyContent: "center",
    alignItems: "center",
  },
  deliveryInfo: {
    flex: 1,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 14,
  },
  dateText: {
    color: COLORS.secondary,
    fontSize: 13,
  },
  deliveryQuantities: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 14,
    paddingTop: 13,
  },
  observations: {
    marginTop: 12,
    color: COLORS.secondary,
    fontSize: 12,
  },
  emptyText: {
    color: COLORS.secondary,
    textAlign: "center",
    padding: 20,
  },
});
