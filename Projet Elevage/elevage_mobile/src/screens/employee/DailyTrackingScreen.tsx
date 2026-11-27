import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Bande, getBandes } from "../../services/bandeService";
import {
  BandRecord,
  CreateBandRecordData,
  createBandRecord,
  getBandRecords,
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
  red: "#C65353",
};

type FormValues = {
  date_releve: string;
  mortalite_jour: string;
  alveoles_collectees: string;
  code_aliment: string;
  quantite_aliment_kg: string;
  nombre_sacs: string;
  nombre_repas: string;
  eau_litres: string;
  vaccination: string;
  traitement: string;
  observations_sante: string;
  observations: string;
};

const today = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const initialValues = (): FormValues => ({
  date_releve: today(),
  mortalite_jour: "0",
  alveoles_collectees: "",
  code_aliment: "",
  quantite_aliment_kg: "",
  nombre_sacs: "",
  nombre_repas: "",
  eau_litres: "",
  vaccination: "",
  traitement: "",
  observations_sante: "",
  observations: "",
});

type FieldProps = {
  label: string;
  value: string;
  onChangeText?: (value: string) => void;
  placeholder?: string;
  numeric?: boolean;
  multiline?: boolean;
  editable?: boolean;
};

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  numeric = false,
  multiline = false,
  editable = true,
}: FieldProps) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>

      <TextInput
        style={[
          styles.input,
          multiline && styles.multilineInput,
          !editable && { backgroundColor: "#F0F0F0", color: "#666" },
        ]}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        placeholder={placeholder || "Saisir une valeur"}
        placeholderTextColor="#AAA19B"
        keyboardType={numeric ? "decimal-pad" : "default"}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
}

export default function DailyTrackingScreen() {
  const [bands, setBands] = useState<Bande[]>([]);
  const [selectedBand, setSelectedBand] = useState<Bande | null>(null);
  const [form, setForm] = useState<FormValues>(initialValues);

  const [loadingBands, setLoadingBands] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bandModalVisible, setBandModalVisible] = useState(false);

  const [previousProduction, setPreviousProduction] = useState<number | null>(
    null,
  );
  const [loadingPreviousProduction, setLoadingPreviousProduction] =
    useState(false);

  const loadBands = async () => {
    try {
      setLoadingBands(true);

      const result = await getBandes();

      setBands(result.filter((band) => band.status === "GROWING"));
    } catch (error: any) {
      Alert.alert(
        "Erreur",
        error?.response?.data?.message || "Impossible de charger vos bandes.",
      );
    } finally {
      setLoadingBands(false);
    }
  };

  useEffect(() => {
    loadBands();
  }, []);

  const updateField = (field: keyof FormValues, value: string) => {
    setForm((previous) => {
      if (field === "nombre_sacs") {
        const nombreSacs =
          value.trim() === "" ? 0 : Number(value.trim().replace(",", "."));

        const quantiteKg = Number.isFinite(nombreSacs) ? nombreSacs * 50 : 0;

        return {
          ...previous,
          nombre_sacs: value,
          quantite_aliment_kg: value.trim() === "" ? "" : String(quantiteKg),
        };
      }

      return {
        ...previous,
        [field]: value,
      };
    });
  };

  const optionalNumber = (value: string): number | undefined => {
    if (value.trim() === "") return undefined;

    const parsed = Number(value.trim().replace(",", "."));

    return Number.isFinite(parsed) ? parsed : undefined;
  };

  // Récupération de la production de la veille pour la bande sélectionnée.
  useEffect(() => {
    if (!selectedBand || !/^\d{4}-\d{2}-\d{2}$/.test(form.date_releve)) {
      setPreviousProduction(null);
      setLoadingPreviousProduction(false);
      return;
    }

    const [year, month, day] = form.date_releve.split("-").map(Number);
    const selectedDate = new Date(year, month - 1, day);

    if (
      selectedDate.getFullYear() !== year ||
      selectedDate.getMonth() !== month - 1 ||
      selectedDate.getDate() !== day
    ) {
      setPreviousProduction(null);
      setLoadingPreviousProduction(false);
      return;
    }

    const previousDate = new Date(year, month - 1, day - 1);

    const previousDateString = [
      previousDate.getFullYear(),
      String(previousDate.getMonth() + 1).padStart(2, "0"),
      String(previousDate.getDate()).padStart(2, "0"),
    ].join("-");

    let active = true;

    const loadPreviousProduction = async () => {
      try {
        setLoadingPreviousProduction(true);
        setPreviousProduction(null);

        const records = await getBandRecords();

        if (!active) return;

        const previousRecord = records.find((record: BandRecord) => {
          const recordBandId = Number(record.bandId ?? record.band?.id);

          return (
            recordBandId === selectedBand.id &&
            record.date_releve.slice(0, 10) === previousDateString &&
            record.alveoles_collectees !== null &&
            record.alveoles_collectees !== undefined
          );
        });

        setPreviousProduction(
          previousRecord ? Number(previousRecord.alveoles_collectees) : null,
        );
      } catch {
        if (active) {
          setPreviousProduction(null);
        }
      } finally {
        if (active) {
          setLoadingPreviousProduction(false);
        }
      }
    };

    loadPreviousProduction();

    return () => {
      active = false;
    };
  }, [selectedBand, form.date_releve]);

  const validateForm = (): string | null => {
    if (!selectedBand) {
      return "Veuillez sélectionner une bande.";
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date_releve)) {
      return "La date doit respecter le format AAAA-MM-JJ.";
    }

    const [year, month, day] = form.date_releve.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return "La date saisie n'est pas valide.";
    }

    if (form.date_releve > today()) {
      return "La date du relevé ne peut pas être dans le futur.";
    }

    if (form.date_releve < selectedBand.date_demarrage.slice(0, 10)) {
      return "La date du relevé ne peut pas précéder le démarrage de la bande.";
    }

    // La production d'œufs est obligatoire.
    if (form.alveoles_collectees.trim() === "") {
      return "Veuillez saisir le nombre d'alvéoles collectées.";
    }

    const productionValue = form.alveoles_collectees.trim().replace(",", ".");

    if (!/^\d+(\.\d{1,2})?$/.test(productionValue)) {
      return "Le nombre d'alvéoles doit être positif avec deux décimales maximum.";
    }

    const productionNumber = Number(productionValue);

    if (!Number.isFinite(productionNumber) || productionNumber < 0) {
      return "Le nombre d'alvéoles ne peut pas être négatif.";
    }

    const integerFields: [string, string][] = [
      ["Mortalité du jour", form.mortalite_jour],
      ["Nombre de repas", form.nombre_repas],
    ];

    for (const [label, value] of integerFields) {
      if (value.trim() === "") continue;

      const number = Number(value);

      if (!Number.isInteger(number) || number < 0) {
        return `${label} doit être un nombre entier positif ou nul.`;
      }
    }

    // Les quantités décimales sont autorisées, avec 2 décimales maximum.
    const decimalFields: [string, string][] = [
      ["Nombre de sacs", form.nombre_sacs],
      ["Quantité d'aliment", form.quantite_aliment_kg],
      ["Consommation d'eau", form.eau_litres],
    ];

    for (const [label, value] of decimalFields) {
      if (value.trim() === "") continue;

      const normalizedValue = value.trim().replace(",", ".");

      if (!/^\d+(\.\d{1,2})?$/.test(normalizedValue)) {
        return `${label} doit être un nombre positif avec deux décimales maximum.`;
      }

      const number = Number(normalizedValue);

      if (!Number.isFinite(number) || number < 0) {
        return `${label} doit être un nombre positif ou nul.`;
      }
    }

    const numericFields: [string, string][] = [
      ["Quantité d'aliment", form.quantite_aliment_kg],
      ["Consommation d'eau", form.eau_litres],
    ];

    for (const [label, value] of numericFields) {
      if (value.trim() === "") continue;

      const number = Number(value.replace(",", "."));

      if (!Number.isFinite(number) || number < 0) {
        return `${label} doit être un nombre positif ou nul.`;
      }
    }

    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();

    if (validationError) {
      Alert.alert("Vérification du formulaire", validationError);
      return;
    }

    if (!selectedBand) return;

    const data: CreateBandRecordData = {
      bandId: selectedBand.id,
      date_releve: form.date_releve,

      mortalite_jour: optionalNumber(form.mortalite_jour),

      alveoles_collectees: Number(
        form.alveoles_collectees.trim().replace(",", "."),
      ),

      code_aliment: form.code_aliment.trim() || undefined,
      quantite_aliment_kg: optionalNumber(form.quantite_aliment_kg),
      nombre_sacs: optionalNumber(form.nombre_sacs),
      nombre_repas: optionalNumber(form.nombre_repas),
      eau_litres: optionalNumber(form.eau_litres),

      vaccination: form.vaccination.trim() || undefined,
      traitement: form.traitement.trim() || undefined,
      observations_sante: form.observations_sante.trim() || undefined,
      observations: form.observations.trim() || undefined,
    };

    try {
      setSaving(true);

      await createBandRecord(data);

      Alert.alert(
        "Relevé enregistré",
        "Le suivi journalier et la production d'œufs ont été enregistrés avec succès.",
        [
          {
            text: "OK",
            onPress: () => {
              setForm(initialValues());
              setSelectedBand(null);
              setPreviousProduction(null);
            },
          },
        ],
      );
    } catch (error: any) {
      const message = error?.response?.data?.message;

      Alert.alert(
        "Enregistrement impossible",
        Array.isArray(message)
          ? message.join("\n")
          : message || "Une erreur est survenue lors de l'enregistrement.",
      );
    } finally {
      setSaving(false);
    }
  };

  const renderSectionTitle = (title: string) => (
    <View style={styles.sectionTitleContainer}>
      <View style={styles.sectionAccent} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  const currentProduction = optionalNumber(form.alveoles_collectees);

  const productionDifference =
    currentProduction !== undefined && previousProduction !== null
      ? currentProduction - previousProduction
      : null;

  const formatProduction = (value: number) =>
    value.toLocaleString("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

  if (loadingBands) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement de vos bandes...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Suivi journalier</Text>

          <Text style={styles.pageSubtitle}>
            Enregistrez les informations quotidiennes de votre bande.
          </Text>
        </View>

        {bands.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="layers-outline" size={42} color={COLORS.primary} />

            <Text style={styles.emptyTitle}>Aucune bande disponible</Text>

            <Text style={styles.emptyText}>
              Vous n'avez actuellement aucune bande en cours qui vous est
              affectée.
            </Text>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={loadBands}
            >
              <Text style={styles.secondaryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {renderSectionTitle("Informations générales")}

            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Bande concernée *</Text>

              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setBandModalVisible(true)}
              >
                <View style={styles.selectButtonText}>
                  <Text
                    style={[
                      styles.selectValue,
                      !selectedBand && styles.selectPlaceholder,
                    ]}
                  >
                    {selectedBand
                      ? `${selectedBand.nom} · ${selectedBand.numero_batiment}`
                      : "Sélectionner une bande"}
                  </Text>

                  {selectedBand && (
                    <Text style={styles.selectSubtext}>
                      Effectif initial : {selectedBand.effectif_initial}
                    </Text>
                  )}
                </View>

                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={COLORS.secondary}
                />
              </TouchableOpacity>

              <FormField
                label="Nombre de sacs utilisés"
                value={form.nombre_sacs}
                onChangeText={(value) => updateField("nombre_sacs", value)}
                numeric
                placeholder="Ex. 2,5"
              />
            </View>

            {renderSectionTitle("Effectif et mortalité")}

            <View style={styles.card}>
              <FormField
                label="Mortalité du jour *"
                value={form.mortalite_jour}
                onChangeText={(value) => updateField("mortalite_jour", value)}
                numeric
                placeholder="Ex. : 2"
              />

              <Text style={styles.productionHint}>
                Saisissez le nombre de sujets morts dans cette bande depuis le
                dernier relevé. Si aucun sujet n'est mort, laissez 0.
              </Text>

              <FormField
                label="Quantité d'aliment distribuée (kg)"
                value={form.quantite_aliment_kg}
                editable={false}
                numeric
                placeholder="Calcul automatique"
              />
            </View>

            {renderSectionTitle("Production d'œufs")}

            <View style={styles.card}>
              <FormField
                label="Nombre d'alvéoles collectées aujourd'hui *"
                value={form.alveoles_collectees}
                onChangeText={(value) =>
                  updateField("alveoles_collectees", value)
                }
                numeric
                placeholder="Ex. 12,5"
              />

              <Text style={styles.productionHint}>
                Saisissez le nombre d'alvéoles collectées. Les décimales sont
                acceptées.
              </Text>

              {loadingPreviousProduction ? (
                <View style={styles.previousLoading}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.productionHint}>
                    Chargement de la production précédente...
                  </Text>
                </View>
              ) : previousProduction !== null ? (
                <View style={styles.productionPrevious}>
                  <Text style={styles.productionPreviousText}>
                    Production de la veille :{" "}
                    {formatProduction(previousProduction)} alvéoles
                  </Text>

                  {productionDifference !== null && (
                    <Text
                      style={[
                        styles.productionDifference,
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
                      {formatProduction(productionDifference)} alvéoles
                      {" · "}
                      {productionDifference > 0
                        ? "Hausse"
                        : productionDifference < 0
                          ? "Baisse"
                          : "Stable"}
                    </Text>
                  )}
                </View>
              ) : (
                <Text style={styles.productionHint}>
                  Aucun relevé de production disponible pour la veille.
                </Text>
              )}
            </View>

            {renderSectionTitle("Alimentation et eau")}

            <View style={styles.card}>
              <FormField
                label="Code de l'aliment"
                value={form.code_aliment}
                onChangeText={(value) => updateField("code_aliment", value)}
              />

              <FormField
                label="Quantité d'aliment distribuée (kg)"
                value={form.quantite_aliment_kg}
                onChangeText={(value) =>
                  updateField("quantite_aliment_kg", value)
                }
                numeric
              />

              <FormField
                label="Nombre de sacs"
                value={form.nombre_sacs}
                onChangeText={(value) => updateField("nombre_sacs", value)}
                numeric
              />

              <FormField
                label="Nombre de repas"
                value={form.nombre_repas}
                onChangeText={(value) => updateField("nombre_repas", value)}
                numeric
              />

              <FormField
                label="Consommation d'eau (litres)"
                value={form.eau_litres}
                onChangeText={(value) => updateField("eau_litres", value)}
                numeric
              />
            </View>

            {renderSectionTitle("Santé et observations")}

            <View style={styles.card}>
              <FormField
                label="Vaccination"
                value={form.vaccination}
                onChangeText={(value) => updateField("vaccination", value)}
              />

              <FormField
                label="Traitement"
                value={form.traitement}
                onChangeText={(value) => updateField("traitement", value)}
              />

              <FormField
                label="Observations sur la santé"
                value={form.observations_sante}
                onChangeText={(value) =>
                  updateField("observations_sante", value)
                }
                multiline
              />

              <FormField
                label="Observations générales"
                value={form.observations}
                onChangeText={(value) => updateField("observations", value)}
                multiline
              />
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                saving && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={saving}
              activeOpacity={0.85}
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

                  <Text style={styles.submitButtonText}>
                    Enregistrer le relevé
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <Modal
        visible={bandModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBandModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choisir une bande</Text>

              <TouchableOpacity onPress={() => setBandModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={bands}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.bandOption}
                  onPress={() => {
                    setSelectedBand(item);
                    setBandModalVisible(false);
                  }}
                >
                  <View style={styles.bandOptionIcon}>
                    <Ionicons
                      name="layers-outline"
                      size={20}
                      color={COLORS.primary}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.bandOptionName}>{item.nom}</Text>

                    <Text style={styles.bandOptionDetails}>
                      Bâtiment {item.numero_batiment} · {item.race}
                    </Text>

                    <Text style={styles.bandOptionDetails}>
                      Effectif initial : {item.effectif_initial}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={COLORS.secondary}
                  />
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    color: COLORS.secondary,
    marginTop: 12,
    fontSize: 12,
  },
  pageHeader: {
    marginBottom: 22,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.text,
  },
  pageSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.secondary,
    marginTop: 6,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 11,
  },
  sectionAccent: {
    width: 4,
    height: 19,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginRight: 9,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 15,
  },
  fieldContainer: {
    marginTop: 13,
  },
  fieldLabel: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 7,
  },
  input: {
    minHeight: 47,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 11,
    paddingHorizontal: 12,
    color: COLORS.text,
    fontSize: 13,
    backgroundColor: "#FFFEFD",
  },
  multilineInput: {
    minHeight: 85,
    paddingTop: 12,
  },
  selectButton: {
    minHeight: 55,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 11,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFEFD",
  },
  selectButtonText: {
    flex: 1,
  },
  selectValue: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },
  selectPlaceholder: {
    color: "#AAA19B",
    fontWeight: "400",
  },
  selectSubtext: {
    color: COLORS.secondary,
    fontSize: 10,
    marginTop: 4,
  },
  productionHint: {
    color: COLORS.secondary,
    fontSize: 11,
    marginTop: 10,
    lineHeight: 17,
  },
  previousLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  productionPrevious: {
    backgroundColor: "#F7F4F1",
    padding: 12,
    borderRadius: 10,
    marginTop: 14,
  },
  productionPreviousText: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: "700",
  },
  productionDifference: {
    fontSize: 13,
    fontWeight: "900",
    marginTop: 8,
  },
  submitButton: {
    minHeight: 52,
    backgroundColor: COLORS.primary,
    borderRadius: 13,
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "900",
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 25,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 15,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 13,
  },
  emptyText: {
    color: COLORS.secondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 8,
  },
  secondaryButton: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 10,
    marginTop: 18,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "900",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalCard: {
    maxHeight: "75%",
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 19,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900",
  },
  bandOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  bandOptionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  bandOptionName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
  },
  bandOptionDetails: {
    color: COLORS.secondary,
    fontSize: 10,
    marginTop: 3,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
  },
});
