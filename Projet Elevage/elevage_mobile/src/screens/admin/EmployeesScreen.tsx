
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

import {
  Employee,
  getEmployees,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus,
  deleteEmployee,
} from '../../services/employeeService';

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
  nom: string;
  email: string;
  password: string;
};

const EMPTY_FORM: FormData = {
  nom: '',
  email: '',
  password: '',
};

export default function EmployeesScreen() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);

  const loadEmployees = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await getEmployees();
      setEmployees(data);
    } catch (error: any) {
      Alert.alert(
        'Erreur',
        error?.response?.data?.message ||
          'Impossible de charger les employés. Vérifie la connexion au serveur.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const openCreateModal = () => {
    setEditingEmployee(null);
    setForm(EMPTY_FORM);
    setModalVisible(true);
  };

  const openEditModal = (employee: Employee) => {
    setEditingEmployee(employee);
    setForm({
      nom: employee.nom,
      email: employee.email,
      password: '',
    });
    setModalVisible(true);
  };

  const saveEmployee = async () => {
    if (!form.nom.trim() || !form.email.trim()) {
      Alert.alert('Champs obligatoires', 'Le nom et l’adresse email sont requis.');
      return;
    }

    if (!editingEmployee && form.password.length < 8) {
      Alert.alert('Mot de passe invalide', 'Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    try {
      setSaving(true);

      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, {
          nom: form.nom.trim(),
          email: form.email.trim(),
          ...(form.password ? { password: form.password } : {}),
        });
        Alert.alert('Succès', 'Les informations de l’employé ont été modifiées.');
      } else {
        await createEmployee({
          nom: form.nom.trim(),
          email: form.email.trim(),
          password: form.password,
        });
        Alert.alert('Succès', 'Le compte employé a été créé.');
      }

      setModalVisible(false);
      setForm(EMPTY_FORM);
      await loadEmployees();
    } catch (error: any) {
      Alert.alert(
        'Opération impossible',
        error?.response?.data?.message ||
          'Une erreur est survenue. Vérifie les informations et réessaie.',
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = (employee: Employee) => {
    Alert.alert(
      employee.status ? 'Désactiver le compte ?' : 'Activer le compte ?',
      `Voulez-vous ${employee.status ? 'désactiver' : 'activer'} le compte de ${employee.nom} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              await updateEmployeeStatus(employee.id, !employee.status);
              await loadEmployees();
            } catch (error: any) {
              Alert.alert(
                'Erreur',
                error?.response?.data?.message || 'Impossible de modifier le statut.',
              );
            }
          },
        },
      ],
    );
  };

  const confirmDelete = (employee: Employee) => {
    Alert.alert(
      'Supprimer cet employé ?',
      `Le compte de ${employee.nom} sera supprimé de la liste, mais son historique sera conservé.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEmployee(employee.id);
              await loadEmployees();
              Alert.alert('Succès', 'L’employé a été supprimé.');
            } catch (error: any) {
              Alert.alert(
                'Erreur',
                error?.response?.data?.message || 'Impossible de supprimer cet employé.',
              );
            }
          },
        },
      ],
    );
  };

  const filteredEmployees = employees.filter((employee) => {
    const value = search.trim().toLowerCase();
    return (
      employee.nom.toLowerCase().includes(value) ||
      employee.email.toLowerCase().includes(value)
    );
  });

  const activeCount = employees.filter((employee) => employee.status).length;
  const inactiveCount = employees.length - activeCount;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadEmployees(true)}
            tintColor={COLORS.primary}
          />
        }
      >
        <View style={styles.heading}>
          <View>
            <Text style={styles.title}>Gestion des employés</Text>
            <Text style={styles.subtitle}>
              Gérez les comptes de votre équipe.
            </Text>
          </View>

          <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
            <Ionicons name="add" size={21} color={COLORS.white} />
            <Text style={styles.addButtonText}>Ajouter</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{employees.length}</Text>
            <Text style={styles.statLabel}>Total employés</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: COLORS.green }]}>
              {activeCount}
            </Text>
            <Text style={styles.statLabel}>Actifs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: COLORS.orange }]}>
              {inactiveCount}
            </Text>
            <Text style={styles.statLabel}>Inactifs</Text>
          </View>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color={COLORS.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un employé..."
            placeholderTextColor={COLORS.secondary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={19} color={COLORS.secondary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Équipe</Text>
          <Text style={styles.listCount}>{filteredEmployees.length} résultat(s)</Text>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={{ marginTop: 35 }}
          />
        ) : filteredEmployees.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={42} color={COLORS.secondary} />
            <Text style={styles.emptyTitle}>Aucun employé trouvé</Text>
            <Text style={styles.emptyText}>
              Ajoutez un employé ou modifiez votre recherche.
            </Text>
          </View>
        ) : (
          filteredEmployees.map((employee) => (
            <View key={employee.id} style={styles.employeeCard}>
              <View style={styles.employeeTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {employee.nom.trim().charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.employeeInfo}>
                  <Text style={styles.employeeName}>{employee.nom}</Text>
                  <Text style={styles.employeeEmail}>{employee.email}</Text>
                  <View style={styles.statusRow}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: employee.status ? COLORS.green : COLORS.orange },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: employee.status ? COLORS.green : COLORS.orange },
                      ]}
                    >
                      {employee.status ? 'Compte actif' : 'Compte désactivé'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => openEditModal(employee)}
                >
                  <Ionicons name="create-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.actionText}>Modifier</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => toggleStatus(employee)}
                >
                  <Ionicons
                    name={employee.status ? 'pause-circle-outline' : 'play-circle-outline'}
                    size={18}
                    color={COLORS.orange}
                  />
                  <Text style={styles.actionText}>
                    {employee.status ? 'Désactiver' : 'Activer'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => confirmDelete(employee)}
                >
                  <Ionicons name="trash-outline" size={18} color={COLORS.red} />
                  <Text style={[styles.actionText, { color: COLORS.red }]}>
                    Supprimer
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <Text style={styles.footer}>Elevage+ · Gestion de l'équipe</Text>
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingEmployee ? 'Modifier un employé' : 'Nouvel employé'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={25} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Nom complet</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex : Jean Dupont"
              placeholderTextColor={COLORS.secondary}
              value={form.nom}
              onChangeText={(value) => setForm({ ...form, nom: value })}
            />

            <Text style={styles.inputLabel}>Adresse email</Text>
            <TextInput
              style={styles.input}
              placeholder="exemple@email.com"
              placeholderTextColor={COLORS.secondary}
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={(value) => setForm({ ...form, email: value })}
            />

            <Text style={styles.inputLabel}>
              {editingEmployee ? 'Nouveau mot de passe (facultatif)' : 'Mot de passe'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={editingEmployee ? 'Laisser vide pour conserver' : '8 caractères minimum'}
              placeholderTextColor={COLORS.secondary}
              secureTextEntry
              value={form.password}
              onChangeText={(value) => setForm({ ...form, password: value })}
            />

            <TouchableOpacity
              style={[styles.saveButton, saving && { opacity: 0.7 }]}
              onPress={saveEmployee}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.saveButtonText}>
                  {editingEmployee ? 'Enregistrer les modifications' : 'Créer le compte'}
                </Text>
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
  subtitle: { color: COLORS.secondary, fontSize: 12, marginTop: 5 },
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
  searchBox: {
    backgroundColor: COLORS.white,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  searchInput: { flex: 1, height: 46, color: COLORS.text, marginLeft: 9, fontSize: 13 },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listTitle: { color: COLORS.text, fontSize: 17, fontWeight: '800' },
  listCount: { color: COLORS.secondary, fontSize: 11 },
  employeeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 17,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  employeeTop: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: COLORS.primary, fontSize: 18, fontWeight: '900' },
  employeeInfo: { flex: 1, marginLeft: 12 },
  employeeName: { color: COLORS.text, fontSize: 14, fontWeight: '800' },
  employeeEmail: { color: COLORS.secondary, fontSize: 11, marginTop: 3 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7 },
  statusDot: { width: 7, height: 7, borderRadius: 5 },
  statusText: { fontSize: 10, fontWeight: '700' },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 14,
    paddingTop: 12,
    gap: 5,
  },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { color: COLORS.primary, fontSize: 10, fontWeight: '700' },
  emptyState: {
    backgroundColor: COLORS.white,
    borderRadius: 17,
    padding: 28,
    alignItems: 'center',
  },
  emptyTitle: { color: COLORS.text, fontWeight: '800', fontSize: 15, marginTop: 12 },
  emptyText: { color: COLORS.secondary, fontSize: 11, textAlign: 'center', marginTop: 6 },
  footer: { textAlign: 'center', color: COLORS.secondary, fontSize: 10, marginVertical: 25 },
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
    marginBottom: 20,
  },
  modalTitle: { color: COLORS.text, fontSize: 18, fontWeight: '900' },
  inputLabel: { color: COLORS.text, fontSize: 12, fontWeight: '700', marginBottom: 7 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    height: 47,
    paddingHorizontal: 13,
    color: COLORS.text,
    marginBottom: 15,
    fontSize: 13,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 13,
    padding: 15,
    alignItems: 'center',
    marginTop: 5,
  },
  saveButtonText: { color: COLORS.white, fontSize: 13, fontWeight: '800' },
});
