import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  FarmSettings,
  UpdateSettingsData,
  getSettings,
  updateSettings,
  uploadLogo,
} from "../../services/settingsService";

import * as ImagePicker from "expo-image-picker";

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
  red: "#C65353",
};

// Adresse du serveur NestJS
const API_HOST = "http://192.168.1.102:3000";

interface SettingsForm {
  nom_exploitation: string;
  logo: string;
  adresse: string;
  telephone: string;
  email: string;
  responsable: string;
  latitude: string;
  longitude: string;
}

const initialForm: SettingsForm = {
  nom_exploitation: "",
  logo: "",
  adresse: "",
  telephone: "",
  email: "",
  responsable: "",
  latitude: "",
  longitude: "",
};

export default function SettingsScreen() {
  const [settings, setSettings] = useState<FarmSettings | null>(null);
  const [form, setForm] = useState<SettingsForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const loadSettings = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await getSettings();

      setSettings(data);

      if (data) {
        setForm({
          nom_exploitation: data.nom_exploitation || "",
          logo: data.logo || "",
          adresse: data.adresse || "",
          telephone: data.telephone || "",
          email: data.email || "",
          responsable: data.responsable || "",
          latitude: data.latitude != null ? String(data.latitude) : "",
          longitude: data.longitude != null ? String(data.longitude) : "",
        });
      }
    } catch (error: any) {
      Alert.alert(
        "Erreur",
        error?.response?.data?.message ||
          "Impossible de charger les paramètres de l’exploitation.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateField = (field: keyof SettingsForm, value: string) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!settings) {
      Alert.alert(
        "Paramètres indisponibles",
        "Aucun enregistrement de paramètres n’a été trouvé.",
      );
      return;
    }

    if (!form.nom_exploitation.trim()) {
      Alert.alert(
        "Champ obligatoire",
        "Le nom de l’exploitation est obligatoire.",
      );
      return;
    }

    const latitude = form.latitude.trim() === "" ? null : Number(form.latitude);

    const longitude =
      form.longitude.trim() === "" ? null : Number(form.longitude);

    if (
      (latitude !== null && !Number.isFinite(latitude)) ||
      (longitude !== null && !Number.isFinite(longitude))
    ) {
      Alert.alert(
        "Coordonnées invalides",
        "Vérifie les valeurs de latitude et de longitude.",
      );
      return;
    }

    if (
      (latitude !== null && (latitude < -90 || latitude > 90)) ||
      (longitude !== null && (longitude < -180 || longitude > 180))
    ) {
      Alert.alert(
        "Coordonnées invalides",
        "La latitude doit être comprise entre -90 et 90 et la longitude entre -180 et 180.",
      );
      return;
    }

    try {
      setSaving(true);

      const payload: UpdateSettingsData = {
        nom_exploitation: form.nom_exploitation.trim(),
        logo: form.logo.trim() || null,
        adresse: form.adresse.trim() || null,
        telephone: form.telephone.trim() || null,
        email: form.email.trim() || null,
        responsable: form.responsable.trim() || null,
        latitude,
        longitude,
      };

      const updated = await updateSettings(settings.id, payload);

      setSettings(updated);

      setForm({
        nom_exploitation: updated.nom_exploitation || "",
        logo: updated.logo || "",
        adresse: updated.adresse || "",
        telephone: updated.telephone || "",
        email: updated.email || "",
        responsable: updated.responsable || "",
        latitude: updated.latitude != null ? String(updated.latitude) : "",
        longitude: updated.longitude != null ? String(updated.longitude) : "",
      });

      Alert.alert("Succès", "Les paramètres ont été enregistrés.");
    } catch (error: any) {
      const message = error?.response?.data?.message;

      Alert.alert(
        "Erreur",
        Array.isArray(message)
          ? message.join("\n")
          : message || "Impossible d’enregistrer les paramètres.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChooseLogo = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission refusée",
          "Autorisez l'accès à la galerie pour choisir un logo.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      if (!settings?.id) {
        Alert.alert(
          "Erreur",
          "Les paramètres de l'exploitation sont introuvables.",
        );
        return;
      }

      const asset = result.assets[0];

      setUploadingLogo(true);

      const updated = await uploadLogo(settings.id, {
        uri: asset.uri,
        name: asset.fileName || `logo-${Date.now()}.jpg`,
        type: asset.mimeType || "image/jpeg",
      });

      setSettings(updated);

      setForm((previous) => ({
        ...previous,
        logo: updated.logo || "",
      }));

      Alert.alert("Succès", "Le logo a été mis à jour.");
    } catch (error: any) {
      console.log("UPLOAD LOGO ERROR:", error.response?.data || error.message);

      const message = error?.response?.data?.message;

      Alert.alert(
        "Erreur",
        Array.isArray(message)
          ? message.join("\n")
          : message || "Impossible d'envoyer le logo.",
      );
    } finally {
      setUploadingLogo(false);
    }
  };

  const renderField = (
    label: string,
    field: keyof SettingsForm,
    placeholder: string,
    options?: {
      multiline?: boolean;
      keyboardType?:
        | "default"
        | "email-address"
        | "phone-pad"
        | "numeric"
        | "decimal-pad";
      required?: boolean;
      autoCapitalize?: "none" | "sentences" | "words" | "characters";
    },
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>
        {label}
        {options?.required ? " *" : ""}
      </Text>

      <TextInput
        style={[styles.input, options?.multiline && styles.multilineInput]}
        value={form[field]}
        onChangeText={(value) => updateField(field, value)}
        placeholder={placeholder}
        placeholderTextColor={COLORS.secondary}
        multiline={options?.multiline}
        keyboardType={options?.keyboardType || "default"}
        autoCapitalize={options?.autoCapitalize || "sentences"}
        textAlignVertical={options?.multiline ? "top" : "center"}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement des paramètres...</Text>
      </View>
    );
  }

  // Construction de l'adresse complète du logo
  const logoUri = settings?.logo
    ? settings.logo.startsWith("http")
      ? settings.logo
      : `${API_HOST}${settings.logo.startsWith("/") ? "" : "/"}${settings.logo}`
    : null;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadSettings(true)}
            tintColor={COLORS.primary}
          />
        }
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heading}>
          <View style={styles.headingIcon}>
            <Ionicons
              name="settings-outline"
              size={25}
              color={COLORS.primary}
            />
          </View>

          <View style={styles.headingInfo}>
            <Text style={styles.title}>Paramètres</Text>
            <Text style={styles.subtitle}>
              Configurez les informations générales de votre exploitation.
            </Text>
          </View>
        </View>

        {!settings ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="alert-circle-outline"
              size={42}
              color={COLORS.orange}
            />

            <Text style={styles.emptyTitle}>Aucun paramètre enregistré</Text>

            <Text style={styles.emptyText}>
              Aucun enregistrement n’a été trouvé sur le serveur. Vérifiez les
              données de l’exploitation.
            </Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => loadSettings()}
            >
              <Ionicons name="refresh-outline" size={18} color={COLORS.white} />
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.infoBanner}>
              <Ionicons
                name="information-circle-outline"
                size={21}
                color={COLORS.primary}
              />

              <Text style={styles.infoBannerText}>
                Ces informations représentent l’identité générale de votre
                exploitation.
              </Text>
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Ionicons
                    name="business-outline"
                    size={20}
                    color={COLORS.primary}
                  />
                </View>

                <View style={styles.sectionHeaderInfo}>
                  <Text style={styles.sectionTitle}>
                    Informations générales
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    Identité de l’exploitation
                  </Text>
                </View>
              </View>

              {renderField(
                "Nom de l’exploitation",
                "nom_exploitation",
                "Ex. : Ferme Élevage+ Cameroun",
                { required: true },
              )}

              {/* APERÇU DU LOGO */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Logo de l’exploitation</Text>

                <View style={styles.logoContainer}>
                  {logoUri ? (
                    <Image
                      source={{ uri: logoUri }}
                      style={styles.logoImage}
                      resizeMode="contain"
                      onError={() => {
                        console.log("Impossible de charger le logo :", logoUri);
                      }}
                    />
                  ) : (
                    <>
                      <Ionicons
                        name="image-outline"
                        size={35}
                        color={COLORS.secondary}
                      />
                      <Text style={styles.logoPlaceholder}>
                        Aucun logo enregistré
                      </Text>
                    </>
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.logoButton,
                    uploadingLogo && styles.disabledButton,
                  ]}
                  onPress={handleChooseLogo}
                  disabled={uploadingLogo}
                >
                  {uploadingLogo ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <>
                      <Ionicons
                        name="image-outline"
                        size={18}
                        color={COLORS.white}
                      />

                      <Text style={styles.logoButtonText}>
                        {settings.logo ? "Changer le logo" : "Choisir un logo"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {renderField("Adresse", "adresse", "Ville, quartier, pays", {
                multiline: true,
              })}
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Ionicons
                    name="call-outline"
                    size={20}
                    color={COLORS.primary}
                  />
                </View>

                <View style={styles.sectionHeaderInfo}>
                  <Text style={styles.sectionTitle}>
                    Coordonnées de contact
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    Moyens de contacter l’exploitation
                  </Text>
                </View>
              </View>

              {renderField("Téléphone", "telephone", "+237 6XX XXX XXX", {
                keyboardType: "phone-pad",
              })}

              {renderField(
                "Adresse e-mail",
                "email",
                "contact@exploitation.cm",
                {
                  keyboardType: "email-address",
                  autoCapitalize: "none",
                },
              )}

              {renderField(
                "Responsable de l’exploitation",
                "responsable",
                "Nom du responsable",
              )}
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Ionicons
                    name="location-outline"
                    size={20}
                    color={COLORS.primary}
                  />
                </View>

                <View style={styles.sectionHeaderInfo}>
                  <Text style={styles.sectionTitle}>
                    Localisation géographique
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    Coordonnées GPS de l’exploitation
                  </Text>
                </View>
              </View>

              {renderField("Latitude", "latitude", "Ex. : 3.8480000", {
                keyboardType: "decimal-pad",
              })}

              {renderField("Longitude", "longitude", "Ex. : 11.5021000", {
                keyboardType: "decimal-pad",
              })}
            </View>

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.disabledButton]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons
                    name="save-outline"
                    size={19}
                    color={COLORS.white}
                  />
                  <Text style={styles.saveButtonText}>
                    Enregistrer les paramètres
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.requiredNote}>* Champs obligatoires</Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },

  loadingText: {
    color: COLORS.secondary,
    fontSize: 13,
    marginTop: 12,
  },

  heading: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 18,
  },

  headingIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  headingInfo: {
    flex: 1,
  },

  title: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
  },

  subtitle: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 4,
    lineHeight: 18,
  },

  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    marginHorizontal: 16,
    marginBottom: 15,
    padding: 13,
    borderRadius: 11,
  },

  infoBannerText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 18,
    marginLeft: 9,
  },

  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  sectionIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  sectionHeaderInfo: {
    flex: 1,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
  },

  sectionSubtitle: {
    color: COLORS.secondary,
    fontSize: 11,
    marginTop: 3,
  },

  fieldContainer: {
    marginTop: 13,
  },

  label: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 7,
  },

  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 13,
    color: COLORS.text,
    backgroundColor: COLORS.white,
    minHeight: 45,
  },

  multilineInput: {
    minHeight: 75,
  },

  logoContainer: {
    minHeight: 130,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: "#FAF8F6",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },

  logoImage: {
    width: 180,
    height: 100,
  },

  logoPlaceholder: {
    color: COLORS.secondary,
    fontSize: 12,
    marginTop: 8,
  },

  logoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    padding: 13,
    borderRadius: 10,
    marginTop: 10,
    gap: 8,
  },

  logoButtonText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 12,
  },

  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 11,
    marginHorizontal: 16,
    marginTop: 5,
    marginBottom: 10,
    gap: 9,
  },

  disabledButton: {
    opacity: 0.6,
  },

  saveButtonText: {
    color: COLORS.white,
    fontWeight: "800",
    fontSize: 13,
  },

  requiredNote: {
    color: COLORS.secondary,
    fontSize: 11,
    marginHorizontal: 18,
    marginBottom: 25,
  },

  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 25,
    margin: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: 12,
  },

  emptyText: {
    fontSize: 12,
    color: COLORS.secondary,
    textAlign: "center",
    lineHeight: 19,
    marginTop: 8,
  },

  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 9,
    marginTop: 18,
    gap: 7,
  },

  retryButtonText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 12,
  },
});
