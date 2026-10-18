'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Building2,
  FolderPlus,
  ListPlus,
  RefreshCw,
  Pencil,
  UserPlus,
  Trash2,
} from 'lucide-react';

import {
  listProjects,
  listTasks,
  deleteProject,
} from '@/lib/actions/projectActions';
import { deleteTask } from '@/lib/actions/taskActions';
import type {
  Department,
  Project,
  Task,
  UserLite,
} from '@/lib/actions/projectActions';

import NewProjectModal from './ProjectModal';
import NewTaskModal from './TaskModal';

import {
  AVATAR,
  BTN_PRIMARY,
  BTN_SECONDARY,
  CARD,
  CHIP,
  DotChip,
  PRIORITY_META,
  STATUS_META,
} from './ui';

interface ProjectsAndTasksProps {
  users: UserLite[];
  departments: Department[];
}

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

function ColumnHeader({
  title,
  count,
}: {
  title: string;
  count: number;
}) {
  return (
    <div className="mb-3 flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 shadow-[0_2px_14px_rgba(38,58,129,0.07)]">
      <span className="text-sm font-bold text-[#16193a]">{title}</span>
      <span className="rounded-full bg-[#263a81] px-2 py-0.5 text-[11px] font-bold text-white">
        {count}
      </span>
    </div>
  );
}

const Bar = () => (
  <div className="my-3 h-[3px] rounded-full bg-[#384ba0]" />
);

const Foot = ({ children }: { children: ReactNode }) => (
  <p className="text-[11px] font-bold text-[#6b73a8]">{children}</p>
);

function CardActions({
  onEdit,
  onAssign,
  onDelete,
}: {
  onEdit: () => void;
  onAssign: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onEdit}
        title="Modifier"
        className="rounded-lg p-1.5 text-[#6b73a8] hover:bg-[#f0f2fb] hover:text-[#263a81]"
      >
        <Pencil size={15} />
      </button>
      <button
        type="button"
        onClick={onAssign}
        title="Assigner"
        className="rounded-lg p-1.5 text-[#6b73a8] hover:bg-[#f0f2fb] hover:text-[#263a81]"
      >
        <UserPlus size={15} />
      </button>
      <button
        type="button"
        onClick={onDelete}
        title="Supprimer"
        className="rounded-lg p-1.5 text-[#6b73a8] hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function formatDate(date?: string | null): string {
  if (!date) return 'N/A';

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'N/A';

  return parsed.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export default function ProjectsAndTasks({
  users,
  departments,
}: ProjectsAndTasksProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [modal, setModal] = useState<'project' | 'task' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [projectsResult, tasksResult] = await Promise.all([
        listProjects(),
        listTasks(),
      ]);

      const errors: string[] = [];

      if (projectsResult.success) {
        setProjects(projectsResult.data ?? []);
      } else {
        errors.push(
          projectsResult.message || 'Impossible de charger les projets.',
        );
      }

      if (tasksResult.success) {
        setTasks(tasksResult.data ?? []);
      } else {
        errors.push(
          tasksResult.message || 'Impossible de charger les tâches.',
        );
      }

      if (errors.length > 0) {
        setError(errors.join(' '));
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Une erreur est survenue pendant le chargement.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const deptName = (id: string) =>
    departments.find((department) => department.id === id)?.name ?? '—';

  const findUser = (id: string) => users.find((user) => user.id === id);

  const getTaskCount = (projectId: string) =>
    tasks.filter((task) => task.projectId === projectId).length;

  // ===== PROJETS =====
  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setEditingTask(null);
    setModal('project');
  };

  const handleAssignProject = (project: Project) => {
    setEditingProject(null);
    setEditingTask({
      id: '',
      title: '',
      description: '',
      projectId: project.id,
      status: 'TODO',
      priority: 'MEDIUM',
      assigneeIds: [],
    });
    setModal('task');
  };

  const handleDeleteProject = async (project: Project) => {
    if (!confirm(`Supprimer le projet « ${project.name} » ?`)) return;

    try {
      const result = await deleteProject(String(project.id));
      if (!result.success) {
        setError(result.message || 'Impossible de supprimer le projet.');
        return;
      }
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
      setTasks((prev) => prev.filter((t) => t.projectId !== project.id));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors de la suppression du projet.',
      );
    }
  };

  // ===== TÂCHES =====
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setEditingProject(null);
    setModal('task');
  };

  const handleAssignTask = (task: Task) => {
    setEditingTask(task);
    setEditingProject(null);
    setModal('task');
  };

  const handleDeleteTask = async (task: Task) => {
    if (!confirm(`Supprimer la tâche « ${task.title} » ?`)) return;

    try {
      const result = await deleteTask(Number(task.id));
      if (!result.success) {
        setError(result.message || 'Impossible de supprimer la tâche.');
        return;
      }
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors de la suppression de la tâche.',
      );
    }
  };

  return (
    <section className="mb-10">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-[#16193a]">
          Projets et tâches
        </h2>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingProject(null);
              setModal('project');
            }}
            className={BTN_SECONDARY}
            disabled={loading}
          >
            <FolderPlus size={16} />
            Nouveau projet
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingTask(null);
              setModal('task');
            }}
            className={BTN_PRIMARY}
            disabled={loading}
          >
            <ListPlus size={16} />
            Nouvelle tâche
          </button>

          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            title="Actualiser les projets et les tâches"
            aria-label="Actualiser les données"
            className="rounded-xl px-3 py-2 text-sm text-[#263a81] hover:bg-[#f4f5fb] disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? 'animate-spin' : ''}
            />
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void loadData()}
            className="font-semibold underline"
          >
            Réessayer
          </button>
        </div>
      )}

      {loading && (
        <p className="mb-4 text-sm text-[#6b73a8]" role="status">
          Chargement des projets et des tâches…
        </p>
      )}

      <div className="space-y-8">
        {/* PROJETS */}
        <div>
          <ColumnHeader title="Projets" count={projects.length} />

          {!loading && projects.length === 0 && (
            <div className={CARD}>
              <p className="text-sm text-[#6b73a8]">
                Aucun projet. Créez-en un pour l&apos;assigner à des
                départements.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => {
              const departmentId =
                project.departement?.id ?? project.departementId;

              const departmentLabel =
                project.departement?.nom_departement ??
                (departmentId !== undefined
                  ? deptName(String(departmentId))
                  : '—');

              const statusMeta = STATUS_META[project.status];
              const taskCount = getTaskCount(project.id);

              return (
                <article
                  key={project.id}
                  className="rounded-2xl border border-[#e8eaf3] bg-white p-5 shadow-[0_2px_14px_rgba(38,58,129,0.07)] transition hover:shadow-[0_6px_20px_rgba(38,58,129,0.12)]"
                >
                  <div className="mb-3 flex flex-wrap items-center gap-1.5">
                    <span className={CHIP}>
                      <Building2 size={11} />
                      Dept: {departmentLabel}
                    </span>
                    {statusMeta && (
                      <DotChip dot={statusMeta.dot}>
                        {statusMeta.label}
                      </DotChip>
                    )}
                  </div>

                  <div className="flex items-start gap-3">
                    <span className={`${AVATAR} h-11 w-11 shrink-0 text-sm`}>
                      {initials(project.name || 'PR')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-[15px] font-bold text-[#16193a]">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-[#707ead]">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <Bar />

                  <div className="flex items-center justify-between gap-2">
                    <Foot>
                      {taskCount} tâche(s) · Échéance :{' '}
                      {formatDate(project.dueDate)}
                    </Foot>
                    <CardActions
                      onEdit={() => handleEditProject(project)}
                      onAssign={() => handleAssignProject(project)}
                      onDelete={() => void handleDeleteProject(project)}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* TÂCHES */}
        <div>
          <ColumnHeader title="Tâches" count={tasks.length} />

          {!loading && tasks.length === 0 && (
            <div className={CARD}>
              <p className="text-sm text-[#6b73a8]">
                Aucune tâche. Créez-en une et assignez-la à votre équipe.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tasks.map((task) => {
              const statusMeta = STATUS_META[task.status];
              const priorityMeta = PRIORITY_META[task.priority];
              const projectName =
                projects.find((p) => p.id === task.projectId)?.name ??
                'Projet associé';

              return (
                <article
                  key={task.id}
                  className="rounded-2xl border border-[#e8eaf3] bg-white p-5 shadow-[0_2px_14px_rgba(38,58,129,0.07)] transition hover:shadow-[0_6px_20px_rgba(38,58,129,0.12)]"
                >
                  <div className="mb-3 flex flex-wrap items-center gap-1.5">
                    {statusMeta && (
                      <DotChip dot={statusMeta.dot}>
                        {statusMeta.label}
                      </DotChip>
                    )}
                    {priorityMeta && (
                      <DotChip dot={priorityMeta.dot}>
                        Priorité {priorityMeta.label.toLowerCase()}
                      </DotChip>
                    )}
                  </div>

                  <div className="flex items-start gap-3">
                    <span className={`${AVATAR} h-11 w-11 shrink-0 text-sm`}>
                      {initials(task.title || 'TA')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 text-[15px] font-bold text-[#16193a]">
                        {task.title}
                      </h3>
                      {task.projectId && (
                        <p className="mt-0.5 truncate text-xs text-[#707ead]">
                          {projectName}
                        </p>
                      )}
                    </div>
                  </div>

                  {(task.assigneeIds?.length ?? 0) > 0 && (
                    <div className="mt-3 flex -space-x-2">
                      {(task.assigneeIds ?? []).map((id) => {
                        const user = findUser(id);
                        return (
                          <span
                            key={id}
                            title={
                              user
                                ? `${user.name} (${user.role === 'HOD' ? 'Chef' : 'Employé'})`
                                : id
                            }
                            className={`${AVATAR} h-8 w-8 text-[11px] ring-2 ring-white`}
                          >
                            {user ? initials(user.name) : '?'}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <Bar />

                  <div className="flex items-center justify-between gap-2">
                    <Foot>Échéance : {formatDate(task.dueDate)}</Foot>
                    <CardActions
                      onEdit={() => handleEditTask(task)}
                      onAssign={() => handleAssignTask(task)}
                      onDelete={() => void handleDeleteTask(task)}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>

      {modal === 'project' && (
        <NewProjectModal
          departments={departments}
          initialData={editingProject ?? undefined}
          onClose={() => {
            setModal(null);
            setEditingProject(null);
          }}
          onCreated={(project) => {
            setProjects((prev) => {
              const exists = prev.some((p) => p.id === project.id);
              if (exists) {
                return prev.map((p) =>
                  p.id === project.id ? project : p,
                );
              }
              return [project, ...prev];
            });
            setModal(null);
            setEditingProject(null);
          }}
        />
      )}

      {modal === 'task' && (
        <NewTaskModal
          users={users}
          projects={projects}
          initialData={editingTask ?? undefined}
          onClose={() => {
            setModal(null);
            setEditingTask(null);
          }}
          onCreated={(task) => {
            setTasks((previous) => {
              const exists = previous.some((t) => t.id === task.id);
              if (exists) {
                return previous.map((t) =>
                  t.id === task.id ? task : t,
                );
              }
              return [task, ...previous];
            });
            setModal(null);
            setEditingTask(null);
          }}
        />
      )}
    </section>
  );
}