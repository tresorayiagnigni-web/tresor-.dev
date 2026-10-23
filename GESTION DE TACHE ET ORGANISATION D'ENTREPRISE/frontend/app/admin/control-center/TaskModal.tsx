
'use client';

import { useMemo, useState } from 'react';
import type { UserLite, Project, Task } from '@/lib/actions/projectActions';
import {
  createTask,
  type Task as ApiTask,
  type TaskPriority,
} from '@/lib/actions/taskActions';
import { BTN_PRIMARY, CheckList, Field, Modal, inputClass } from './ui';

interface NewTaskModalProps {
  users: UserLite[];
  projects: Project[];
  onClose: () => void;
  onCreated: (task: Task) => void;
  initialData?: Task;
}

type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

const priorityToApi: Record<Priority, TaskPriority> = {
  LOW: 'Bas',
  MEDIUM: 'Moyen',
  HIGH: 'Elevee',
};

function toUiTask(
  task: ApiTask,
  projectId: string,
  assigneeIds: string[],
  priority: Priority,
  dueDate: string,
): Task {
  return {
    id: String(task.id ?? ''),
    title: task.title,
    description: task.description ?? '',
    // projectId: projectId || null,
    projectId:
    projectId !== null && projectId !== ""
    ? Number(projectId)
    : undefined,
    assigneeIds,
    priority,
    dueDate: dueDate || task.Date_limite || null,
    status:
      task.status === 'Terminer'
        ? 'COMPLETED'
        : task.status === 'En_cours'
          ? 'IN_PROGRESS'
          : 'TODO',
  };
}

export default function NewTaskModal({
  users,
  projects,
  onClose,
  onCreated,
}: NewTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const assignable = useMemo(
    () =>
      users
        .filter((user) => user.role !== 'ADMIN')
        .sort((a, b) => {
          if (a.role !== b.role) {
            return a.role === 'HOD' ? -1 : 1;
          }

          return a.name.localeCompare(b.name);
        })
        .map((user) => ({
          id: user.id,
          label: user.name,
          hint: user.email,
          badge: user.role === 'HOD' ? 'Chef' : 'Employé',
        })),
    [users],
  );

  async function submit() {
    if (loading) return;

    if (!title.trim()) {
      setError('Donnez un titre à la tâche.');
      return;
    }

    if (assigneeIds.length === 0) {
      setError('Assignez la tâche à au moins une personne.');
      return;
    }

    // L'API actuelle accepte un seul userId.
    // On évite de prétendre que plusieurs assignations sont enregistrées.
    if (assigneeIds.length > 1) {
      setError(
        "L'API actuelle accepte un seul responsable par tâche. Sélectionnez une seule personne.",
      );
      return;
    }

    const userId = Number(assigneeIds[0]);

    if (!Number.isInteger(userId) || userId <= 0) {
      setError("L'identifiant de l'utilisateur sélectionné est invalide.");
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await createTask({
        title: title.trim(),
        description: description.trim(),
        userId,
        priorite: priorityToApi[priority],
        Date_limite: dueDate || undefined,
      });

      if (!result.success || !result.data) {
        setError(result.message || 'La création de la tâche a échoué.');
        return;
      }

      const createdTask = toUiTask(
        result.data,
        projectId,
        assigneeIds,
        priority,
        dueDate,
      );

      onCreated(createdTask);
      onClose();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Création impossible.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      title="Nouvelle tâche"
      subtitle="Assignez la tâche à un employé ou à un chef de département."
      onClose={onClose}
    >
      <Field label="Titre">
        <input
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre de la tâche"
          disabled={loading}
        />
      </Field>

      <Field label="Description">
        <textarea
          rows={3}
          className={inputClass}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description de la tâche"
          disabled={loading}
        />
      </Field>

      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <Field label="Projet">
          <select
            className={inputClass}
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            disabled={loading}
          >
            <option value="">Aucun projet</option>

            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Priorité">
          <select
            className={inputClass}
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            disabled={loading}
          >
            <option value="LOW">Basse</option>
            <option value="MEDIUM">Moyenne</option>
            <option value="HIGH">Haute</option>
          </select>
        </Field>
      </div>

      <Field label="Date limite">
        <input
          type="date"
          className={inputClass}
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          disabled={loading}
        />
      </Field>

      <span className="mb-1.5 block text-sm font-semibold text-[#16193a]">
        Assigner à
      </span>

      {assignable.length > 0 ? (
        <CheckList
          items={assignable}
          selected={assigneeIds}
          onChange={setAssigneeIds}
          searchable
        />
      ) : (
        <p className="text-sm text-gray-500">
          Aucun employé ou chef de département disponible.
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="mb-3 text-sm font-semibold text-[#fb2c36]"
        >
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#6b73a8] hover:bg-[#f4f5fb] disabled:opacity-50"
        >
          Annuler
        </button>

        <button
          type="button"
          onClick={submit}
          disabled={loading || assignable.length === 0}
          className={BTN_PRIMARY}
        >
          {loading ? 'Création…' : 'Créer la tâche'}
        </button>
      </div>
    </Modal>
  );
}
