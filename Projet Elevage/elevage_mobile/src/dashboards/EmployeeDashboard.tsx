
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import BandesScreen from "../screens/shared/BandesScreen";
import DailyTrackingScreen from "../screens/employee/DailyTrackingScreen";
import HistoryScreen from "../screens/employee/HistoryScreen";
import InventoryScreen from "../screens/admin/InventoryScreen";

import { getBandes, Bande } from "../services/bandeService";
import { getBandRecords, BandRecord } from "../services/bandRecordService";

// ======================================================
// COULEURS
// ======================================================

const COLORS = {
  background: "#F7F4F1",
  white: "#FFFFFF",
  primary: "#C97965",
  primaryLight: "#F9E8E3",
  text: "#292524",
  secondary: "#89817D",
  border: "#EAE4DF",
  green: "#648B69",
  red: "#C65D55",
};

interface Props {
  user?: {
    nom?: string;
    email?: string;
  };
  onLogout?: () => void;
}

type Section =
  | "Tableau de bord"
  | "Mes bandes"
  | "Suivi journalier"
  | "Historique"
  | "Inventaire physique"
  | "Mon profil";

type MenuItem = {
  title: Section;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
};

const menuItems: MenuItem[] = [
  {
    title: "Tableau de bord",
    icon: "grid-outline",
    description: "Vue générale",
  },
  {
    title: "Mes bandes",
    icon: "layers-outline",
    description: "Consulter mes bandes",
  },
  {
    title: "Suivi journalier",
    icon: "clipboard-outline",
    description: "Enregistrer les relevés",
  },
  {
    title: "Historique",
    icon: "time-outline",
    description: "Consulter les anciens relevés",
  },
  {
    title: "Inventaire physique",
    icon: "file-tray-full-outline",
    description: "Gérer les inventaires de mes bandes",
  },
  {
    title: "Mon profil",
    icon: "person-outline",
    description: "Mes informations",
  },
];

const getLocalDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getDateLabel = (dateKey: string): string => {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
};

const formatProduction = (value: number): string =>
  value.toLocaleString("fr-FR", {
    maximumFractionDigits: 2,
  });

const getRecordDate = (record: BandRecord): string =>
  record.date_releve?.slice(0, 10) ?? "";

const getProduction = (record: BandRecord): number | null => {
  const value = Number(record.alveoles_collectees);

  return record.alveoles_collectees !== null &&
    record.alveoles_collectees !== undefined &&
    Number.isFinite(value)
    ? value
    : null;
};

export default function EmployeeDashboard({ user, onLogout }: Props) {
  const [activeSection, setActiveSection] =
    useState<Section>("Tableau de bord");

  const [sidebarVisible, setSidebarVisible] = useState(false);

  const [bandes, setBandes] = useState<Bande[]>([]);
  const [records, setRecords] = useState<BandRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setLoadError("");

      const [bandesData, recordsData] = await Promise.all([
        getBandes(),
        getBandRecords(),
      ]);

      setBandes(bandesData);
      setRecords(recordsData);
    } catch (error) {
      console.error("Erreur chargement dashboard employé :", error);

      setLoadError(
        "Impossible de charger les données. Vérifiez votre connexion.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboard();
  }, [loadDashboard]);

  // ====================================================
  // NAVIGATION
  // ====================================================

  const navigateTo = (section: Section) => {
    setActiveSection(section);
    setSidebarVisible(false);
  };

  const initials =
    user?.nom
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() || "EM";

  const today = new Date();
  const todayKey = getLocalDateKey(today);

  const yesterday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - 1,
  );

  const yesterdayKey = getLocalDateKey(yesterday);

  const bandesActives = useMemo(
    () => bandes.filter((bande) => bande.status === "GROWING"),
    [bandes],
  );

  const getBandId = (record: BandRecord): number | undefined => {
    const id = record.bandId ?? record.band?.id;
    return id !== undefined && id !== null ? Number(id) : undefined;
  };

  const getLatestRecord = (bandId: number) => {
    return [...records]
      .filter((record) => getBandId(record) === Number(bandId))
      .sort((a, b) =>
        getRecordDate(b).localeCompare(getRecordDate(a)),
      )[0];
  };

  const recordsToday = records.filter(
    (record) => getRecordDate(record) === todayKey,
  );

  const recordsYesterday = records.filter(
    (record) => getRecordDate(record) === yesterdayKey,
  );

  const productionToday = recordsToday.reduce(
    (total, record) => total + (getProduction(record) ?? 0),
    0,
  );

  const bandsReportingToday = new Set(
    recordsToday
      .filter((record) => getProduction(record) !== null)
      .map((record) => getBandId(record))
      .filter((id): id is number => id !== undefined),
  ).size;

  const yesterdayByBand = new Map<number, number>();

  recordsYesterday.forEach((record) => {
    const bandId = getBandId(record);
    const production = getProduction(record);

    if (bandId !== undefined && production !== null) {
      yesterdayByBand.set(bandId, production);
    }
  });

  const todayByBand = new Map<number, number>();

  recordsToday.forEach((record) => {
    const bandId = getBandId(record);
    const production = getProduction(record);

    if (bandId === undefined || production === null) {
      return;
    }

    todayByBand.set(
      bandId,
      (todayByBand.get(bandId) ?? 0) + production,
    );
  });

  let productionComparableToday = 0;
  let productionComparableYesterday = 0;
  let comparableBandsCount = 0;

  todayByBand.forEach((productionTodayByBand, bandId) => {
    const previousProduction = yesterdayByBand.get(bandId);

    if (previousProduction === undefined) {
      return;
    }

    productionComparableToday += productionTodayByBand;
    productionComparableYesterday += previousProduction;
    comparableBandsCount += 1;
  });

  const productionDifference =
    productionComparableToday - productionComparableYesterday;

  const productionPercentage =
    productionComparableYesterday > 0
      ? (productionDifference / productionComparableYesterday) * 100
      : null;

  const monday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const dayOfWeek = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - dayOfWeek);

  const mondayKey = getLocalDateKey(monday);

  const recordsThisWeek = records.filter((record) => {
    const dateKey = getRecordDate(record);

    return dateKey >= mondayKey && dateKey <= todayKey;
  });

  const productionThisWeek = recordsThisWeek.reduce(
    (total, record) => total + (getProduction(record) ?? 0),
    0,
  );

  const daysWithProduction = new Set(
    recordsThisWeek
      .filter((record) => getProduction(record) !== null)
      .map((record) => getRecordDate(record)),
  ).size;

  const productionByBand = bandesActives.map((bande) => {
    const bandRecords = recordsToday.filter(
      (record) => getBandId(record) === Number(bande.id),
    );

    const production = bandRecords.reduce(
      (total, record) => total + (getProduction(record) ?? 0),
      0,
    );

    const hasProduction = bandRecords.some(
      (record) => getProduction(record) !== null,
    );

    return {
      id: bande.id,
      nom: bande.nom,
      production,
      hasProduction,
    };
  });

  const lastSevenDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - (6 - index),
    );

    const dateKey = getLocalDateKey(date);

    const dayRecords = records.filter(
      (record) => getRecordDate(record) === dateKey,
    );

    const production = dayRecords.reduce(
      (total, record) => total + (getProduction(record) ?? 0),
      0,
    );

    return {
      dateKey,
      label: date.toLocaleDateString("fr-FR", {
        weekday: "short",
      }),
      production,
      hasData: dayRecords.some(
        (record) => getProduction(record) !== null,
      ),
    };
  });

  const maxDailyProduction = Math.max(
    1,
    ...lastSevenDays.map((day) => day.production),
  );

  const effectifTotal = bandesActives.reduce((total, bande) => {
    const latest = getLatestRecord(bande.id);

    const effectif = Number(
      latest?.effectif_restant ?? bande.effectif_initial,
    );

    return total + (Number.isFinite(effectif) ? effectif : 0);
  }, 0);

  const mortaliteTotale = records.reduce((total, record) => {
    const mortalite = Number(record.mortalite_jour);

    return total + (Number.isFinite(mortalite) ? mortalite : 0);
  }, 0);

  const activiteRecente = [...records]
    .sort((a, b) =>
      getRecordDate(b).localeCompare(getRecordDate(a)),
    )
    .slice(0, 5);

  const formatDate = (dateString: string) => {
    if (!dateString) return "Date inconnue";

    const date = new Date(`${dateString.slice(0, 10)}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return dateString;
    }

    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getBandName = (record: BandRecord) => {
    const bandId = getBandId(record);

    return (
      record.band?.nom ||
      bandes.find((bande) => Number(bande.id) === bandId)?.nom ||
      `Bande ${bandId ?? ""}`
    );
  };

  const renderSidebar = () => (
    <View style={styles.sidebar}>
      <View style={styles.sidebarHeader}>
        <View>
          <Text style={styles.sidebarBrand}>
            ÉLEVAGE<Text style={styles.brandPlus}>+</Text>
          </Text>

          <Text style={styles.sidebarSubtitle}>ESPACE EMPLOYÉ</Text>
        </View>

        <TouchableOpacity
          onPress={() => setSidebarVisible(false)}
          accessibilityLabel="Fermer le menu"
        >
          <Ionicons name="close" size={25} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.sidebarProfile}>
        <View style={styles.sidebarAvatar}>
          <Text style={styles.sidebarAvatarText}>{initials}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.sidebarName} numberOfLines={1}>
            {user?.nom || "Employé"}
          </Text>

          <Text style={styles.sidebarRole}>Employé</Text>
        </View>
      </View>

      <Text style={styles.menuLabel}>MENU PRINCIPAL</Text>

      {menuItems.map((item) => {
        const active = activeSection === item.title;

        return (
          <TouchableOpacity
            key={item.title}
            style={[
              styles.sidebarItem,
              active && styles.sidebarItemActive,
            ]}
            onPress={() => navigateTo(item.title)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={item.icon}
              size={20}
              color={active ? COLORS.primary : "#D4C9C3"}
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

      <View style={{ flex: 1 }} />

      <View style={styles.sidebarDivider} />

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => {
          setSidebarVisible(false);
          onLogout?.();
        }}
      >
        <Ionicons name="log-out-outline" size={21} color="#E9A08D" />

        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>

      <Text style={styles.sidebarFooter}>
        Élevage+ · Version employé
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.topHeader}>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => setSidebarVisible(true)}
        accessibilityLabel="Ouvrir le menu"
      >
        <Ionicons name="menu" size={25} color={COLORS.text} />
      </TouchableOpacity>

      <View style={{ flex: 1 }}>
        <Text style={styles.headerBrand}>
          ÉLEVAGE<Text style={styles.brandPlus}>+</Text>
        </Text>

        <Text style={styles.headerSubtitle}>ESPACE EMPLOYÉ</Text>
      </View>

      <TouchableOpacity
        style={styles.profileCircle}
        onPress={() => navigateTo("Mon profil")}
      >
        <Text style={styles.profileInitials}>{initials}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStatCard = (
    icon: keyof typeof Ionicons.glyphMap,
    value: string,
    label: string,
    iconColor: string,
  ) => (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>

      <Text style={styles.statValue}>{value}</Text>

      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const renderHome = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
        />
      }
      contentContainerStyle={styles.homeContent}
    >
      <View style={styles.welcomeCard}>
        <Text style={styles.greeting}>Bonjour 👋</Text>

        <Text style={styles.userName}>
          {user?.nom || "Employé"}
        </Text>

        <Text style={styles.welcomeText}>
          Voici le résumé de votre activité d'élevage.
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />

          <Text style={styles.loadingText}>
            Chargement de vos données...
          </Text>
        </View>
      ) : (
        <>
          {loadError !== "" && (
            <View style={styles.errorCard}>
              <Ionicons
                name="alert-circle-outline"
                size={22}
                color="#B94A48"
              />

              <View style={{ flex: 1 }}>
                <Text style={styles.errorText}>{loadError}</Text>

                <TouchableOpacity onPress={loadDashboard}>
                  <Text style={styles.retryText}>Réessayer</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STATISTIQUES */}

          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Vue générale</Text>

            <Text style={styles.sectionSubtitle}>
              Situation actuelle de vos bandes.
            </Text>
          </View>

          <View style={styles.statsGrid}>
            {renderStatCard(
              "layers-outline",
              String(bandesActives.length),
              "Bandes actives",
              COLORS.primary,
            )}

            {renderStatCard(
              "paw-outline",
              effectifTotal.toLocaleString("fr-FR"),
              "Effectif actuel",
              COLORS.green,
            )}

            {renderStatCard(
              "trending-down-outline",
              mortaliteTotale.toLocaleString("fr-FR"),
              "Mortalité cumulée",
              COLORS.primary,
            )}

            {renderStatCard(
              "clipboard-outline",
              String(records.length),
              "Relevés enregistrés",
              COLORS.primary,
            )}
          </View>

          {/* PRODUCTION D'ŒUFS */}

          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Production d'œufs</Text>

            <Text style={styles.sectionSubtitle}>
              Suivi de la collecte de vos bandes.
            </Text>
          </View>

          <View style={styles.productionMainCard}>
            <View style={styles.productionMainHeader}>
              <View>
                <Text style={styles.productionMainLabel}>
                  Production enregistrée aujourd'hui
                </Text>

                <Text style={styles.productionMainDate}>
                  {getDateLabel(todayKey)}
                </Text>
              </View>

              <View style={styles.eggIcon}>
                <Ionicons
                  name="egg-outline"
                  size={25}
                  color={COLORS.primary}
                />
              </View>
            </View>

            <Text style={styles.productionMainValue}>
              {formatProduction(productionToday)}
            </Text>

            <Text style={styles.productionUnit}>
              alvéoles collectées
            </Text>

            <View style={styles.productionDivider} />

            <Text style={styles.productionFooterText}>
              {bandsReportingToday} bande(s) avec production renseignée
            </Text>
          </View>

          {/* COMPARAISON AVEC LA VEILLE */}

          <View style={styles.productionComparisonCard}>
            <View style={styles.comparisonHeader}>
              <Text style={styles.comparisonTitle}>
                Évolution par rapport à hier
              </Text>

              <Ionicons
                name="analytics-outline"
                size={21}
                color={COLORS.primary}
              />
            </View>

            {comparableBandsCount === 0 ? (
              <Text style={styles.comparisonUnavailable}>
                Comparaison indisponible : aucune bande n'a de production
                renseignée sur les deux journées.
              </Text>
            ) : (
              <>
                <View style={styles.comparisonValues}>
                  <View>
                    <Text style={styles.comparisonLabel}>Aujourd'hui</Text>

                    <Text style={styles.comparisonValue}>
                      {formatProduction(productionComparableToday)}
                    </Text>
                  </View>

                  <View>
                    <Text style={styles.comparisonLabel}>Hier</Text>

                    <Text style={styles.comparisonValue}>
                      {formatProduction(productionComparableYesterday)}
                    </Text>
                  </View>
                </View>

                <View style={styles.evolutionRow}>
                  <Ionicons
                    name={
                      productionDifference > 0
                        ? "trending-up"
                        : productionDifference < 0
                          ? "trending-down"
                          : "remove"
                    }
                    size={21}
                    color={
                      productionDifference > 0
                        ? COLORS.green
                        : productionDifference < 0
                          ? COLORS.red
                          : COLORS.secondary
                    }
                  />

                  <Text
                    style={[
                      styles.evolutionText,
                      {
                        color:
                          productionDifference > 0
                            ? COLORS.green
                            : productionDifference < 0
                              ? COLORS.red
                              : COLORS.secondary,
                      },
                    ]}
                  >
                    {productionDifference > 0 ? "+" : ""}
                    {formatProduction(productionDifference)} alvéole(s)
                    {productionPercentage !== null
                      ? ` (${productionPercentage > 0 ? "+" : ""}${productionPercentage.toFixed(1)} %) `
                      : ""}
                  </Text>
                </View>

                <Text style={styles.comparisonFootnote}>
                  Comparaison sur {comparableBandsCount} bande(s)
                  ayant des données les deux jours.
                </Text>
              </>
            )}
          </View>

          {/* PRODUCTION HEBDOMADAIRE */}

          <View style={styles.weeklyProductionCard}>
            <View style={styles.weeklyIcon}>
              <Ionicons
                name="calendar-outline"
                size={23}
                color={COLORS.green}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.weeklyLabel}>
                Production de la semaine
              </Text>

              <Text style={styles.weeklyValue}>
                {formatProduction(productionThisWeek)}
              </Text>

              <Text style={styles.weeklyDescription}>
                Depuis lundi · {daysWithProduction} jour(s) avec relevé
              </Text>
            </View>
          </View>

          {/* PRODUCTION PAR BANDE */}

          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>
              Production par bande
            </Text>

            <Text style={styles.sectionSubtitle}>
              Collecte enregistrée aujourd'hui.
            </Text>
          </View>

          <View style={styles.bandProductionCard}>
            {productionByBand.length === 0 ? (
              <Text style={styles.noProductionText}>
                Aucune bande active ne vous est affectée.
              </Text>
            ) : (
              productionByBand.map((item, index) => (
                <View
                  key={item.id}
                  style={[
                    styles.bandProductionRow,
                    index === productionByBand.length - 1 &&
                      styles.bandProductionRowLast,
                  ]}
                >
                  <View style={styles.bandProductionIcon}>
                    <Ionicons
                      name="layers-outline"
                      size={19}
                      color={COLORS.primary}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.bandProductionName}>
                      {item.nom}
                    </Text>

                    <Text style={styles.bandProductionStatus}>
                      {item.hasProduction
                        ? "Production renseignée"
                        : "Aucun relevé de production aujourd'hui"}
                    </Text>
                  </View>

                  <Text style={styles.bandProductionValue}>
                    {item.hasProduction
                      ? formatProduction(item.production)
                      : "—"}
                  </Text>
                </View>
              ))
            )}
          </View>

          {/* GRAPHIQUE 7 JOURS */}

          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>
              Évolution sur 7 jours
            </Text>

            <Text style={styles.sectionSubtitle}>
              Production quotidienne enregistrée.
            </Text>
          </View>

          <View style={styles.chartCard}>
            <View style={styles.chartBars}>
              {lastSevenDays.map((day) => {
                const barHeight = day.hasData
                  ? Math.max(
                      5,
                      (day.production / maxDailyProduction) * 125,
                    )
                  : 0;

                return (
                  <View key={day.dateKey} style={styles.chartColumn}>
                    <Text style={styles.chartValue}>
                      {day.hasData
                        ? formatProduction(day.production)
                        : "—"}
                    </Text>

                    <View style={styles.chartBarContainer}>
                      <View
                        style={[
                          styles.chartBar,
                          {
                            height: barHeight,
                            opacity: day.hasData ? 1 : 0.2,
                          },
                        ]}
                      />
                    </View>

                    <Text style={styles.chartDay}>{day.label}</Text>

                    <Text style={styles.chartDate}>
                      {day.dateKey.slice(8, 10)}
                    </Text>
                  </View>
                );
              })}
            </View>

            <Text style={styles.chartFootnote}>
              Les jours sans relevé sont indiqués par un tiret.
            </Text>
          </View>

          {/* RACCOURCIS */}

          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>
              Mon espace de travail
            </Text>

            <Text style={styles.sectionSubtitle}>
              Accédez rapidement à vos modules.
            </Text>
          </View>

          <View style={styles.modulesGrid}>
            {menuItems
              .filter((item) => item.title !== "Tableau de bord")
              .map((item) => (
                <TouchableOpacity
                  key={item.title}
                  style={styles.moduleCard}
                  onPress={() => navigateTo(item.title)}
                  activeOpacity={0.85}
                >
                  <View style={styles.moduleIcon}>
                    <Ionicons
                      name={item.icon}
                      size={23}
                      color={COLORS.primary}
                    />
                  </View>

                  <Text style={styles.moduleTitle}>
                    {item.title}
                  </Text>

                  <Text style={styles.moduleDescription}>
                    {item.description}
                  </Text>

                  <View style={styles.moduleArrow}>
                    <Ionicons
                      name="arrow-forward"
                      size={16}
                      color={COLORS.primary}
                    />
                  </View>
                </TouchableOpacity>
              ))}
          </View>

          {/* ACTIVITÉ RÉCENTE */}

          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Activité récente</Text>

            <Text style={styles.sectionSubtitle}>
              Vos cinq derniers relevés journaliers.
            </Text>
          </View>

          <View style={styles.activityCard}>
            {activiteRecente.length === 0 ? (
              <View style={styles.emptyActivity}>
                <Ionicons
                  name="document-text-outline"
                  size={30}
                  color={COLORS.secondary}
                />

                <Text style={styles.emptyActivityText}>
                  Aucun relevé enregistré pour le moment.
                </Text>
              </View>
            ) : (
              activiteRecente.map((record, index) => (
                <View
                  key={record.id}
                  style={[
                    styles.activityRow,
                    index === activiteRecente.length - 1 &&
                      styles.activityRowLast,
                  ]}
                >
                  <View style={styles.activityIcon}>
                    <Ionicons
                      name="clipboard-outline"
                      size={19}
                      color={COLORS.primary}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.activityBand}>
                      {getBandName(record)}
                    </Text>

                    <Text style={styles.activityDate}>
                      {formatDate(record.date_releve)}
                    </Text>

                    <Text style={styles.activityDetails}>
                      Mortalité : {record.mortalite_jour ?? 0}
                      {"  "}•{"  "}
                      Effectif : {record.effectif_restant ?? "—"}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={COLORS.secondary}
                  />
                </View>
              ))
            )}
          </View>

          {/* CONSEIL */}

          <View style={styles.infoCard}>
            <Ionicons
              name="information-circle-outline"
              size={22}
              color={COLORS.primary}
            />

            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Votre mission</Text>

              <Text style={styles.infoText}>
                Consultez vos bandes affectées et assurez régulièrement
                leur suivi journalier.
              </Text>
            </View>
          </View>
        </>
      )}

      <Text style={styles.footer}>
        Élevage+ · Gestion et suivi d'élevage
      </Text>
    </ScrollView>
  );

  const renderProfile = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.pageContent}
    >
      <View style={styles.profileCard}>
        <View style={styles.largeAvatar}>
          <Text style={styles.largeAvatarText}>{initials}</Text>
        </View>

        <Text style={styles.profileName}>
          {user?.nom || "Employé"}
        </Text>

        <Text style={styles.profileRole}>EMPLOYÉ</Text>
      </View>

      <View style={styles.detailsCard}>
        <Text style={styles.detailsTitle}>
          Informations personnelles
        </Text>

        <View style={styles.detailRow}>
          <Ionicons
            name="person-outline"
            size={20}
            color={COLORS.primary}
          />

          <View style={{ flex: 1 }}>
            <Text style={styles.detailLabel}>Nom complet</Text>

            <Text style={styles.detailValue}>
              {user?.nom || "Non renseigné"}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Ionicons
            name="mail-outline"
            size={20}
            color={COLORS.primary}
          />

          <View style={{ flex: 1 }}>
            <Text style={styles.detailLabel}>Adresse e-mail</Text>

            <Text style={styles.detailValue}>
              {user?.email || "Non renseignée"}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Ionicons
            name="shield-checkmark-outline"
            size={20}
            color={COLORS.primary}
          />

          <View style={{ flex: 1 }}>
            <Text style={styles.detailLabel}>Rôle</Text>

            <Text style={styles.detailValue}>EMPLOYEE</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  
  const renderContent = () => {
    switch (activeSection) {
      case "Tableau de bord":
        return renderHome();

      case "Mes bandes":
        return <BandesScreen role="EMPLOYEE" />;

      case "Suivi journalier":
        return <DailyTrackingScreen />;

      case "Historique":
        return <HistoryScreen />;

      case "Inventaire physique":
        return <InventoryScreen role="EMPLOYEE" />;

      case "Mon profil":
        return renderProfile();

      default:
        return renderHome();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {renderHeader()}

      <View style={styles.content}>
        {renderContent()}
      </View>

      <Modal
        visible={sidebarVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSidebarVisible(false)}
      >
        <View style={styles.drawerOverlay}>
          <TouchableOpacity
            style={styles.drawerBackdrop}
            activeOpacity={1}
            onPress={() => setSidebarVisible(false)}
          />

          {renderSidebar()}
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

  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  headerBrand: {
    fontSize: 19,
    fontWeight: "900",
    color: COLORS.text,
  },

  brandPlus: {
    color: COLORS.primary,
  },

  headerSubtitle: {
    fontSize: 9,
    color: COLORS.secondary,
    fontWeight: "800",
    letterSpacing: 1.3,
  },

  profileCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  profileInitials: {
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: 14,
  },

  content: {
    flex: 1,
  },

  homeContent: {
    padding: 20,
    paddingBottom: 35,
  },

  welcomeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 21,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 27,
  },

  greeting: {
    fontSize: 14,
    color: COLORS.secondary,
  },

  userName: {
    fontSize: 23,
    fontWeight: "900",
    color: COLORS.text,
    marginTop: 5,
  },

  welcomeText: {
    color: COLORS.secondary,
    fontSize: 12,
    marginTop: 7,
  },

  sectionHeading: {
    marginBottom: 15,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.text,
  },

  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 4,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 25,
  },

  statCard: {
    width: "48%",
    minHeight: 135,
    backgroundColor: COLORS.white,
    borderRadius: 17,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  statValue: {
    color: COLORS.text,
    fontSize: 23,
    fontWeight: "900",
  },

  statLabel: {
    color: COLORS.secondary,
    fontSize: 11,
    marginTop: 5,
  },

  productionMainCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 15,
  },

  productionMainHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  productionMainLabel: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: "700",
  },

  productionMainDate: {
    color: COLORS.secondary,
    fontSize: 10,
    marginTop: 5,
  },

  eggIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  productionMainValue: {
    color: COLORS.text,
    fontSize: 35,
    fontWeight: "900",
    marginTop: 15,
  },

  productionUnit: {
    color: COLORS.secondary,
    fontSize: 12,
    marginTop: 2,
  },

  productionDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 15,
  },

  productionFooterText: {
    color: COLORS.secondary,
    fontSize: 11,
  },

  productionComparisonCard: {
    backgroundColor: COLORS.white,
    borderRadius: 17,
    padding: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 15,
  },

  comparisonHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  comparisonTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "900",
  },

  comparisonUnavailable: {
    color: COLORS.secondary,
    fontSize: 11,
    lineHeight: 18,
    marginTop: 15,
  },

  comparisonValues: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },

  comparisonLabel: {
    color: COLORS.secondary,
    fontSize: 10,
  },

  comparisonValue: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 5,
  },

  evolutionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 18,
  },

  evolutionText: {
    fontSize: 12,
    fontWeight: "900",
    flexShrink: 1,
  },

  comparisonFootnote: {
    color: COLORS.secondary,
    fontSize: 10,
    marginTop: 10,
  },

  weeklyProductionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EDF3EC",
    borderRadius: 17,
    padding: 17,
    marginBottom: 27,
    gap: 13,
  },

  weeklyIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },

  weeklyLabel: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: "700",
  },

  weeklyValue: {
    color: COLORS.text,
    fontSize: 23,
    fontWeight: "900",
    marginTop: 4,
  },

  weeklyDescription: {
    color: COLORS.secondary,
    fontSize: 10,
    marginTop: 4,
  },

  bandProductionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 17,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 27,
  },

  bandProductionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 11,
  },

  bandProductionRowLast: {
    borderBottomWidth: 0,
  },

  bandProductionIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  bandProductionName: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "900",
  },

  bandProductionStatus: {
    color: COLORS.secondary,
    fontSize: 9,
    marginTop: 4,
  },

  bandProductionValue: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "900",
  },

  noProductionText: {
    color: COLORS.secondary,
    fontSize: 11,
    textAlign: "center",
    paddingVertical: 20,
  },

  chartCard: {
    backgroundColor: COLORS.white,
    borderRadius: 17,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 15,
  },

  chartBars: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    minHeight: 175,
  },

  chartColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },

  chartValue: {
    color: COLORS.secondary,
    fontSize: 8,
    marginBottom: 6,
  },

  chartBarContainer: {
    height: 130,
    justifyContent: "flex-end",
    alignItems: "center",
  },

  chartBar: {
    width: 17,
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },

  chartDay: {
    color: COLORS.text,
    fontSize: 9,
    fontWeight: "800",
    marginTop: 8,
  },

  chartDate: {
    color: COLORS.secondary,
    fontSize: 9,
    marginTop: 2,
  },

  chartFootnote: {
    color: COLORS.secondary,
    fontSize: 9,
    marginTop: 15,
    textAlign: "center",
  },

  modulesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  moduleCard: {
    width: "48%",
    backgroundColor: COLORS.white,
    borderRadius: 17,
    padding: 15,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 150,
  },

  moduleIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  moduleTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.text,
  },

  moduleDescription: {
    fontSize: 10,
    color: COLORS.secondary,
    marginTop: 5,
  },

  moduleArrow: {
    position: "absolute",
    right: 13,
    bottom: 13,
  },

  activityCard: {
    backgroundColor: COLORS.white,
    borderRadius: 17,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 15,
  },

  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 11,
  },

  activityRowLast: {
    borderBottomWidth: 0,
  },

  activityIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },

  activityBand: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "900",
  },

  activityDate: {
    color: COLORS.secondary,
    fontSize: 10,
    marginTop: 4,
  },

  activityDetails: {
    color: COLORS.secondary,
    fontSize: 10,
    marginTop: 5,
  },

  emptyActivity: {
    alignItems: "center",
    paddingVertical: 25,
    gap: 10,
  },

  emptyActivityText: {
    color: COLORS.secondary,
    fontSize: 11,
    textAlign: "center",
  },

  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    padding: 15,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 15,
    marginTop: 10,
  },

  infoTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
  },

  infoText: {
    fontSize: 11,
    color: COLORS.secondary,
    lineHeight: 17,
    marginTop: 4,
  },

  footer: {
    textAlign: "center",
    color: COLORS.secondary,
    fontSize: 10,
    marginTop: 28,
  },

  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 45,
  },

  loadingText: {
    color: COLORS.secondary,
    fontSize: 12,
    marginTop: 12,
  },

  errorCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 15,
    backgroundColor: "#FCEDEA",
    borderRadius: 14,
    marginBottom: 18,
  },

  errorText: {
    color: "#9B3F3D",
    fontSize: 12,
    lineHeight: 18,
  },

  retryText: {
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: 12,
    marginTop: 8,
  },

  drawerOverlay: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  drawerBackdrop: {
    ...StyleSheet.absoluteFill,
  },

  sidebar: {
    width: 285,
    maxWidth: "82%",
    backgroundColor: "#292524",
    paddingHorizontal: 19,
    paddingTop: 52,
    paddingBottom: 25,
  },

  sidebarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
  },

  sidebarBrand: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "900",
  },

  sidebarSubtitle: {
    color: "#C5B5AD",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.4,
    marginTop: 4,
  },

  sidebarProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#393330",
    marginBottom: 30,
  },

  sidebarAvatar: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  sidebarAvatarText: {
    color: COLORS.primary,
    fontWeight: "900",
  },

  sidebarName: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "800",
  },

  sidebarRole: {
    color: "#C5B5AD",
    fontSize: 10,
    marginTop: 4,
  },

  menuLabel: {
    color: "#A99B94",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 13,
    marginLeft: 5,
  },

  sidebarItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 5,
    gap: 12,
  },

  sidebarItemActive: {
    backgroundColor: "#F9E8E3",
  },

  sidebarItemText: {
    flex: 1,
    color: "#E0D6D0",
    fontSize: 12,
    fontWeight: "600",
  },

  sidebarItemTextActive: {
    color: COLORS.primary,
    fontWeight: "900",
  },

  activeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },

  sidebarDivider: {
    height: 1,
    backgroundColor: "#514843",
    marginBottom: 15,
  },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },

  logoutText: {
    color: "#E9A08D",
    fontSize: 12,
    fontWeight: "800",
  },

  sidebarFooter: {
    color: "#A99B94",
    fontSize: 9,
    textAlign: "center",
    marginTop: 18,
  },

  pageContent: {
    padding: 20,
  },

  profileCard: {
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 25,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  largeAvatar: {
    width: 82,
    height: 82,
    borderRadius: 25,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  largeAvatarText: {
    color: COLORS.primary,
    fontSize: 27,
    fontWeight: "900",
  },

  profileName: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.text,
    marginTop: 14,
  },

  profileRole: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginTop: 6,
  },

  detailsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 18,
  },

  detailsTitle: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 15,
    marginBottom: 20,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    marginBottom: 20,
  },

  detailLabel: {
    color: COLORS.secondary,
    fontSize: 10,
  },

  detailValue: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },
});
