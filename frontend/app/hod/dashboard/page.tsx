'use client';

import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Users,
} from 'lucide-react';

import { HODLayout } from '@/app/layout/HodLayout';

import {
  getTasks,
  type Task,
} from '@/lib/actions/taskActions';

import {
  getUsers,
  getProfile,
  type User,
} from '@/lib/actions/userActions';

import {
  getDepartmentById,
  type Department,
} from '@/lib/actions/departmentActions';

// ======================================================
// CONFIGURATION
// ======================================================

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
).replace(/\/+$/, '');

// ======================================================
// TYPES
// ======================================================

type CurrentProfile = {
  id?: number | string;
  nom?: string;
  name?: string;
  email?: string;
  role?: string;
  departmentId?: number | string | null;
  departementId?: number | string | null;
  departement?: {
    id?: number | string | null;
    nom_departement?: string;
  } | null;
};

type DashboardUser = User & {
  id?: number | string;
  nom?: string;
  email?: string;
  role?: string;
  departmentId?: number | string | null;
  departementId?: number | string | null;
  departement?: {
    id?: number | string | null;
    nom_departement?: string;
  } | null;
};

type DashboardTaskData = Task & {
  id?: number | string;
  title?: string;
  status?: string;
  userId?: number | string | null;
  assignedTo?: number | string | null;
  user?: {
    id?: number | string | null;
  } | null;
  Date_limite?: string | Date | null;
  date_limite?: string | Date | null;
  dateLimite?: string | Date | null;
  priorite?: string;
  priority?: string;
};

type DashboardTask = {
  id: string;
  title: string;
  employee: string;
  dueDate: string;
  priority: string;
  status: string;
};

// ======================================================
// HELPERS
// ======================================================

function normalizeStatus(status?: string): string {
  return (status || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_');
}

function isCompleted(status?: string): boolean {
  return [
    'terminer',
    'termine',
    'terminee',
    'completed',
    'complete',
    'done',
    'achevee',
    'acheve',
  ].includes(normalizeStatus(status));
}

function isInProgress(status?: string): boolean {
  return [
    'en_cours',
    'in_progress',
    'inprogress',
  ].includes(normalizeStatus(status));
}

function getPriority(priority?: string): string {
  const value = (priority || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (
    value.includes('elev') ||
    value.includes('high') ||
    value.includes('haute')
  ) {
    return 'Élevée';
  }

  if (
    value.includes('bas') ||
    value.includes('low') ||
    value.includes('faible')
  ) {
    return 'Basse';
  }

  return 'Moyenne';
}

function formatDate(
  date?: string | Date | null,
): string {
  if (!date) {
    return 'Non définie';
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return 'Non définie';
  }

  return parsed.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getUserDepartmentId(
  user: DashboardUser | CurrentProfile,
): number | null {
  const departmentId =
    user.departementId ??
    user.departmentId ??
    user.departement?.id;

  if (departmentId == null || departmentId === '') {
    return null;
  }

  const parsed = Number(departmentId);

  return Number.isFinite(parsed) ? parsed : null;
}

function getTaskUserId(
  task: DashboardTaskData,
): number | null {
  const assignedId =
    task.userId ??
    task.assignedTo ??
    task.user?.id;

  if (assignedId == null || assignedId === '') {
    return null;
  }

  const parsed = Number(assignedId);

  return Number.isFinite(parsed) ? parsed : null;
}

function getTaskDueDate(
  task: DashboardTaskData,
): string | Date | null {
  return (
    task.Date_limite ??
    task.date_limite ??
    task.dateLimite ??
    null
  );
}

// ======================================================
// MAIN COMPONENT
// ======================================================

export default function HODDashboardPage() {
  const [profile, setProfile] =
    useState<CurrentProfile | null>(null);

  const [department, setDepartment] =
    useState<Department | null>(null);

  const [users, setUsers] = useState<DashboardUser[]>([]);

  const [tasks, setTasks] = useState<DashboardTaskData[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  // ====================================================
  // LOAD DASHBOARD DATA
  // ====================================================

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Charger le profil via le même mécanisme de token que les autres
      // pages (cookie lu côté serveur dans userActions.ts).
      const profileResult = await getProfile();

      if (!profileResult.success || !profileResult.data) {
        throw new Error(
          profileResult.message ||
            'Impossible de charger le profil. Reconnecte-toi.',
        );
      }

      const profileData: unknown = profileResult.data;

      const responseObject = profileData as {
        user?: CurrentProfile;
        data?: {
          user?: CurrentProfile;
        } & CurrentProfile;
      } & CurrentProfile;

      const currentProfile: CurrentProfile =
        responseObject.data?.user ??
        responseObject.user ??
        responseObject.data ??
        responseObject;

      console.log('Profil HOD reçu :', currentProfile);

      setProfile(currentProfile);

      // 2. Charger les employés et les tâches.
      const [userResult, taskResult] = await Promise.all([
        getUsers(),
        getTasks(),
      ]);

      if (!userResult.success || !userResult.data) {
        throw new Error(
          userResult.message ||
            'Impossible de charger la liste des utilisateurs.',
        );
      }

      if (!taskResult.success || !taskResult.data) {
        throw new Error(
          taskResult.message ||
            'Impossible de charger les tâches.',
        );
      }

      const loadedUsers =
        userResult.data as DashboardUser[];

      const loadedTasks =
        taskResult.data as DashboardTaskData[];

      setUsers(loadedUsers);
      setTasks(loadedTasks);

      // 3. Récupérer le département du responsable.
      // Le profil peut ne pas contenir departementId.
      // On recherche donc aussi son compte dans la liste des utilisateurs.

      const matchingUser = loadedUsers.find((user) => {
        if (
          currentProfile.id != null &&
          user.id != null &&
          Number(user.id) === Number(currentProfile.id)
        ) {
          return true;
        }

        return Boolean(
          currentProfile.email &&
            user.email &&
            user.email.toLowerCase() ===
              currentProfile.email.toLowerCase(),
        );
      });

      const departmentId =
        getUserDepartmentId(currentProfile) ??
        (matchingUser
          ? getUserDepartmentId(matchingUser)
          : null);

      if (departmentId == null) {
        console.error(
          'Profil du responsable :',
          currentProfile,
        );

        console.error(
          'Compte correspondant dans les utilisateurs :',
          matchingUser,
        );

        throw new Error(
          'Aucun département associé à ce responsable. Vérifie departementId dans la table users et l’association du responsable dans la table departements.',
        );
      }

      console.log(
        'Département du responsable :',
        departmentId,
      );

      // 4. Charger le département correspondant.
      const departmentResult =
        await getDepartmentById(departmentId);

      if (
        !departmentResult.success ||
        !departmentResult.data
      ) {
        throw new Error(
          departmentResult.message ||
            `Impossible de charger le département ${departmentId}.`,
        );
      }

      setDepartment(departmentResult.data);

      console.log(
        'Département chargé :',
        departmentResult.data,
      );

      console.log(
        'Utilisateurs reçus :',
        loadedUsers.map((user) => ({
          id: user.id,
          nom: user.nom,
          departementId: user.departementId,
          departmentId: user.departmentId,
          departement: user.departement,
        })),
      );

      console.log('Tâches reçues :', loadedTasks);
    } catch (err: unknown) {
      console.error(
        'Erreur lors du chargement du dashboard HOD :',
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Une erreur inattendue est survenue.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  // ====================================================
  // DEPARTMENT DATA
  // ====================================================

  // Le profil peut ne pas contenir le département :
  // on utilise alors celui chargé depuis l'API.
  const departmentId =
    (department?.id != null
      ? Number(department.id)
      : null) ??
    getUserDepartmentId(profile ?? {});

  // Ne conserver que les membres du département du HOD.
  const departmentUsers = users.filter((user) => {
    const userDepartmentId = getUserDepartmentId(user);

    return (
      departmentId != null &&
      userDepartmentId != null &&
      userDepartmentId === departmentId
    );
  });

  const departmentUserIds = new Set(
    departmentUsers
      .map((user) =>
        user.id == null ? null : Number(user.id),
      )
      .filter(
        (id): id is number =>
          id !== null && Number.isFinite(id),
      ),
  );

  // ====================================================
  // DEPARTMENT TASKS
  // ====================================================

  const departmentTasks: DashboardTask[] = tasks
    .filter((task) => {
      const assignedUserId = getTaskUserId(task);

      return (
        assignedUserId != null &&
        departmentUserIds.has(assignedUserId)
      );
    })
    .map((task) => {
      const assignedUserId = getTaskUserId(task);

      const assignedUser = departmentUsers.find(
        (user) =>
          user.id != null &&
          Number(user.id) === assignedUserId,
      );

      const dueDate = getTaskDueDate(task);

      return {
        id: String(task.id ?? ''),
        title: task.title || 'Tâche sans titre',
        employee: assignedUser?.nom || 'Employé non identifié',
        dueDate: dueDate ? String(dueDate) : '',
        priority: getPriority(
          task.priorite ?? task.priority,
        ),
        status: task.status || '',
      };
    });

  // ====================================================
  // STATISTICS
  // ====================================================

  const completedTasks = departmentTasks.filter((task) =>
    isCompleted(task.status),
  ).length;

  const pendingTasks =
    departmentTasks.length - completedTasks;

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const weekEnd = new Date(today);

  weekEnd.setDate(weekEnd.getDate() + 7);

  weekEnd.setHours(23, 59, 59, 999);

  const deadlinesThisWeek = departmentTasks.filter((task) => {
    if (!task.dueDate || isCompleted(task.status)) {
      return false;
    }

    const dueDate = new Date(task.dueDate);

    return (
      !Number.isNaN(dueDate.getTime()) &&
      dueDate >= today &&
      dueDate <= weekEnd
    );
  }).length;

  // ====================================================
  // HEADER INFORMATION
  // ====================================================

  const hodName =
    profile?.nom ||
    profile?.name ||
    'Responsable de département';

  const hodInitials = hodName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  const departmentName =
    department?.nom_departement ||
    profile?.departement?.nom_departement ||
    'Mon département';

  // ====================================================
  // LOADING STATE
  // ====================================================

  if (loading) {
    return (
      <HODLayout
        pageTitle="Tableau de bord du département"
        pageSubtitle="Chargement des données..."
        departmentName={departmentName}
        hodName={hodName}
        hodInitials={hodInitials}
        showCreateButton={false}
      >
        <div className="flex min-h-[350px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#263A81]" />

            <p className="text-gray-500">
              Chargement depuis la base de données...
            </p>
          </div>
        </div>
      </HODLayout>
    );
  }

  // ====================================================
  // ERROR STATE
  // ====================================================

  if (error) {
    return (
      <HODLayout
        pageTitle="Tableau de bord du département"
        pageSubtitle="Erreur de chargement"
        departmentName={departmentName}
        hodName={hodName}
        hodInitials={hodInitials}
        showCreateButton={false}
      >
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-1 shrink-0 text-red-600" />

            <div>
              <h2 className="font-semibold text-red-800">
                Impossible de charger le tableau de bord
              </h2>

              <p className="mt-2 text-sm text-red-700">
                {error}
              </p>

              <button
                type="button"
                onClick={() => void loadDashboard()}
                className="mt-4 rounded-lg bg-[#263A81] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1d2e68]"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </HODLayout>
    );
  }

  // ====================================================
  // DASHBOARD
  // ====================================================

  return (
    <HODLayout
      pageTitle="Tableau de bord du département"
      pageSubtitle={`Département : ${departmentName}`}
      departmentName={departmentName}
      hodName={hodName}
      hodInitials={hodInitials}
      showCreateButton={true}
      onCreateClick={() => {
        window.location.assign('/hod/tasks');
      }}
      createButtonText="Nouvelle tâche"
    >
      {/* STATISTIQUES */}

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          title="Employés du département"
          value={departmentUsers.length}
          icon={<Users size={26} />}
          iconClass="bg-indigo-100 text-indigo-700"
        />

        <StatCard
          title="Tâches en attente / terminées"
          value={
            <span>
              <span className="text-amber-600">
                {pendingTasks}
              </span>

              <span className="mx-2 text-gray-400">/</span>

              <span className="text-green-600">
                {completedTasks}
              </span>
            </span>
          }
          icon={<ClipboardList size={26} />}
          iconClass="bg-blue-100 text-blue-700"
        />

        <StatCard
          title="Échéances cette semaine"
          value={deadlinesThisWeek}
          icon={<CalendarDays size={26} />}
          iconClass="bg-red-100 text-red-600"
        />
      </div>

      {/* TABLEAU DES TÂCHES */}

      <section className="mb-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900">
            Tâches du département
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Suivi des tâches assignées aux membres du département
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                {[
                  'Titre de la tâche',
                  'Employé assigné',
                  'Date limite',
                  'Priorité',
                  'État',
                ].map((heading) => (
                  <th
                    key={heading}
                    className="whitespace-nowrap px-6 py-4 font-semibold text-gray-600"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {departmentTasks.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center"
                  >
                    <ClipboardList
                      size={42}
                      className="mx-auto mb-3 text-gray-300"
                    />

                    <p className="font-medium text-gray-700">
                      Aucune tâche trouvée
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Aucune tâche assignée aux employés de ce département.
                    </p>
                  </td>
                </tr>
              ) : (
                departmentTasks.map((task) => {
                  const completed = isCompleted(task.status);

                  const inProgress = isInProgress(task.status);

                  return (
                    <tr
                      key={task.id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {task.title}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {task.employee}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-gray-600">
                        {formatDate(task.dueDate)}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            task.priority === 'Élevée'
                              ? 'bg-red-100 text-red-700'
                              : task.priority === 'Basse'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                            completed
                              ? 'bg-green-100 text-green-700'
                              : inProgress
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {completed ? (
                            <CheckCircle2 size={14} />
                          ) : (
                            <Clock3 size={14} />
                          )}

                          {completed
                            ? 'Terminée'
                            : inProgress
                              ? 'En cours'
                              : 'À faire'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* RÉSUMÉ */}

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">
          Résumé du département
        </h2>

        <p className="mt-2 text-sm text-gray-600">
          {departmentUsers.length} employé(s),{' '}
          {departmentTasks.length} tâche(s), dont{' '}
          {completedTasks} terminée(s).
        </p>
      </section>
    </HODLayout>
  );
}

// ======================================================
// STATISTIC CARD
// ======================================================

function StatCard({
  title,
  value,
  icon,
  iconClass,
}: {
  title: string;
  value: ReactNode;
  icon: ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>

          <div className="mt-2 text-3xl font-bold text-gray-900">
            {value}
          </div>
        </div>

        <div className={`rounded-lg p-3 ${iconClass}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
