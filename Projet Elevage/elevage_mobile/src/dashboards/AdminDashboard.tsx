import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import EmployeesScreen from "../screens/admin/EmployeesScreen";
import BandesScreen from "../screens/shared/BandesScreen";
import FarmsScreen from "../screens/shared/FarmsScreen";
import EffectifsScreen from "../screens/admin/EffectifsScreen";
import ProductionScreen from "../screens/admin/ProductionScreen";
import InventoryScreen from "../screens/admin/InventoryScreen";
import StockScreen from "../screens/admin/StockScreen";
import FeedingScreen from "../screens/admin/FeedingScreen";
import ReportsScreen from "../screens/admin/ReportsScreen";
import SettingsScreen from "../screens/admin/SettingsScreen";

import { getBandes, Bande } from "../services/bandeService";
import { getBandRecords, BandRecord } from "../services/bandRecordService";

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
};

interface Props {
  user?: {
    nom?: string;
    email?: string;
    role?: string;
  };
  onLogout?: () => void;
}

type MenuItem = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type DailyProduction = {
  date: string;
  label: string;
  total: number;
};

const menuItems: MenuItem[] = [
  { title: "Tableau de bord", icon: "grid-outline" },
  { title: "Effectifs", icon: "people-outline" },
  { title: "Production", icon: "egg-outline" },
  { title: "Alimentation", icon: "leaf-outline" },
  { title: "Stock", icon: "cube-outline" },
  { title: "Inventaire", icon: "clipboard-outline" },
  { title: "Gestion des employés", icon: "people-circle-outline" },
  { title: "Exploitations", icon: "business-outline" },
  { title: "Rapports", icon: "bar-chart-outline" },
  { title: "Bandes de poulettes", icon: "layers-outline" },
];

// Obtenir une date au format YYYY-MM-DD sans conversion UTC.
const getLocalDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// Convertir une date YYYY-MM-DD en date locale.
const parseLocalDate = (dateKey: string): Date => {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day);
};

// Formater une date pour l'affichage.
const getDateLabel = (dateKey: string): string => {
  return parseLocalDate(dateKey).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
};

// Formater les nombres.
const formatNumber = (value: number): string => {
  return value.toLocaleString("fr-FR", {
    maximumFractionDigits: 2,
  });
};

// Récupérer l'identifiant d'une bande dans un relevé.
const getBandId = (record: BandRecord): number | undefined => {
  const id = record.bandId ?? record.band?.id;

  return id !== undefined && id !== null ? Number(id) : undefined;
};

// Lire la production sans transformer null en zéro.
const getProduction = (record: BandRecord): number | null => {
  const value = record.alveoles_collectees;

  if (value === null || value === undefined) {
    return null;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : null;
};

export default function AdminDashboard({ user, onLogout }: Props) {
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const [activeSection, setActiveSection] = useState("Tableau de bord");

  const [bandes, setBandes] = useState<Bande[]>([]);
  const [records, setRecords] = useState<BandRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les données depuis le backend.
  const loadDashboardData = useCallback(async () => {
    try {
      setError(null);

      const [bandesData, recordsData] = await Promise.all([
        getBandes(),
        getBandRecords(),
      ]);

      setBandes(bandesData);
      setRecords(recordsData);
    } catch (err) {
      console.error("Erreur chargement tableau de bord ADMIN :", err);

      setError(
        "Impossible de charger les statistiques. Vérifiez votre connexion.",
      );
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await loadDashboardData();
      setLoading(false);
    };

    initialize();
  }, [loadDashboardData]);

  // Actualisation manuelle.
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, [loadDashboardData]);

  // Dates de référence.
  const today = new Date();
  const todayKey = getLocalDateKey(today);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const yesterdayKey = getLocalDateKey(yesterday);

  // Début de semaine : lundi.
  const monday = new Date(today);
  const dayOfWeek = monday.getDay();

  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  monday.setDate(monday.getDate() - daysSinceMonday);

  const mondayKey = getLocalDateKey(monday);

  // Bandes actuellement en croissance.
  const activeBands = useMemo(
    () => bandes.filter((band) => band.status === "GROWING"),
    [bandes],
  );

  // Effectif actuel : dernier relevé de chaque bande active.
  const totalEffectif = useMemo(() => {
    return activeBands.reduce((total, band) => {
      const bandRecords = records
        .filter((record) => getBandId(record) === band.id)
        .sort((a, b) => {
          const dateComparison = b.date_releve.localeCompare(a.date_releve);

          if (dateComparison !== 0) {
            return dateComparison;
          }

          return b.id - a.id;
        });

      const latestRecord = bandRecords[0];

      const effectif = latestRecord
        ? Number(latestRecord.effectif_restant)
        : Number(band.effectif_initial);

      return total + (Number.isFinite(effectif) && effectif > 0 ? effectif : 0);
    }, 0);
  }, [activeBands, records]);

  // Relevés de production du jour.
  const todayRecords = useMemo(
    () =>
      records.filter((record) => record.date_releve.slice(0, 10) === todayKey),
    [records, todayKey],
  );

  // Relevés de production de la veille.
  const yesterdayRecords = useMemo(
    () =>
      records.filter(
        (record) => record.date_releve.slice(0, 10) === yesterdayKey,
      ),
    [records, yesterdayKey],
  );

  // Production totale du jour.
  const todayProduction = useMemo(() => {
    return todayRecords.reduce((total, record) => {
      const production = getProduction(record);

      return total + (production ?? 0);
    }, 0);
  }, [todayRecords]);

  // Production totale de la veille.
  const yesterdayProduction = useMemo(() => {
    return yesterdayRecords.reduce((total, record) => {
      const production = getProduction(record);

      return total + (production ?? 0);
    }, 0);
  }, [yesterdayRecords]);

  // Comparaison sur les mêmes bandes uniquement.
  const productionComparison = useMemo(() => {
    const yesterdayMap = new Map<number, number>();

    yesterdayRecords.forEach((record) => {
      const bandId = getBandId(record);
      const production = getProduction(record);

      if (bandId !== undefined && production !== null) {
        yesterdayMap.set(bandId, production);
      }
    });

    let todayTotal = 0;
    let yesterdayTotal = 0;
    let comparedBands = 0;

    todayRecords.forEach((record) => {
      const bandId = getBandId(record);
      const production = getProduction(record);

      if (
        bandId === undefined ||
        production === null ||
        !yesterdayMap.has(bandId)
      ) {
        return;
      }

      todayTotal += production;
      yesterdayTotal += yesterdayMap.get(bandId)!;
      comparedBands += 1;
    });

    return {
      today: todayTotal,
      yesterday: yesterdayTotal,
      difference: todayTotal - yesterdayTotal,
      comparedBands,
    };
  }, [todayRecords, yesterdayRecords]);

  // Production hebdomadaire : lundi jusqu'à aujourd'hui.
  const weeklyProduction = useMemo(() => {
    return records.reduce((total, record) => {
      const date = record.date_releve.slice(0, 10);

      if (date < mondayKey || date > todayKey) {
        return total;
      }

      const production = getProduction(record);

      return total + (production ?? 0);
    }, 0);
  }, [records, mondayKey, todayKey]);

  // Production du jour par bande.
  const productionByBand = useMemo(() => {
    return activeBands
      .map((band) => {
        const bandProduction = todayRecords
          .filter((record) => getBandId(record) === band.id)
          .reduce((total, record) => {
            const production = getProduction(record);

            return total + (production ?? 0);
          }, 0);

        const hasRecord = todayRecords.some(
          (record) =>
            getBandId(record) === band.id && getProduction(record) !== null,
        );

        return {
          id: band.id,
          nom: band.nom,
          production: bandProduction,
          hasRecord,
        };
      })
      .filter((band) => band.hasRecord)
      .sort((a, b) => b.production - a.production);
  }, [activeBands, todayRecords]);

  // Construire les sept derniers jours.
  const weeklyChart = useMemo<DailyProduction[]>(() => {
    const result: DailyProduction[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const dateKey = getLocalDateKey(date);

      const total = records
        .filter((record) => record.date_releve.slice(0, 10) === dateKey)
        .reduce((sum, record) => {
          const production = getProduction(record);

          return sum + (production ?? 0);
        }, 0);

      result.push({
        date: dateKey,
        label: date.toLocaleDateString("fr-FR", {
          weekday: "short",
        }),
        total,
      });
    }

    return result;
  }, [records, todayKey]);

  const maxChartValue = Math.max(...weeklyChart.map((item) => item.total), 1);

  // Initiales de l'administrateur.
  const initials =
    user?.nom
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() || "AD";

  const selectSection = (section: string) => {
    setActiveSection(section);
    setSidebarVisible(false);
  };

  // Cartes de statistiques.
  const stats = [
    {
      title: "Sujets Restants",
      value: formatNumber(totalEffectif),
      detail: "Sujets dans les bandes actives",
      icon: "people-outline" as const,
      color: COLORS.primary,
    },
    {
      title: "Production en Oeufs",
      value: formatNumber(todayProduction),
      detail: "Alvéoles collectées aujourd'hui",
      icon: "nutrition-outline" as const,
      color: COLORS.orange,
    },
    {
      title: "Bandes actives",
      value: String(activeBands.length),
      detail: "Bandes en croissance",
      icon: "layers-outline" as const,
      color: COLORS.green,
    },
    {
      title: "Relevés du jour",
      value: String(todayRecords.length),
      detail: "Fiches journalières enregistrées",
      icon: "clipboard-outline" as const,
      color: COLORS.primary,
    },
  ];

  // Carte de comparaison.
  const renderComparison = () => {
    if (productionComparison.comparedBands === 0) {
      return (
        <Text style={styles.comparisonDescription}>
          Pas encore assez de données pour comparer les mêmes bandes avec la
          veille.
        </Text>
      );
    }

    const difference = productionComparison.difference;

    const isPositive = difference > 0;
    const isNegative = difference < 0;

    const color = isPositive
      ? COLORS.green
      : isNegative
        ? COLORS.red
        : COLORS.secondary;

    const icon = isPositive
      ? "trending-up-outline"
      : isNegative
        ? "trending-down-outline"
        : "remove-outline";

    const label = isPositive
      ? "En hausse"
      : isNegative
        ? "En baisse"
        : "Stable";

    return (
      <View style={styles.comparisonResult}>
        <View
          style={[styles.comparisonIcon, { backgroundColor: `${color}18` }]}
        >
          <Ionicons name={icon} size={22} color={color} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.comparisonValue, { color }]}>
            {difference > 0 ? "+" : ""}
            {formatNumber(difference)} alvéoles
          </Text>

          <Text style={styles.comparisonDescription}>
            {label} · {productionComparison.comparedBands} bande(s) comparée(s)
          </Text>
        </View>
      </View>
    );
  };

  const renderDashboard = () => (
    <>
      <View style={styles.welcome}>
        <View>
          <Text style={styles.greeting}>Bonjour, administrateur 👋</Text>

          <Text style={styles.userName}>
            {user?.nom || "Bienvenue sur Elevage+"}
          </Text>

          <Text style={styles.welcomeSubtitle}>
            Voici un aperçu de votre exploitation.
          </Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Vue d'ensemble</Text>

        <Text style={styles.today}>
          {today.toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />

          <Text style={styles.loadingText}>Chargement des statistiques...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle-outline" size={30} color={COLORS.red} />

          <Text style={styles.errorText}>{error}</Text>

          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.statsGrid}>
            {stats.map((item, index) => (
              <View key={index} style={styles.statCard}>
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: `${item.color}18` },
                  ]}
                >
                  <Ionicons name={item.icon} size={23} color={item.color} />
                </View>

                <Text style={styles.statValue}>{item.value}</Text>

                <Text style={styles.statTitle}>{item.title}</Text>

                <Text style={styles.statDetail}>{item.detail}</Text>
              </View>
            ))}
          </View>

          {/* COMPARAISON AVEC LA VEILLE */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Évolution de la production</Text>
          </View>

          <View style={styles.comparisonCard}>
            <View style={styles.comparisonHeader}>
              <Text style={styles.cardTitle}>Aujourd'hui / Hier</Text>

              <Ionicons
                name="analytics-outline"
                size={21}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.comparisonNumbers}>
              <View style={styles.comparisonColumn}>
                <Text style={styles.smallLabel}>Aujourd'hui</Text>

                <Text style={styles.largeNumber}>
                  {formatNumber(todayProduction)}
                </Text>

                <Text style={styles.unitLabel}>alvéoles</Text>
              </View>

              <View style={styles.comparisonDivider} />

              <View style={styles.comparisonColumn}>
                <Text style={styles.smallLabel}>Hier</Text>

                <Text style={styles.largeNumber}>
                  {formatNumber(yesterdayProduction)}
                </Text>

                <Text style={styles.unitLabel}>alvéoles</Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            {renderComparison()}
          </View>

          {/* PRODUCTION HEBDOMADAIRE */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bilan hebdomadaire</Text>
          </View>

          <View style={styles.weeklyCard}>
            <View style={styles.weeklyHeader}>
              <View style={styles.weeklyIcon}>
                <Ionicons
                  name="calendar-outline"
                  size={23}
                  color={COLORS.primary}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.weeklyTitle}>Production de la semaine</Text>

                <Text style={styles.weeklySubtitle}>Depuis lundi</Text>
              </View>
            </View>

            <Text style={styles.weeklyValue}>
              {formatNumber(weeklyProduction)}
            </Text>

            <Text style={styles.weeklyUnit}>Alvéoles collectées</Text>
          </View>

          {/* GRAPHIQUE SUR 7 JOURS */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Production des 7 derniers jours
            </Text>
          </View>

          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.cardTitle}>Historique de production</Text>

              <Ionicons
                name="bar-chart-outline"
                size={21}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.chart}>
              {weeklyChart.map((item) => {
                const barHeight =
                  item.total > 0
                    ? Math.max((item.total / maxChartValue) * 125, 5)
                    : 3;

                return (
                  <View key={item.date} style={styles.chartColumn}>
                    <Text style={styles.chartValue} numberOfLines={1}>
                      {formatNumber(item.total)}
                    </Text>

                    <View style={styles.barContainer}>
                      <View
                        style={[
                          styles.chartBar,
                          {
                            height: barHeight,
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

          {/* PRODUCTION PAR BANDE */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Production par bande</Text>

            <Text style={styles.today}>Aujourd'hui</Text>
          </View>

          <View style={styles.bandProductionCard}>
            {productionByBand.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="egg-outline"
                  size={30}
                  color={COLORS.secondary}
                />

                <Text style={styles.emptyText}>
                  Aucun relevé de production disponible pour aujourd'hui.
                </Text>
              </View>
            ) : (
              productionByBand.map((band, index) => {
                const percentage =
                  todayProduction > 0
                    ? (band.production / todayProduction) * 100
                    : 0;

                return (
                  <View key={band.id}>
                    {index > 0 && <View style={styles.bandDivider} />}

                    <View style={styles.bandProductionRow}>
                      <View style={styles.bandEggIcon}>
                        <Ionicons
                          name="egg-outline"
                          size={21}
                          color={COLORS.primary}
                        />
                      </View>

                      <View style={styles.bandProductionInfo}>
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

                      <Text style={styles.bandProductionValue}>
                        {formatNumber(band.production)}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </>
      )}

      {/* MODULES DE GESTION */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Gestion de l'exploitation</Text>
      </View>

      <View style={styles.modulesGrid}>
        {menuItems.slice(1).map((item) => (
          <TouchableOpacity
            key={item.title}
            style={styles.moduleCard}
            onPress={() => selectSection(item.title)}
          >
            <View style={styles.moduleIcon}>
              <Ionicons name={item.icon} size={25} color={COLORS.primary} />
            </View>

            <Text style={styles.moduleTitle}>{item.title}</Text>

            <Ionicons
              name="chevron-forward"
              size={16}
              color={COLORS.secondary}
            />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.alertCard}>
        <View style={styles.alertIcon}>
          <Ionicons
            name="notifications-outline"
            size={23}
            color={COLORS.primary}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.alertTitle}>Suivi de votre élevage</Text>

          <Text style={styles.alertDescription}>
            Consultez régulièrement les informations de votre exploitation.
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color={COLORS.secondary} />
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setSidebarVisible(true)}
            >
              <Ionicons name="menu-outline" size={27} color={COLORS.text} />
            </TouchableOpacity>

            <View>
              <Text style={styles.brand}>
                Elevage<Text style={styles.brandPlus}>+</Text>
              </Text>

              <Text style={styles.headerSubtitle}>ESPACE ADMINISTRATEUR</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => setSidebarVisible(true)}
          >
            <Text style={styles.profileInitials}>{initials}</Text>
          </TouchableOpacity>
        </View>

        {/* CONTENU PRINCIPAL */}
        {activeSection === "Tableau de bord" ? (
          renderDashboard()
        ) : activeSection === "Gestion des employés" ? (
          <EmployeesScreen />
        ) : activeSection === "Effectifs" ? (
          <EffectifsScreen />
        ) : activeSection === "Production" ? (
          <ProductionScreen records={records} loading={loading} />
        ) : activeSection === "Stock" ? (
          <StockScreen />
        ) : activeSection === "Inventaire" ? (
          <InventoryScreen role="ADMIN" />
        ) : activeSection === "Alimentation" ? (
          <FeedingScreen />
        ) : activeSection === "Rapports" ? (
          <ReportsScreen />
        ) : activeSection === "Exploitations" ? (
          <FarmsScreen />
        ) : activeSection === "Bandes de poulettes" ? (
          <BandesScreen role="ADMIN" />
        ) : activeSection === "Paramètres" ? (
          <SettingsScreen />
        ) : (
          <View style={styles.sectionPage}>
            <View style={styles.sectionPageIcon}>
              <Ionicons
                name={
                  menuItems.find((item) => item.title === activeSection)
                    ?.icon || "grid-outline"
                }
                size={38}
                color={COLORS.primary}
              />
            </View>

            <Text style={styles.sectionPageTitle}>{activeSection}</Text>

            <Text style={styles.sectionPageDescription}>
              La rubrique {activeSection.toLowerCase()} sera développée ici.
            </Text>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => selectSection("Tableau de bord")}
            >
              <Ionicons
                name="arrow-back-outline"
                size={19}
                color={COLORS.white}
              />

              <Text style={styles.backButtonText}>
                Retour au tableau de bord
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.footer}>
          Elevage+ · Gestion intelligente de votre élevage
        </Text>
      </ScrollView>

      {/* SIDEBAR */}
      {sidebarVisible && (
        <View style={styles.sidebarOverlay}>
          <TouchableOpacity
            style={styles.overlayBackground}
            activeOpacity={1}
            onPress={() => setSidebarVisible(false)}
          />

          <View style={styles.sidebar}>
            {/* PROFIL */}
            <View style={styles.sidebarProfile}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>

              <View style={styles.profileInfo}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {user?.nom || "Administrateur"}
                </Text>

                <Text style={styles.profileEmail} numberOfLines={1}>
                  {user?.email || "Compte administrateur"}
                </Text>

                <View style={styles.roleBadge}>
                  <View style={styles.onlineDot} />

                  <Text style={styles.roleText}>Administrateur</Text>
                </View>
              </View>

              <TouchableOpacity onPress={() => setSidebarVisible(false)}>
                <Ionicons
                  name="close-outline"
                  size={25}
                  color={COLORS.secondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.sidebarDivider} />

            <Text style={styles.menuLabel}>MENU PRINCIPAL</Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.sidebarMenu}
            >
              {menuItems.map((item) => {
                const active = activeSection === item.title;

                return (
                  <TouchableOpacity
                    key={item.title}
                    style={[
                      styles.sidebarItem,
                      active && styles.sidebarItemActive,
                    ]}
                    onPress={() => selectSection(item.title)}
                  >
                    <Ionicons
                      name={item.icon}
                      size={21}
                      color={active ? COLORS.primary : COLORS.secondary}
                    />

                    <Text
                      style={[
                        styles.sidebarItemText,
                        active && styles.sidebarItemTextActive,
                      ]}
                    >
                      {item.title}
                    </Text>

                    {active && <View style={styles.activeIndicator} />}
                  </TouchableOpacity>
                );
              })}

              <View style={styles.sidebarDivider} />

              <TouchableOpacity
                style={[
                  styles.sidebarItem,
                  activeSection === "Paramètres" && styles.sidebarItemActive,
                ]}
                onPress={() => selectSection("Paramètres")}
              >
                <Ionicons
                  name="settings-outline"
                  size={21}
                  color={
                    activeSection === "Paramètres"
                      ? COLORS.primary
                      : COLORS.secondary
                  }
                />

                <Text
                  style={[
                    styles.sidebarItemText,
                    activeSection === "Paramètres" &&
                      styles.sidebarItemTextActive,
                  ]}
                >
                  Paramètres
                </Text>
              </TouchableOpacity>
            </ScrollView>

            {/* DECONNEXION */}
            <View style={styles.sidebarBottom}>
              {onLogout && (
                <TouchableOpacity
                  style={styles.logoutButton}
                  onPress={() => {
                    setSidebarVisible(false);
                    onLogout();
                  }}
                >
                  <Ionicons
                    name="log-out-outline"
                    size={21}
                    color={COLORS.primary}
                  />

                  <Text style={styles.logoutText}>Se déconnecter</Text>
                </TouchableOpacity>
              )}

              <Text style={styles.sidebarFooter}>Elevage+ · Version 1.0</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  menuButton: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  brand: {
    fontSize: 25,
    fontWeight: "900",
    color: COLORS.text,
  },

  brandPlus: {
    color: COLORS.primary,
  },

  headerSubtitle: {
    color: COLORS.secondary,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginTop: 3,
  },

  profileButton: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  profileInitials: {
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: 15,
  },

  welcome: {
    marginHorizontal: 20,
    padding: 22,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 22,
    marginBottom: 26,
  },

  greeting: {
    fontSize: 14,
    color: COLORS.secondary,
  },

  userName: {
    fontSize: 23,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: 5,
  },

  welcomeSubtitle: {
    color: COLORS.secondary,
    fontSize: 12,
    marginTop: 8,
  },

  sectionHeader: {
    paddingHorizontal: 22,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
  },

  today: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "700",
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 14,
    marginBottom: 27,
  },

  statCard: {
    width: "46%",
    margin: "2%",
    padding: 15,
    backgroundColor: COLORS.white,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  iconCircle: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  statValue: {
    fontSize: 23,
    fontWeight: "900",
    color: COLORS.text,
  },

  statTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 5,
  },

  statDetail: {
    fontSize: 10,
    color: COLORS.secondary,
    marginTop: 4,
    lineHeight: 15,
  },

  loadingContainer: {
    padding: 35,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: COLORS.secondary,
    fontSize: 12,
    marginTop: 12,
  },

  errorCard: {
    marginHorizontal: 20,
    marginBottom: 25,
    padding: 22,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  errorText: {
    color: COLORS.secondary,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 19,
    marginTop: 10,
  },

  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: 12,
    marginTop: 15,
  },

  retryButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
  },

  comparisonCard: {
    marginHorizontal: 20,
    padding: 17,
    backgroundColor: COLORS.white,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 26,
  },

  comparisonHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  cardTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
  },

  comparisonNumbers: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 22,
    marginBottom: 18,
  },

  comparisonColumn: {
    flex: 1,
  },

  smallLabel: {
    fontSize: 11,
    color: COLORS.secondary,
  },

  largeNumber: {
    fontSize: 25,
    fontWeight: "900",
    color: COLORS.text,
    marginTop: 7,
  },

  unitLabel: {
    fontSize: 10,
    color: COLORS.secondary,
    marginTop: 3,
  },

  comparisonDivider: {
    width: 1,
    height: 55,
    backgroundColor: COLORS.border,
    marginHorizontal: 15,
  },

  cardDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 15,
  },

  comparisonResult: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  comparisonIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  comparisonValue: {
    fontSize: 15,
    fontWeight: "900",
  },

  comparisonDescription: {
    fontSize: 11,
    color: COLORS.secondary,
    lineHeight: 17,
    marginTop: 4,
  },

  weeklyCard: {
    marginHorizontal: 20,
    padding: 19,
    backgroundColor: COLORS.white,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 27,
  },

  weeklyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  weeklyIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  weeklyTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
  },

  weeklySubtitle: {
    fontSize: 10,
    color: COLORS.secondary,
    marginTop: 4,
  },

  weeklyValue: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.primary,
    marginTop: 22,
  },

  weeklyUnit: {
    fontSize: 11,
    color: COLORS.secondary,
    marginTop: 4,
  },

  chartCard: {
    marginHorizontal: 20,
    padding: 17,
    backgroundColor: COLORS.white,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 27,
  },

  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },

  chart: {
    height: 180,
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
    fontSize: 9,
    color: COLORS.secondary,
    marginBottom: 7,
  },

  barContainer: {
    height: 130,
    width: "65%",
    justifyContent: "flex-end",
    alignItems: "center",
  },

  chartBar: {
    width: "100%",
    borderRadius: 7,
    minHeight: 3,
  },

  chartLabel: {
    fontSize: 10,
    color: COLORS.secondary,
    marginTop: 9,
    textTransform: "capitalize",
  },

  bandProductionCard: {
    marginHorizontal: 20,
    padding: 17,
    backgroundColor: COLORS.white,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 27,
  },

  emptyContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },

  emptyText: {
    color: COLORS.secondary,
    fontSize: 11,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 18,
  },

  bandProductionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingVertical: 8,
  },

  bandEggIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  bandProductionInfo: {
    flex: 1,
  },

  bandName: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 8,
  },

  progressBackground: {
    height: 6,
    borderRadius: 5,
    backgroundColor: COLORS.background,
    overflow: "hidden",
  },

  progressBar: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },

  bandProductionValue: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "900",
    minWidth: 45,
    textAlign: "right",
  },

  bandDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 9,
  },

  modulesGrid: {
    paddingHorizontal: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 22,
  },

  moduleCard: {
    width: "48%",
    backgroundColor: COLORS.white,
    borderRadius: 17,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  moduleIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  moduleTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
  },

  alertCard: {
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },

  alertIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  alertTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
  },

  alertDescription: {
    fontSize: 11,
    color: COLORS.secondary,
    marginTop: 5,
    lineHeight: 17,
  },

  footer: {
    textAlign: "center",
    color: COLORS.secondary,
    fontSize: 10,
    marginTop: 24,
    marginBottom: 30,
  },

  sidebarOverlay: {
    ...StyleSheet.absoluteFill,
    flexDirection: "row",
    zIndex: 100,
  },

  overlayBackground: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(30, 24, 21, 0.45)",
  },

  sidebar: {
    width: "82%",
    maxWidth: 330,
    height: "100%",
    backgroundColor: COLORS.white,
    paddingTop: 55,
    paddingHorizontal: 19,
    paddingBottom: 18,
    elevation: 15,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },

  sidebarProfile: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },

  avatar: {
    width: 53,
    height: 53,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: 18,
  },

  profileInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 7,
  },

  profileName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
  },

  profileEmail: {
    color: COLORS.secondary,
    fontSize: 10,
    marginTop: 4,
  },

  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
    gap: 5,
  },

  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 5,
    backgroundColor: COLORS.green,
  },

  roleText: {
    fontSize: 10,
    color: COLORS.green,
    fontWeight: "700",
  },

  sidebarDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 17,
  },

  menuLabel: {
    color: COLORS.secondary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 13,
  },

  sidebarMenu: {
    flex: 1,
  },

  sidebarItem: {
    minHeight: 49,
    paddingHorizontal: 13,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
    gap: 13,
  },

  sidebarItemActive: {
    backgroundColor: COLORS.primaryLight,
  },

  sidebarItemText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.secondary,
  },

  sidebarItemTextActive: {
    color: COLORS.primary,
    fontWeight: "800",
  },

  activeIndicator: {
    width: 5,
    height: 23,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },

  sidebarBottom: {
    paddingTop: 10,
  },

  logoutButton: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  logoutText: {
    color: COLORS.primary,
    fontWeight: "800",
    fontSize: 13,
  },

  sidebarFooter: {
    textAlign: "center",
    color: COLORS.secondary,
    fontSize: 10,
    marginTop: 15,
  },

  sectionPage: {
    margin: 20,
    padding: 25,
    backgroundColor: COLORS.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    marginTop: 35,
  },

  sectionPageIcon: {
    width: 75,
    height: 75,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  sectionPageTitle: {
    fontSize: 23,
    fontWeight: "900",
    color: COLORS.text,
  },

  sectionPageDescription: {
    fontSize: 13,
    color: COLORS.secondary,
    textAlign: "center",
    lineHeight: 21,
    marginTop: 12,
  },

  backButton: {
    marginTop: 25,
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  backButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
  },
});
