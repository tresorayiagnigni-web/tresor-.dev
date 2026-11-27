
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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

import {
  Farm,
  CreateFarmData,
  getFarms,
  createFarm,
  updateFarm,
  deleteFarm,
} from '../../services/farmService';

interface FarmForm {
  nom: string;
  localisation: string;
  responsable: string;
  telephone: string;
}

const initialForm: FarmForm = {
  nom: '',
  localisation: '',
  responsable: '',
  telephone: '',
};

export default function FarmsScreen() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [form, setForm] = useState<FarmForm>(initialForm);

  const loadFarms = useCallback(async () => {
    try {
      const data = await getFarms();
      setFarms(data);
    } catch (error: any) {
      Alert.alert(
        'Erreur',
        error?.response?.data?.message || 'Impossible de charger les exploitations.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFarms();
  }, [loadFarms]);

  const openCreateModal = () => {
    setEditingFarm(null);
    setForm(initialForm);
    setModalVisible(true);
  };

  const openEditModal = (farm: Farm) => {
    setEditingFarm(farm);
    setForm({
      nom: farm.nom || '',
      localisation: farm.localisation || '',
      responsable: farm.responsable || '',
      telephone: farm.telephone || '',
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalVisible(false);
    setEditingFarm(null);
    setForm(initialForm);
  };

  const handleSave = async () => {
    if (!form.nom.trim()) {
      Alert.alert('Champ obligatoire', 'Le nom de l’exploitation est obligatoire.');
      return;
    }

    const payload: CreateFarmData = {
      nom: form.nom.trim(),
      localisation: form.localisation.trim(),
      responsable: form.responsable.trim(),
      telephone: form.telephone.trim(),
    };

    try {
      setSaving(true);

      if (editingFarm) {
        await updateFarm(editingFarm.id, payload);
        Alert.alert('Succès', 'L’exploitation a été modifiée.');
      } else {
        await createFarm(payload);
        Alert.alert('Succès', 'L’exploitation a été créée.');
      }

      setModalVisible(false);
      setEditingFarm(null);
      setForm(initialForm);
      await loadFarms();
    } catch (error: any) {
      const message = error?.response?.data?.message;
      Alert.alert(
        'Erreur',
        Array.isArray(message)
          ? message.join('\n')
          : message || 'Une erreur est survenue.',
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (farm: Farm) => {
    Alert.alert(
      'Désactiver l’exploitation',
      `Veux-tu vraiment désactiver « ${farm.nom} » ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Désactiver',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFarm(farm.id);
              Alert.alert('Succès', 'L’exploitation a été désactivée.');
              await loadFarms();
            } catch (error: any) {
              Alert.alert(
                'Erreur',
                error?.response?.data?.message ||
                  'Impossible de désactiver cette exploitation.',
              );
            }
          },
        },
      ],
    );
  };

  const isActive = (status: boolean | number) =>
    status === true || status === 1;

  const renderFarm = ({ item }: { item: Farm }) => {
    const active = isActive(item.status);

    return (
      <View style={styles.farmCard}>
        <View style={styles.cardHeader}>
          <View style={styles.farmIcon}>
            <Ionicons name="business-outline" size={24} color="#E5A000" />
          </View>

          <View style={styles.farmInfo}>
            <Text style={styles.farmName}>{item.nom}</Text>
            <Text style={styles.farmLocation}>
              {item.localisation || 'Localisation non renseignée'}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              active ? styles.activeBadge : styles.inactiveBadge,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                active ? styles.activeText : styles.inactiveText,
              ]}
            >
              {active ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        <View style={styles.separator} />

        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Ionicons name="person-outline" size={16} color="#8A94A6" />
            <Text style={styles.detailText}>
              {item.responsable || 'Responsable non renseigné'}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="call-outline" size={16} color="#8A94A6" />
            <Text style={styles.detailText}>
              {item.telephone || 'Téléphone non renseigné'}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => openEditModal(item)}
          >
            <Ionicons name="create-outline" size={17} color="#246BCE" />
            <Text style={styles.editButtonText}>Modifier</Text>
          </TouchableOpacity>

          {active && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => confirmDelete(item)}
            >
              <Ionicons name="ban-outline" size={17} color="#DC4545" />
              <Text style={styles.deleteButtonText}>Désactiver</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E5A000" />
        <Text style={styles.loadingText}>Chargement des exploitations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <View>
          <Text style={styles.title}>Exploitations</Text>
          <Text style={styles.subtitle}>
            Gérez les exploitations de votre élevage
          </Text>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
          <Ionicons name="add" size={22} color="#171717" />
          <Text style={styles.addButtonText}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.counterCard}>
        <View style={styles.counterIcon}>
          <Ionicons name="business" size={25} color="#E5A000" />
        </View>
        <View>
          <Text style={styles.counterValue}>
            {farms.filter((farm) => isActive(farm.status)).length}
          </Text>
          <Text style={styles.counterLabel}>Exploitations actives</Text>
        </View>
      </View>

      <FlatList
        data={farms}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderFarm}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadFarms();
            }}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="business-outline" size={48} color="#A0A8B5" />
            <Text style={styles.emptyTitle}>Aucune exploitation</Text>
            <Text style={styles.emptyText}>
              Ajoutez votre première exploitation pour pouvoir créer des bandes.
            </Text>
          </View>
        }
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingFarm ? 'Modifier l’exploitation' : 'Nouvelle exploitation'}
              </Text>

              <TouchableOpacity onPress={closeModal} disabled={saving}>
                <Ionicons name="close" size={25} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Nom de l’exploitation *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex : Ferme de Yaoundé"
                value={form.nom}
                onChangeText={(value) =>
                  setForm((previous) => ({ ...previous, nom: value }))
                }
              />

              <Text style={styles.label}>Localisation</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex : Yaoundé, Centre"
                value={form.localisation}
                onChangeText={(value) =>
                  setForm((previous) => ({ ...previous, localisation: value }))
                }
              />

              <Text style={styles.label}>Responsable</Text>
              <TextInput
                style={styles.input}
                placeholder="Nom du responsable"
                value={form.responsable}
                onChangeText={(value) =>
                  setForm((previous) => ({ ...previous, responsable: value }))
                }
              />

              <Text style={styles.label}>Téléphone</Text>
              <TextInput
                style={styles.input}
                placeholder="Numéro de téléphone"
                keyboardType="phone-pad"
                value={form.telephone}
                onChangeText={(value) =>
                  setForm((previous) => ({ ...previous, telephone: value }))
                }
              />

              <TouchableOpacity
                style={[styles.saveButton, saving && styles.disabledButton]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#171717" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingFarm ? 'Enregistrer les modifications' : 'Créer l’exploitation'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F6F8',
  },
  loadingText: {
    marginTop: 12,
    color: '#697386',
  },
  heading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 23,
    fontWeight: '800',
    color: '#202633',
  },
  subtitle: {
    fontSize: 12,
    color: '#8490A2',
    marginTop: 5,
  },
  addButton: {
    backgroundColor: '#E5A000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 10,
  },
  addButtonText: {
    color: '#171717',
    fontWeight: '700',
    marginLeft: 4,
  },
  counterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  counterIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFF5D9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  counterValue: {
    fontSize: 23,
    fontWeight: '800',
    color: '#202633',
  },
  counterLabel: {
    fontSize: 12,
    color: '#8490A2',
  },
  listContent: {
    paddingBottom: 30,
    flexGrow: 1,
  },
  farmCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EDF0F4',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  farmIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF5D9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  farmInfo: {
    flex: 1,
  },
  farmName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#202633',
  },
  farmLocation: {
    fontSize: 12,
    color: '#8490A2',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },
  activeBadge: {
    backgroundColor: '#E5F7EC',
  },
  inactiveBadge: {
    backgroundColor: '#FCEAEA',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  activeText: {
    color: '#22864A',
  },
  inactiveText: {
    color: '#C23B3B',
  },
  separator: {
    height: 1,
    backgroundColor: '#EDF0F4',
    marginVertical: 13,
  },
  details: {
    gap: 9,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    color: '#697386',
    fontSize: 12,
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 10,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF4FF',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#246BCE',
    fontWeight: '700',
    fontSize: 12,
    marginLeft: 5,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#DC4545',
    fontWeight: '700',
    fontSize: 12,
    marginLeft: 5,
  },
  empty: {
    flex: 1,
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
  },
  emptyTitle: {
    color: '#202633',
    fontWeight: '800',
    fontSize: 16,
    marginTop: 12,
  },
  emptyText: {
    color: '#8490A2',
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#202633',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3D4655',
    marginBottom: 7,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E1E5EB',
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 14,
    color: '#202633',
    backgroundColor: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#E5A000',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 23,
    marginBottom: 15,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#171717',
    fontWeight: '800',
    fontSize: 13,
  },
});
