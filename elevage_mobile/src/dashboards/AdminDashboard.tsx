import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import EmployeesScreen from "../screens/admin/EmployeesScreen";
import BandesScreen from "../screens/shared/BandesScreen";

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

const menuItems: MenuItem[] = [
  { title: "Tableau de bord", icon: "grid-outline" },
  { title: "Effectifs", icon: "people-outline" },
  { title: "Production", icon: "egg-outline" },
  { title: "Alimentation", icon: "leaf-outline" },
  { title: "Stock", icon: "cube-outline" },
  { title: "Inventaire", icon: "clipboard-outline" },
  { title: "Gestion des employés", icon: "people-circle-outline" },
  { title: "Rapports", icon: "bar-chart-outline" },
  { title: "Bandes de poulettes", icon: "layers-outline" },
];

export default function AdminDashboard({ user, onLogout }: Props) {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [activeSection, setActiveSection] = useState("Tableau de bord");

  const stats = [
    {
      title: "Effectifs",
      value: "1 250",
      detail: "Total des sujets",
      icon: "people-outline" as const,
      color: COLORS.primary,
    },
    {
      title: "Production",
      value: "850",
      detail: "Œufs aujourd’hui",
      icon: "nutrition-outline" as const,
      color: COLORS.orange,
    },
    {
      title: "Stock",
      value: "320 kg",
      detail: "Aliments disponibles",
      icon: "cube-outline" as const,
      color: COLORS.green,
    },
    {
      title: "Alertes",
      value: "03",
      detail: "À vérifier",
      icon: "alert-circle-outline" as const,
      color: COLORS.primary,
    },
  ];

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
        <Text style={styles.today}>Aujourd'hui</Text>
      </View>

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

      <ScrollView showsVerticalScrollIndicator={false}>
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
        ) : activeSection === "Bandes de poulettes" ? (
          <BandesScreen />
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
