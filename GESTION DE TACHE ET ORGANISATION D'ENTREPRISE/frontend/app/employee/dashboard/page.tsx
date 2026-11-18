'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { EmployeeLayout } from '@/app/layout/employeeLayout';
import {
  CheckSquare,
  Clock,
  Bell,
  Calendar,
  AlertCircle,
} from 'lucide-react';

import { getTasks, type Task } from '@/lib/actions/taskActions';
import { getProfile } from '@/lib/actions/userActions';

// ========== TYPES ==========
interface Announcement {
  id: number;
  title: string;
  date: string;
  content: string;
}

type CurrentProfile = {
  id?: number | string;
  nom?: string;
  name?: string;
  email?: string;
  role?: string;
};

// ========== HELPERS ==========
function normalizeStatus(status?: string): string {
  return (status || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_');
}

function isCompleted(status?: string): boolean {
  return ['terminer', 'termine', 'terminee', 'completed', 'done'].includes(
    normalizeStatus(status),
  );
}

function isInProgress(status?: string): boolean {
  return ['en_cours', 'in_progress', 'inprogress'].includes(
    normalizeStatus(status),
  );
}

function isPending(status?: string): boolean {
  return (
    !isCompleted(status) &&
    !isInProgress(status)
  );
}

function getTaskAssigneeIds(task: any): number[] {
  // Supporte plusieurs formes possibles venant de l'API
  if (Array.isArray(task.assigneeIds)) {
    return task.assigneeIds.map(Number).filter(Number.isFinite);
  }
  if (task.userId != null) return [Number(task.userId)];
  if (task.assignedTo != null) return [Number(task.assignedTo)];
  if (task.user?.id != null) return [Number(task.user.id)];
  return [];
}

function getTaskDueDate(task: any): string | null {
  return (
    task.Date_limite ??
    task.date_limite ??
    task.dateLimite ??
    task.dueDate ??
    null
  );
}

// ========== MAIN COMPONENT ==========
export default function EmployeeWorkspaceDashboard() {
  const [profile, setProfile] = useState<CurrentProfile | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Attendance (local pour l’instant)
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [hoursWorked, setHoursWorked] = useState(0);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);

  // Annonces (statiques pour l’instant)
  const announcements: Announcement[] = [
    {
      id: 1,
      title: 'Updated Health & Safety Policy',
      date: 'March 15, 2026',
      content:
        'Please review the updated workplace safety guidelines. New protocols for remote work and office hygiene have been implemented effective immediately.',
    },
    {
      id: 2,
      title: 'Performance Review Cycle Q2 2026',
      date: 'March 12, 2026',
      content:
        'The Q2 performance review cycle will begin on April 1st. Managers are requested to schedule review meetings with their team members.',
    },
    {
      id: 3,
      title: 'System Maintenance Notice',
      date: 'March 10, 2026',
      content:
        'HRMS platform will undergo scheduled maintenance on March 20th from 2:00 AM to 6:00 AM EST. Please plan your work accordingly.',
    },
  ];

  // ===== LOAD DATA =====
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Profil de l'employé connecté
      const profileResult = await getProfile();

      if (!profileResult.success || !profileResult.data) {
        throw new Error(
          profileResult.message || 'Impossible de charger le profil. Reconnecte-toi.',
        );
      }

      const raw = profileResult.data as any;
      const currentProfile: CurrentProfile =
        raw?.data?.user ?? raw?.user ?? raw?.data ?? raw;

      setProfile(currentProfile);

      const currentUserId = currentProfile.id != null ? Number(currentProfile.id) : null;

      if (currentUserId == null || !Number.isFinite(currentUserId)) {
        throw new Error('Identifiant utilisateur introuvable dans le profil.');
      }

      // 2. Toutes les tâches (on filtre côté client)
      const taskResult = await getTasks();

      console.log('Résultat getTasks :', taskResult);
      console.log('User ID connecté :', currentUserId);

      if (!taskResult.success || !taskResult.data) {
        throw new Error(
          taskResult.message || 'Impossible de charger les tâches.',
        );
      }

      // Filtre : tâches assignées à l'employé connecté
      const myTasks = (taskResult.data as any[]).filter((task) => {
        const assigneeIds = getTaskAssigneeIds(task);
        return assigneeIds.includes(currentUserId);
      });

      console.log('Mes tâches filtrées :', myTasks);
      setTasks(myTasks);
    } catch (err) {
      console.error('Erreur dashboard employé :', err);
      setError(
        err instanceof Error ? err.message : 'Erreur lors du chargement des données.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // ===== COMPTEURS =====
  const pendingTasks = tasks.filter((t) => isPending(t.status)).length;
  const inProgressTasks = tasks.filter((t) => isInProgress(t.status)).length;
  const completedTasks = tasks.filter((t) => isCompleted(t.status)).length;

  // ===== TIMER CLOCK =====
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isClockedIn && clockInTime) {
      interval = setInterval(() => {
        setHoursWorked((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isClockedIn, clockInTime]);

  const handleClockToggle = () => {
    if (!isClockedIn) {
      setIsClockedIn(true);
      setClockInTime(new Date());
      setHoursWorked(0);
    } else {
      setIsClockedIn(false);
      setClockInTime(null);
    }
  };

  const formatHoursWorked = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Non définie';
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return 'Non définie';
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusLabel = (status?: string) => {
    if (isCompleted(status)) return 'Terminée';
    if (isInProgress(status)) return 'En cours';
    return 'À faire';
  };

  // ===== INFOS AFFICHAGE =====
  const employeeName = profile?.nom || profile?.name || 'Employé';
  const employeeInitials = employeeName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

  // ===== LOADING =====
  if (isLoading) {
    return (
      <EmployeeLayout
        pageTitle="Dashboard"
        pageSubtitle="Chargement de votre espace..."
        employeeName={employeeName}
        employeeInitials={employeeInitials}
        employeeRole="Employee"
      >
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[#263A81]" />
            <p className="text-[#6B7280]">Chargement du tableau de bord...</p>
          </div>
        </div>
      </EmployeeLayout>
    );
  }

  // ===== ERROR =====
  if (error) {
    return (
      <EmployeeLayout
        pageTitle="Dashboard"
        pageSubtitle="Erreur de chargement"
        employeeName={employeeName}
        employeeInitials={employeeInitials}
        employeeRole="Employee"
      >
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-1 shrink-0 text-red-600" />
            <div>
              <h2 className="font-semibold text-red-800">Impossible de charger le dashboard</h2>
              <p className="mt-2 text-sm text-red-700">{error}</p>
              <button
                type="button"
                onClick={() => void loadData()}
                className="mt-4 rounded-lg bg-[#263A81] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e2f6a]"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </EmployeeLayout>
    );
  }

  // ===== RENDER =====
  return (
    <EmployeeLayout
      pageTitle="Dashboard"
      pageSubtitle={`Welcome back, ${employeeName}. Here's your workspace overview.`}
      employeeName={employeeName}
      employeeInitials={employeeInitials}
      employeeRole="Employee"
    >
      <div className="space-y-6">
        {/* ATTENDANCE */}
        <section className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`rounded-lg p-3 transition-colors ${
                  isClockedIn ? 'bg-green-100' : 'bg-[#263A81]/10'
                }`}
              >
                <Clock
                  size={28}
                  className={isClockedIn ? 'text-green-600' : 'text-[#263A81]'}
                />
              </div>
              <div>
                <div className="text-sm font-medium text-[#6B7280]">
                  Hours Worked Today
                </div>
                <div className="font-mono text-3xl font-bold text-[#1F2937]">
                  {formatHoursWorked(hoursWorked)}
                </div>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      isClockedIn
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <span
                      className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                        isClockedIn ? 'animate-pulse bg-green-500' : 'bg-gray-400'
                      }`}
                    />
                    Status: {isClockedIn ? 'On the Clock' : 'Off the Clock'}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClockToggle}
              className={`w-full rounded-lg px-8 py-3 font-bold text-white transition-all active:scale-95 md:w-auto ${
                isClockedIn
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-[#263A81] hover:bg-[#1e2f6a]'
              }`}
            >
              {isClockedIn ? 'Clock Out' : 'Clock In'}
            </button>
          </div>
        </section>

        {/* COUNTERS */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-[#6B7280]">Pending Tasks</div>
                <div className="mt-1 text-3xl font-bold text-[#1F2937]">{pendingTasks}</div>
              </div>
              <div className="rounded-lg bg-orange-100 p-3">
                <CheckSquare size={24} className="text-orange-600" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-[#6B7280]">In Progress</div>
                <div className="mt-1 text-3xl font-bold text-[#1F2937]">{inProgressTasks}</div>
              </div>
              <div className="rounded-lg bg-blue-100 p-3">
                <Clock size={24} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-[#6B7280]">Completed Tasks</div>
                <div className="mt-1 text-3xl font-bold text-[#1F2937]">{completedTasks}</div>
              </div>
              <div className="rounded-lg bg-green-100 p-3">
                <CheckSquare size={24} className="text-green-600" />
              </div>
            </div>
          </div>
        </section>

        {/* CURRENT TASKS */}
        <section className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckSquare size={24} className="text-[#263A81]" />
              <h2 className="text-xl font-bold text-[#1F2937]">Current Tasks</h2>
            </div>
            <span className="text-sm text-[#6B7280]">
              {tasks.length} total · {pendingTasks} pending
            </span>
          </div>

          <div className="space-y-3">
            {tasks.length === 0 ? (
              <div className="py-8 text-center text-[#6B7280]">
                <p>No tasks assigned to you yet.</p>
              </div>
            ) : (
              tasks.map((task) => {
                const completed = isCompleted(task.status);
                const dueDate = getTaskDueDate(task);

                return (
                  <div
                    key={task.id}
                    className={`flex items-start gap-3 rounded-lg border p-4 transition-all ${
                      completed
                        ? 'border-green-200 bg-green-50/50'
                        : 'border-[#E5E7EB] hover:border-[#263A81]/20 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex-1">
                      <div
                        className={`font-medium ${
                          completed ? 'text-[#6B7280] line-through' : 'text-[#1F2937]'
                        }`}
                      >
                        {task.title || 'Tâche sans titre'}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[#6B7280]">
                        <Calendar size={14} />
                        <span>Due: {formatDate(dueDate)}</span>
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                          {getStatusLabel(task.status)}
                        </span>
                        {completed && (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* ANNOUNCEMENTS */}
        <section className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <Bell size={24} className="text-[#263A81]" />
            <h2 className="text-xl font-bold text-[#1F2937]">Company Announcements</h2>
          </div>

          <div className="space-y-4">
            {announcements.map((announcement, index) => (
              <div
                key={announcement.id}
                className={`pb-4 ${
                  index < announcements.length - 1 ? 'border-b border-[#E5E7EB]' : ''
                }`}
              >
                <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-base font-semibold text-[#1F2937]">
                    {announcement.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                    <Calendar size={14} />
                    <span>{announcement.date}</span>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-[#6B7280]">
                  {announcement.content}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </EmployeeLayout>
  );
}