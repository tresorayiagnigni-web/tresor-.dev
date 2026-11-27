import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  Employee,
  getEmployees,
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
  greenLight: '#E8F1E8',
  orange: '#D69A55',
  orangeLight: '#FBF0DF',
  red: '#C65353',
};

type FilterType = 'TOUS' | 'ACTIFS' | 'INACTIFS';

export default function EffectifsScreen() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('TOUS');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const loadEmployees = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await getEmployees();
      setEmployees(data);
    } catch (error: any) {
      Alert.alert(
        'Erreur',
        error?.response?.data?.message ||
          'Impossible de récupérer les effectifs. Vérifie ta connexion.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const activeCount = employees.filter((employee) => employee.status).length;
  const inactiveCount = employees.length - activeCount;

  const filteredEmployees = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return employees.filter((employee) => {
      const matchesSearch =
        employee.nom.toLowerCase().includes(searchValue) ||
        employee.email.toLowerCase().includes(searchValue);

      const matchesFilter =
        filter === 'TOUS' ||
        (filter === 'ACTIFS' && employee.status) ||
        (filter === 'INACTIFS' && !employee.status);

      return matchesSearch && matchesFilter;
    });
  }, [employees, search, filter]);

  const formatDate = (date?: string) => {
    if (!date) return 'Non renseignée';

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return 'Date indisponible';
    }

    return parsedDate.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const getInitials = (nom: string) => {
    return nom
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  };

  const renderFilter = (value: FilterType, label: string, count: number) => (
    <TouchableOpacity
      key={value}
      style={[
        styles.filterButton,
        filter === value && styles.filterButtonActive,
      ]}
      onPress={() => setFilter(value)}
    >
      <Text
        style={[
          styles.filterText,
          filter === value && styles.filterTextActive,
        ]}
      >
        {label} ({count})
      </Text>
    </TouchableOpacity>
  );

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
          <View style={styles.headingIcon}>
            <Ionicons name="people-outline" size={25} color={COLORS.primary} />
          </View>

          <View style={styles.headingInfo}>
            <Text style={styles.title}>Effectifs</Text>
            <Text style={styles.subtitle}>
              Vue globale du personnel de l'exploitation.
            </Text>
          </View>
        </View>

        {/* Statistiques */}
        <View style={styles.statsGrid}>
          <View style={styles.totalCard}>
            <View style={styles.statIcon}>
              <Ionicons name="people" size={21} color={COLORS.white} />
            </View>
            <Text style={styles.totalNumber}>{employees.length}</Text>
            <Text style={styles.totalLabel}>Total employés</Text>
            <Text style={styles.totalDescription}>Personnel enregistré</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.smallIcon, { backgroundColor: COLORS.greenLight }]}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.green} />
            </View>
            <Text style={[styles.statNumber, { color: COLORS.green }]}>
              {activeCount}
            </Text>
            <Text style={styles.statLabel}>Employés actifs</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.smallIcon, { backgroundColor: COLORS.orangeLight }]}>
              <Ionicons name="pause-circle" size={20} color={COLORS.orange} />
            </View>
            <Text style={[styles.statNumber, { color: COLORS.orange }]}>
              {inactiveCount}
            </Text>
            <Text style={styles.statLabel}>Comptes désactivés</Text>
          </View>
        </View>

        {/* Recherche */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color={COLORS.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher par nom ou email..."
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

        {/* Filtres */}
        <View style={styles.filters}>
          {renderFilter('TOUS', 'Tous', employees.length)}
          {renderFilter('ACTIFS', 'Actifs', activeCount)}
          {renderFilter('INACTIFS', 'Inactifs', inactiveCount)}
        </View>

        {/* Liste */}
        <View style={styles.listHeader}>
          <View>
            <Text style={styles.listTitle}>Personnel de l'exploitation</Text>
            <Text style={styles.listSubtitle}>
              Consultez les informations des employés.
            </Text>
          </View>

          <View style={styles.resultBadge}>
            <Text style={styles.resultText}>{filteredEmployees.length}</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={{ marginTop: 40 }}
          />
        ) : filteredEmployees.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={45} color={COLORS.secondary} />
            <Text style={styles.emptyTitle}>Aucun employé trouvé</Text>
            <Text style={styles.emptyText}>
              Aucun employé ne correspond à cette recherche.
            </Text>
          </View>
        ) : (
          filteredEmployees.map((employee) => (
            <TouchableOpacity
              key={employee.id}
              style={styles.employeeCard}
              activeOpacity={0.8}
              onPress={() => setSelectedEmployee(employee)}
            >
              <View style={styles.employeeTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {getInitials(employee.nom)}
                  </Text>
                </View>

                <View style={styles.employeeInfo}>
                  <Text style={styles.employeeName}>{employee.nom}</Text>
                  <Text style={styles.employeeEmail}>{employee.email}</Text>

                  <View style={styles.statusRow}>
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor: employee.status
                            ? COLORS.green
                            : COLORS.orange,
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color: employee.status
                            ? COLORS.green
                            : COLORS.orange,
                        },
                      ]}
                    >
                      {employee.status ? 'Actif' : 'Désactivé'}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailsIcon}>
                  <Ionicons
                    name="chevron-forward"
                    size={19}
                    color={COLORS.secondary}
                  />
                </View>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.dateInfo}>
                  <Ionicons
                    name="calendar-outline"
                    size={14}
                    color={COLORS.secondary}
                  />
                  <Text style={styles.dateText}>
                    Inscrit le {formatDate(employee.cree_le)}
                  </Text>
                </View>

                <Text style={styles.employeeId}>N° {employee.id}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        <Text style={styles.footer}>Élevage+ · Effectifs du personnel</Text>
      </ScrollView>

      {/* Fiche détaillée */}
      <Modal
        visible={selectedEmployee !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedEmployee(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Fiche de l'employé</Text>

              <TouchableOpacity onPress={() => setSelectedEmployee(null)}>
                <Ionicons name="close-circle" size={27} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>

            {selectedEmployee && (
              <>
                <View style={styles.profile}>
                  <View style={styles.profileAvatar}>
                    <Text style={styles.profileInitials}>
                      {getInitials(selectedEmployee.nom)}
                    </Text>
                  </View>

                  <Text style={styles.profileName}>
                    {selectedEmployee.nom}
                  </Text>

                  <View
                    style={[
                      styles.profileStatus,
                      {
                        backgroundColor: selectedEmployee.status
                          ? COLORS.greenLight
                          : COLORS.orangeLight,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: selectedEmployee.status
                          ? COLORS.green
                          : COLORS.orange,
                        fontSize: 11,
                        fontWeight: '800',
                      }}
                    >
                      {selectedEmployee.status ? 'COMPTE ACTIF' : 'COMPTE DÉSACTIVÉ'}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="person-outline" size={19} color={COLORS.primary} />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Nom complet</Text>
                    <Text style={styles.detailValue}>{selectedEmployee.nom}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="mail-outline" size={19} color={COLORS.primary} />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Adresse email</Text>
                    <Text style={styles.detailValue}>{selectedEmployee.email}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="shield-checkmark-outline" size={19} color={COLORS.primary} />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Rôle</Text>
                    <Text style={styles.detailValue}>Employé</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={19} color={COLORS.primary} />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Date de création</Text>
                    <Text style={styles.detailValue}>
                      {formatDate(selectedEmployee.cree_le)}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={19} color={COLORS.primary} />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Dernière modification</Text>
                    <Text style={styles.detailValue}>
                      {formatDate(selectedEmployee.modifier_le)}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setSelectedEmployee(null)}
                >
                  <Text style={styles.closeButtonText}>Fermer la fiche</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    backgroundColor: COLORS.background,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  headingIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headingInfo: { flex: 1 },
  title: { fontSize: 21, fontWeight: '900', color: COLORS.text },
  subtitle: { fontSize: 12, color: COLORS.secondary, marginTop: 4 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 19,
  },
  totalCard: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    padding: 17,
  },
  statIcon: {
    width: 37,
    height: 37,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.white,
    marginTop: 10,
  },
  totalLabel: { fontSize: 14, color: COLORS.white, fontWeight: '800' },
  totalDescription: {
    fontSize: 11,
    color: '#FCE9E3',
    marginTop: 4,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  smallIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: { fontSize: 25, fontWeight: '900', marginTop: 9 },
  statLabel: { color: COLORS.secondary, fontSize: 11, marginTop: 3 },
  searchBox: {
    backgroundColor: COLORS.white,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
  },
  searchInput: {
    flex: 1,
    height: 46,
    color: COLORS.text,
    marginLeft: 9,
    fontSize: 12,
  },
  filters: {
    flexDirection: 'row',
    gap: 7,
    marginBottom: 22,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 11,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 10,
    color: COLORS.secondary,
    fontWeight: '700',
  },
  filterTextActive: { color: COLORS.primary },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listTitle: { fontSize: 15, fontWeight: '900', color: COLORS.text },
  listSubtitle: { fontSize: 10, color: COLORS.secondary, marginTop: 4 },
  resultBadge: {
    minWidth: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultText: { color: COLORS.primary, fontSize: 12, fontWeight: '900' },
  employeeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 17,
    padding: 14,
    marginBottom: 11,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  employeeTop: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 47,
    height: 47,
    borderRadius: 15,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 17, fontWeight: '900', color: COLORS.primary },
  employeeInfo: { flex: 1, marginLeft: 11 },
  employeeName: { fontSize: 14, fontWeight: '900', color: COLORS.text },
  employeeEmail: { fontSize: 11, color: COLORS.secondary, marginTop: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7 },
  statusDot: { width: 7, height: 7, borderRadius: 5 },
  statusText: { fontSize: 10, fontWeight: '800' },
  detailsIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 13,
    paddingTop: 11,
  },
  dateInfo: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dateText: { fontSize: 10, color: COLORS.secondary },
  employeeId: { fontSize: 10, color: COLORS.secondary, fontWeight: '800' },
  emptyState: {
    backgroundColor: COLORS.white,
    borderRadius: 17,
    padding: 30,
    alignItems: 'center',
  },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginTop: 12 },
  emptyText: { fontSize: 11, color: COLORS.secondary, textAlign: 'center', marginTop: 6 },
  footer: {
    textAlign: 'center',
    color: COLORS.secondary,
    fontSize: 10,
    marginVertical: 25,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30,24,21,0.5)',
    justifyContent: 'center',
    padding: 17,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 19,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: COLORS.text },
  profile: { alignItems: 'center', marginBottom: 18 },
  profileAvatar: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: { color: COLORS.primary, fontSize: 24, fontWeight: '900' },
  profileName: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 10,
  },
  profileStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  detailContent: { flex: 1 },
  detailLabel: { color: COLORS.secondary, fontSize: 10 },
  detailValue: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
  },
  closeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 13,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  closeButtonText: { color: COLORS.white, fontSize: 12, fontWeight: '900' },
});
