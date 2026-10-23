"use client";

import { useMemo, useState } from "react";
import { type Task } from '@/lib/actions/taskActions';
import type { Project, UserLite } from "@/lib/actions/projectActions";
import { CheckList, Field, Modal, inputClass } from "./ui";
import { createTask } from "@/lib/actions/taskActions";

type TaskPriority = "Bas" | "Moyen" | "Elevee";

export default function CreateTaskModal({
  users,
  projects,
  onClose,
  onCreated,
}: {
  users: UserLite[];
  projects: Project[];
  onClose: () => void;
  onCreated: (task: Task) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const assignable = useMemo(
    () =>
      users
        .filter((user) => user.role !== "ADMIN")
        .sort((a, b) =>
          a.role === b.role
            ? a.name.localeCompare(b.name)
            : a.role === "HOD"
              ? -1
              : 1,
        )
        .map((user) => ({
          id: user.id,
          label: user.name,
          hint: user.email,
          badge: user.role === "HOD" ? "Chef" : "Employé",
        })),
    [users],
  );

  async function submit() {
    if (!title.trim()) {
      setError("Donnez un titre à la tâche.");
      return;
    }

    if (!assigneeIds.length) {
      setError("Assignez la tâche à au moins une personne.");
      return;
    }

    if (projectId && !projects.some((project) => Number(project.id) === Number(projectId))) {
      setError("Le projet sélectionné n'est plus disponible.");
      return;
    }

    const userId = Number(assigneeIds[0]);

    if (!Number.isInteger(userId) || userId <= 0) {
      setError("Le membre sélectionné est invalide.");
      return;
    }

    setError("");
    setLoading(true);

    const priorityMap: Record<"LOW" | "MEDIUM" | "HIGH", TaskPriority> = {
      LOW: "Bas",
      MEDIUM: "Moyen",
      HIGH: "Elevee",
    };

    try {
      const response = await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        userId,
        priorite: priorityMap[priority],
        Date_limite: dueDate || undefined,
        projectId: projectId ? Number(projectId) : null,
        status: "A_faire",
      });

      if (!response.success || !response.data) {
        throw new Error(
          response.message || "La tâche n'a pas pu être créée.",
        );
      }

      onCreated(response.data as Task);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Création impossible.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      title="Nouvelle tâche"
      subtitle="Associez la tâche à un projet et assignez-la à un membre."
      onClose={onClose}
    >
      <Field label="Titre">
        <input
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex. Développer la page de connexion"
          required
          disabled={loading}
        />
      </Field>

      <Field label="Description">
        <textarea
          rows={3}
          className={inputClass}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Décrivez le travail à réaliser..."
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

          {projects.length === 0 && (
            <p className="mt-1 text-xs text-amber-600">
              Aucun projet disponible.
            </p>
          )}
        </Field>

        <Field label="Priorité">
          <select
            className={inputClass}
            value={priority}
            onChange={(e) =>
              setPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH")
            }
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

      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        Assigner à
      </span>

      <CheckList
        items={assignable}
        selected={assigneeIds}
        onChange={setAssigneeIds}
        searchable
      />

      {assigneeIds.length > 1 && (
        <p className="mt-1 text-xs text-amber-600">
          Ton backend utilise actuellement un seul userId :
          seul le premier membre sélectionné sera assigné.
        </p>
      )}

      {error && (
        <p role="alert" className="mb-3 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60"
        >
          Annuler
        </button>

        <button
          type="button"
          onClick={submit}
          disabled={loading || !title.trim() || assigneeIds.length === 0}
          className="rounded-xl bg-[#0A1628] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Création…" : "Créer la tâche"}
        </button>
      </div>
    </Modal>
  );
}
