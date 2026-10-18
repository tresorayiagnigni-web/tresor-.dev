"use client";

// =====================================================================
// components/admin/CreateTaskModal.tsx
// Formulaire de création d'une tâche par l'administrateur.
// La tâche peut être assignée à n'importe quel employé ou chef de
// département (HOD), sans distinction.
// =====================================================================

import { useMemo, useState } from "react";
import { createTask } from "@/lib/actions/projectActions";
import type { Priority, Project, Task, UserLite } from "@/lib/actions/projectActions";
import { CheckList, Field, Modal, NAVY, inputClass } from "./ui";

export default function CreateTaskModal({
  users, // tous les utilisateurs du système
  projects, // projets existants (pour rattacher la tâche à l'un d'eux)
  onClose,
  onCreated,
}: {
  users: UserLite[];
  projects: Project[];
  onClose: () => void;
  onCreated: (task: Task) => void;
}) {
  // --- État du formulaire ----------------------------------------------
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState(""); // "" = aucun projet
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);

  // --- État de l'interface ---------------------------------------------
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Prépare la liste des personnes assignables.
  // useMemo : on ne recalcule que si `users` change (pas à chaque frappe).
  const assignable = useMemo(
    () =>
      users
        // 1) On exclut l'administrateur : il crée les tâches, il ne les reçoit pas.
        .filter((u) => u.role !== "ADMIN")
        // 2) Tri : les chefs (HOD) d'abord, puis ordre alphabétique.
        .sort((a, b) =>
          a.role === b.role ? a.name.localeCompare(b.name) : a.role === "HOD" ? -1 : 1
        )
        // 3) Conversion au format attendu par CheckList, avec un badge de rôle.
        .map((u) => ({
          id: u.id,
          label: u.name,
          hint: u.email,
          badge: u.role === "HOD" ? "Chef" : "Employé",
        })),
    [users]
  );

  // --- Envoi du formulaire ---------------------------------------------
  async function submit() {
    // Validation côté client.
    if (!title.trim()) return setError("Donnez un titre à la tâche.");
    if (assigneeIds.length === 0) return setError("Assignez la tâche à au moins une personne.");

    setError("");
    setLoading(true);
    try {
      const task = await createTask({
        title: title.trim(),
        description: description.trim(),
        projectId: projectId || null, // "" => null (pas de projet)
        assigneeIds,
        priority,
        dueDate: dueDate || null,
      });
      onCreated(task); // le parent ajoute la tâche à sa liste
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Création impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      title="Nouvelle tâche"
      subtitle="Assignez-la à des employés ou des chefs de département."
      onClose={onClose}
    >
      <Field label="Titre">
        <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>

      <Field label="Description">
        <textarea
          rows={3}
          className={inputClass}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>

      {/* Projet et priorité côte à côte (une colonne sur mobile) */}
      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <Field label="Projet">
          <select
            className={inputClass}
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">Aucun projet</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Priorité">
          <select
            className={inputClass}
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
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
        />
      </Field>

      {/* Choix des personnes, avec barre de recherche */}
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">Assigner à</span>
      <CheckList items={assignable} selected={assigneeIds} onChange={setAssigneeIds} searchable />

      {error && (
        <p role="alert" className="mb-3 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
        >
          Annuler
        </button>
        <button
          onClick={submit}
          disabled={loading}
          className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${NAVY}`}
        >
          {loading ? "Création…" : "Créer la tâche"}
        </button>
      </div>
    </Modal>
  );
}
