import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
};

interface Props {
  user?: {
    nom?: string;
    email?: string;
  };
  onLogout?: () => void;
}

type MenuItem = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
};

const menuItems: MenuItem[] = [
  {
    title: "Bandes de poulettes",
    icon: "layers-outline",
    description: "Suivi 0 → 18 semaines",
  },
  // Tu pourras ajouter d'autres modules ici plus tard
];

export default function EmployeeDashboard({ user, onLogout }: Props) {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const initials =
    user?.nom
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() || "EM";

  // ========== ÉCRAN PRINCIPAL ==========
  if (!activeSection) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* HEADER */}
          <View style={styles.header}>
            <View>
              <Text style={styles.brand}>
                Elevage<Text style={styles.brandPlus}>+</Text>
              </Text>
              <Text style={styles.headerSubtitle}>ESPACE EMPLOYÉ</Text>
            </View>

            <View style={styles.profileCircle}>
              <Text style={styles.profileInitials}>{initials}</Text>
            </View>
          </View>

          {/* WELCOME */}
          <View style={styles.welcomeCard}>
            <Text style={styles.greeting}>Bonjour 👋</Text>
            <Text style={styles.userName}>{user?.nom || "Employé"}</Text>
            <Text style={styles.welcomeText}>
              Voici vos modules de travail.
            </Text>
          </View>

          {/* MENU MODULES */}
          <Text style={styles.sectionTitle}>Modules disponibles</Text>

          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.title}
              style={styles.moduleCard}
              onPress={() => setActiveSection(item.title)}
              activeOpacity={0.85}
            >
              <View style={styles.moduleIcon}>
                <Ionicons name={item.icon} size={24} color={COLORS.primary} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.moduleTitle}>{item.title}</Text>
                <Text style={styles.moduleDescription}>{item.description}</Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={18}
                color={COLORS.secondary}
              />
            </TouchableOpacity>
          ))}

          {/* LOGOUT */}
          <TouchableOpacity style={styles.logout} onPress={onLogout}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.primary} />
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>

          <Text style={styles.footer}>Elevage+ · Espace employé</Text>
        </ScrollView>
      </View>
    );
  }

  // ========== ÉCRAN BANDE ==========
  if (activeSection === "Bandes de poulettes") {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />

        {/* Petit header de retour */}
        <View style={styles.subHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setActiveSection(null)}
          >
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
            <Text style={styles.backText}>Retour</Text>
          </TouchableOpacity>
        </View>

        <BandesScreen />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 10,
  },
  brand: {
    fontSize: 26,
    fontWeight: "900",
    color: COLORS.text,
  },
  brandPlus: {
    color: COLORS.primary,
  },
  headerSubtitle: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginTop: 2,
  },
  profileCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitials: {
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: 15,
  },
  welcomeCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 22,
    marginTop: 10,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  greeting: {
    fontSize: 15,
    color: COLORS.secondary,
  },
  userName: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.text,
    marginTop: 4,
  },
  welcomeText: {
    color: COLORS.secondary,
    fontSize: 13,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
    marginHorizontal: 22,
    marginTop: 28,
    marginBottom: 14,
  },
  moduleCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 22,
    marginBottom: 12,
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  moduleIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  moduleTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },
  moduleDescription: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 3,
  },
  logout: {
    marginHorizontal: 22,
    marginTop: 30,
    padding: 16,
    borderRadius: 15,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 9,
  },
  logoutText: {
    color: COLORS.primary,
    fontWeight: "800",
  },
  footer: {
    textAlign: "center",
    color: COLORS.secondary,
    fontSize: 11,
    marginVertical: 25,
  },
  subHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  backText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
});