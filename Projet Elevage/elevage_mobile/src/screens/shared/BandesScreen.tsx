import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Bande, createBande, getBandes } from '../../services/bandeService';

const COLORS = {
  background: '#F7F4F1',
  white: '#FFFFFF',
  primary: '#C97965',
  primaryLight: '#F9E8E3',
  text: '#292524',
  secondary: '#89817D',
  border: '#EAE4DF',
  green: '#648B69',
  orange: '#D69A55',
  red: '#C65353',
};

type FormData = {
  nomExploitation: string;
  numeroPoulailler: string;
  race: string;
  dateDebut: string;
  effectifInitial: string;
};

const EMPTY_FORM: FormData = {
  nomExploitation: '',
  numeroPoulailler: '',
  race: '',
  dateDebut: new Date().toISOString().split('T')[0],
  effectifInitial: '',
};

export default function BandesScreen() {
  const [bandes, setBandes] = useState<Bande[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);

  const loadBandes = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await getBandes();
      setBandes(data);
    } catch (error: any) {
      Alert.alert(
        'Erreur',
        error?.response?.data?.message || 'Impossible de charger les bandes.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadBandes();
  }, [loadBandes]);

  const openCreateModal = () => {
    setForm(EMPTY_FORM);
    setModalVisible(true);
  };

  const saveBande = async () => {
    if (
      !form.nomExploitation.trim() ||
      !form.numeroPoulailler.trim() ||
      !form.race.trim() ||
      !form.dateDebut ||
      !form.effectifInitial
    ) {
      Alert.alert('Champs obligatoires', 'Tous les champs sont requis.');
      return;
    }

    const effectif = parseInt(form.effectifInitial, 10);
    if (isNaN(effectif) || effectif <= 0) {
      Alert.alert('Effectif invalide', 'L’effectif initial doit être un nombre positif.');
      return;
    }

    try {
      setSaving(true);
      await createBande({
        nomExploitation: form.nomExploitation.trim(),
        numeroPoulailler: form.numeroPoulailler.trim(),
        race: form.race.trim(),
        dateDebut: form.dateDebut,
        effectifInitial: effectif,
      });

      Alert.alert('Succès', 'La bande a été créée avec succès.');
      setModalVisible(false);
      setForm(EMPTY_FORM);
      await loadBandes();
    } catch (error: any) {
      Alert.alert(
        'Erreur',
        error?.response?.data?.message || 'Impossible de créer la bande.',
      );
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadBandes(true)}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* HEADER */}
        <View style={styles.heading}>
          <View>
            <Text style={styles.title}>Bandes de poulettes</Text>
            <Text style={styles.subtitle}>Suivi 0 → 18 semaines</Text>
          </View>

          <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
            <Ionicons name="add" size={21} color={COLORS.white} />
            <Text style={styles.addButtonText}>Nouvelle bande</Text>
          </TouchableOpacity>
        </View>

        {/* STATS RAPIDES */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{bandes.length}</Text>
            <Text style={styles.statLabel}>Total bandes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: COLORS.green }]}>
              {bandes.filter((b) => b.statut === 'en_cours').length}
            </Text>
            <Text style={styles.statLabel}>En cours</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: COLORS.orange }]}>
              {bandes.filter((b) => b.statut === 'terminee').length}
            </Text>
            <Text style={styles.statLabel}>Terminées</Text>
          </View>
        </View>

        {/* LISTE */}
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : bandes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="layers-outline" size={48} color={COLORS.secondary} />
            <Text style={styles.emptyTitle}>Aucune bande créée</Text>
            <Text style={styles.emptyText}>
              Créez votre première bande de poulettes pour commencer le suivi.
            </Text>
          </View>
        ) : (
          bandes.map((bande) => (
            <TouchableOpacity key={bande.id} style={styles.bandeCard} activeOpacity={0.85}>
              <View style={styles.bandeHeader}>
                <View style={styles.bandeIcon}>
                  <Ionicons name="home-outline" size={22} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bandeTitle}>
                    Poulailler {bande.numeroPoulailler}
                  </Text>
                  <Text style={styles.bandeSubtitle}>{bande.nomExploitation}</Text>
                </View>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor:
                        bande.statut === 'en_cours'
                          ? `${COLORS.green}20`
                          : `${COLORS.orange}20`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      {
                        color:
                          bande.statut === 'en_cours' ? COLORS.green : COLORS.orange,
                      },
                    ]}
                  >
                    {bande.statut === 'en_cours' ? 'En cours' : 'Terminée'}
                  </Text>
                </View>
              </View>

              <View style={styles.bandeInfo}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Race</Text>
                  <Text style={styles.infoValue}>{bande.race}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Date début</Text>
                  <Text style={styles.infoValue}>{formatDate(bande.dateDebut)}</Text>
                </View>
              </View>

              <View style={styles.totalsRow}>
                <View style={styles.totalBox}>
                  <Text style={styles.totalLabel}>Effectif initial</Text>
                  <Text style={styles.totalValue}>{bande.effectifInitial}</Text>
                </View>
                <View style={styles.totalBox}>
                  <Text style={styles.totalLabel}>Effectif actuel</Text>
                  <Text style={[styles.totalValue, { color: COLORS.primary }]}>
                    {bande.effectifActuel}
                  </Text>
                </View>
                <View style={styles.totalBox}>
                  <Text style={styles.totalLabel}>Mortalité</Text>
                  <Text style={[styles.totalValue, { color: COLORS.red }]}>
                    {bande.mortaliteCumuleePct.toFixed(1)}%
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        <Text style={styles.footer}>Elevage+ · Suivi des bandes</Text>
      </ScrollView>

      {/* MODAL CRÉATION */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouvelle bande</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={25} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Nom de l’exploitation</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex : Ferme Koudijs"
              placeholderTextColor={COLORS.secondary}
              value={form.nomExploitation}
              onChangeText={(v) => setForm({ ...form, nomExploitation: v })}
            />

            <Text style={styles.inputLabel}>Numéro de poulailler</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex : A12"
              placeholderTextColor={COLORS.secondary}
              value={form.numeroPoulailler}
              onChangeText={(v) => setForm({ ...form, numeroPoulailler: v })}
            />

            <Text style={styles.inputLabel}>Race</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex : Lohmann Brown"
              placeholderTextColor={COLORS.secondary}
              value={form.race}
              onChangeText={(v) => setForm({ ...form, race: v })}
            />

            <Text style={styles.inputLabel}>Date de début</Text>
            <TextInput
              style={styles.input}
              placeholder="AAAA-MM-JJ"
              placeholderTextColor={COLORS.secondary}
              value={form.dateDebut}
              onChangeText={(v) => setForm({ ...form, dateDebut: v })}
            />

            <Text style={styles.inputLabel}>Effectif initial</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex : 5000"
              placeholderTextColor={COLORS.secondary}
              keyboardType="numeric"
              value={form.effectifInitial}
              onChangeText={(v) => setForm({ ...form, effectifInitial: v })}
            />

            <TouchableOpacity
              style={[styles.saveButton, saving && { opacity: 0.7 }]}
              onPress={saveBande}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.saveButtonText}>Créer la bande</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  heading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 21, fontWeight: '900', color: COLORS.text },
  subtitle: { color: COLORS.secondary, fontSize: 12, marginTop: 4 },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  addButtonText: { color: COLORS.white, fontSize: 12, fontWeight: '800' },
  statsRow: { flexDirection: 'row', gap: 9, marginBottom: 18 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statNumber: { color: COLORS.text, fontSize: 22, fontWeight: '900' },
  statLabel: { color: COLORS.secondary, fontSize: 10, marginTop: 4 },
  bandeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 17,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bandeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  bandeIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bandeTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  bandeSubtitle: { fontSize: 12, color: COLORS.secondary, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  bandeInfo: { flexDirection: 'row', gap: 20, marginBottom: 14 },
  infoItem: {},
  infoLabel: { fontSize: 11, color: COLORS.secondary },
  infoValue: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginTop: 2 },
  totalsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    gap: 8,
  },
  totalBox: { flex: 1, alignItems: 'center' },
  totalLabel: { fontSize: 10, color: COLORS.secondary },
  totalValue: { fontSize: 15, fontWeight: '900', color: COLORS.text, marginTop: 3 },
  emptyState: {
    backgroundColor: COLORS.white,
    borderRadius: 17,
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginTop: 14 },
  emptyText: {
    fontSize: 12,
    color: COLORS.secondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  footer: {
    textAlign: 'center',
    color: COLORS.secondary,
    fontSize: 10,
    marginVertical: 28,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30,24,21,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: { backgroundColor: COLORS.white, borderRadius: 22, padding: 20 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: COLORS.text },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    height: 46,
    paddingHorizontal: 13,
    color: COLORS.text,
    marginBottom: 14,
    fontSize: 13,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 13,
    padding: 15,
    alignItems: 'center',
    marginTop: 6,
  },
  saveButtonText: { color: COLORS.white, fontSize: 14, fontWeight: '800' },
});