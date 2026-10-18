"use client";

// =====================================================================
// components/admin/CreateProjectModal.tsx
// Formulaire de création d'un projet par l'administrateur.
// Un projet est assigné à un ou plusieurs départements.
// =====================================================================

import { useState } from "react";
import { createProject } from "@/lib/workApi";
import type { Department, Project } from "@/types/work";
import { CheckList, Field, Modal, NAVY, inputClass } from "./ui";

export default function CreateProjectModal({
  departments, // la liste des départements à proposer
  onClose, // appelée pour fermer la modale
  onCreated, // appelée avec le projet créé (le parent met sa liste à jour)
}: {
  departments: Department[];
  onClose: () => void;
  onCreated: (project: Project) => void;
}) {
  // --- État du formulaire : une variable par champ ----------------------
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [departmentIds, setDepartmentIds] = useState<string[]>([]);

  // --- État de l'interface ---------------------------------------------
  const [error, setError] = useState(""); // message d'erreur affiché
  const [loading, setLoading] = useState(false); // bloque le bouton pendant l'envoi

  // --- Envoi du formulaire ---------------------------------------------
  async function submit() {
    // 1) Validation côté client : on s'arrête dès qu'une règle échoue.
    if (!name.trim()) return setError("Donnez un nom au projet.");
    if (departmentIds.length === 0) return setError("Choisissez au moins un département.");

    setError("");
    setLoading(true);
    try {
      // 2) Appel au backend.
      const project = await createProject({
        name: name.trim(),
        description: description.trim(),
        departmentIds,
        dueDate: dueDate || null, // champ vide => null
      });
      // 3) Succès : on prévient le parent puis on ferme la fenêtre.
      onCreated(project);
      onClose();
    } catch (e) {
      // 4) Échec : on affiche le message renvoyé par le serveur.
      setError(e instanceof Error ? e.message : "Création impossible.");
    } finally {
      // Dans tous les cas, on réactive le bouton.
      setLoading(false);
    }
  }

  return (
    <Modal
      title="Nouveau projet"
      subtitle="Un projet est assigné à un ou plusieurs départements."
      onClose={onClose}
    >
      <Field label="Nom du projet">
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
      </Field>

      <Field label="Description">
        <textarea
          rows={3}
          className={inputClass}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>

      <Field label="Date limite">
        <input
          type="date"
          className={inputClass}
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </Field>

      {/* Choix des départements : on transforme chaque Department en CheckItem */}
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">Départements</span>
      <CheckList
        items={departments.map((d) => ({ id: d.id, label: d.name }))}
        selected={departmentIds}
        onChange={setDepartmentIds}
      />

      {/* Message d'erreur (role="alert" => annoncé par les lecteurs d'écran) */}
      {error && (
        <p role="alert" className="mb-3 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      {/* Boutons d'action */}
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
          {loading ? "Création…" : "Créer le projet"}
        </button>
      </div>
    </Modal>
  );
}
