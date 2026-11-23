import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ImageBackground,
} from "react-native";

import { StatusBar } from "expo-status-bar";
import axios from "axios";

import { login, logout, type User } from "./src/services/authService";
import EmployeeDashboard from "./src/dashboards/EmployeeDashboard";
import AdminDashboard from "./src/dashboards/AdminDashboard";

const COLORS = {
  background: "#F7F4F1",
  white: "#FFFFFF",
  primary: "#C97965",
  primaryLight: "#F9E8E3",
  text: "#292524",
  secondary: "#89817D",
  border: "#EAE4DF",
};

export default function App() {
  // États de connexion
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Utilisateur connecté
  const [user, setUser] = useState<User | null>(null);

  // Connexion à NestJS
  const handleSubmit = async () => {
    setErrorMessage("");

    if (!email.trim() || !password) {
      setErrorMessage("Veuillez renseigner votre email et votre mot de passe.");
      return;
    }

    try {
      setLoading(true);

      const result = await login(email.trim(), password);

      setUser(result.user);
      setPassword("");
      setErrorMessage("");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          const message = error.response.data?.message;

          setErrorMessage(
            Array.isArray(message)
              ? message.join("\n")
              : message || "Email ou mot de passe incorrect.",
          );
        } else {
          setErrorMessage(
            "Impossible de joindre le serveur. Vérifiez que le backend est démarré et que votre téléphone utilise le même réseau Wi-Fi.",
          );
        }
      } else {
        setErrorMessage("Une erreur inattendue est survenue.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Déconnexion
  const handleLogout = async () => {
    try {
      await logout();

      setUser(null);
      setEmail("");
      setPassword("");
      setShowPassword(false);
      setErrorMessage("");
    } catch {
      Alert.alert("Erreur", "Impossible de terminer la déconnexion.");
    }
  };
  // Redirection selon le rôle
  if (user !== null) {
    if (user.role === "ADMIN") {
      return <AdminDashboard user={user} onLogout={handleLogout} />;
    }

    if (user.role === "EMPLOYEE") {
      return <EmployeeDashboard user={user} onLogout={handleLogout} />;
    }
  }

  // Écran de connexion
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <ImageBackground
          source={require("./assets/hen-farm.png")}
          style={styles.hero}
          imageStyle={styles.heroImage}
          resizeMode="cover"
          blurRadius={2}
        >
          <View style={styles.heroOverlay} />

          <View style={styles.heroContent}>
            <Text style={styles.brand}>
              Elevage<Text style={styles.brandAccent}>+</Text>
            </Text>

            <Text style={styles.heroTitle}>Bienvenue !</Text>

            <Text style={styles.heroSubtitle}>
              GÉREZ VOTRE ÉLEVAGE EN TEMPS RÉEL
            </Text>
          </View>
        </ImageBackground>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Connectez-vous</Text>

          <Text style={styles.formSubtitle}>
            Accédez à votre espace de gestion.
          </Text>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Adresse email</Text>

            <TextInput
              style={styles.input}
              placeholder="exemple@email.com"
              placeholderTextColor="#AAA19B"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          {/* Mot de passe */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mot de passe</Text>

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Votre mot de passe"
                placeholderTextColor="#AAA19B"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />

              <TouchableOpacity
                onPress={() => setShowPassword((current) => !current)}
                disabled={loading}
              >
                <Text style={styles.showPassword}>
                  {showPassword ? "Masquer" : "Afficher"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Message d'erreur */}
          {!!errorMessage && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Bouton de connexion */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.submitText}>Se connecter</Text>

                <Text style={styles.submitArrow}>→</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.socialText}>
            Utilisez les identifiants fournis par votre administrateur.
          </Text>
        </View>

        <Text style={styles.footer}>© 2026 Elevage Mobile</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 25,
  },

  // En-tête
  hero: {
    height: 310,
    justifyContent: "flex-start",
    backgroundColor: COLORS.primary,
  },

  heroImage: {
    opacity: 1,
  },

  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(55, 30, 22, 0.42)",
  },

  heroContent: {
    paddingTop: 75,
    paddingHorizontal: 25,
    alignItems: "center",
  },

  brand: {
    fontSize: 25,
    fontWeight: "800",
    color: COLORS.white,
  },

  brandAccent: {
    color: "#F5C5A8",
  },

  heroTitle: {
    fontSize: 29,
    fontWeight: "800",
    color: COLORS.white,
    marginTop: 27,
  },

  heroSubtitle: {
    fontSize: 10,
    color: COLORS.white,
    letterSpacing: 2,
    marginTop: 10,
    fontWeight: "600",
  },

  // Formulaire
  formCard: {
    backgroundColor: COLORS.white,
    marginTop: -38,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 28,
    minHeight: 490,
  },

  formTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
  },

  formSubtitle: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 7,
    marginBottom: 23,
  },

  // Champs
  inputGroup: {
    marginBottom: 18,
  },

  label: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: "700",
    marginBottom: 9,
  },

  input: {
    height: 53,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 13,
    paddingHorizontal: 15,
    color: COLORS.text,
    fontSize: 13,
    backgroundColor: "#FEFDFC",
  },

  passwordContainer: {
    height: 53,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
  },

  passwordInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
  },

  showPassword: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "700",
  },

  // Erreurs
  errorBox: {
    backgroundColor: "#FCE8E6",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },

  errorText: {
    color: "#A33A32",
    fontSize: 12,
    lineHeight: 18,
  },

  // Bouton
  submitButton: {
    height: 54,
    backgroundColor: COLORS.primary,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    elevation: 3,
  },

  submitButtonDisabled: {
    opacity: 0.65,
  },

  submitText: {
    color: COLORS.white,
    fontWeight: "800",
    fontSize: 14,
  },

  submitArrow: {
    color: COLORS.white,
    fontSize: 20,
    marginLeft: 12,
  },

  socialText: {
    color: COLORS.secondary,
    textAlign: "center",
    fontSize: 11,
    marginTop: 22,
  },

  footer: {
    textAlign: "center",
    color: COLORS.secondary,
    fontSize: 10,
    marginTop: 20,
  },
});
