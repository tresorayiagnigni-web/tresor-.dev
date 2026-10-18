'use client';

import { useEffect, useState } from 'react';
import {
  createProject,
  updateProject,
} from '@/lib/actions/projectActions';
import type {
  Department,
  Project,
} from '@/lib/actions/projectActions';
import {
  BTN_PRIMARY,
  CheckList,
  Field,
  Modal,
  inputClass,
} from './ui';

interface NewProjectModalProps {
  departments: Department[];
  onClose: () => void;
  onCreated: (project: Project) => void;
  initialData?: Project;
}

export default function NewProjectModal({
  departments,
  onClose,
  onCreated,
  initialData,
}: NewProjectModalProps) {
  const isEdit = Boolean(initialData?.id);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [departmentIds, setDepartmentIds] = useState<string[]>([]);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Préremplir si édition
  useEffect(() => {
    if (!initialData) return;

    setName(initialData.name ?? '');
    setDescription(initialData.description ?? '');
    setDueDate(
      initialData.dueDate ? initialData.dueDate.slice(0, 10) : '',
    );
    setDepartmentIds(
      initialData.departmentIds?.map(String) ??
        (initialData.departementId
          ? [String(initialData.departementId)]
          : []),
    );
  }, [initialData]);

  async function submit() {
    if (loading) return;

    if (!name.trim()) {
      setError('Donnez un nom au projet.');
      return;
    }

    if (departmentIds.length === 0) {
      setError('Choisissez au moins un département.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        // departmentIds,
        ...(departmentIds[0]
        ? { departementId: Number(departmentIds[0]) }
        : {}),
        dueDate: dueDate || null,
    };

    const result = isEdit
    ? await updateProject(String(initialData!.id), payload)
    : await createProject(payload as any);

    if (!result.success || !result.data) {
       setError(
          result.message ||
          (isEdit
          ? 'La modification du projet a échoué.'
          : 'La création du projet a échoué.'),
      );
       return;
    }

    onCreated(result.data);
    onClose();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : isEdit
            ? 'Modification impossible.'
            : 'Création impossible.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      title={isEdit ? 'Modifier le projet' : 'Nouveau projet'}
      subtitle={
        isEdit
          ? 'Mettez à jour les informations du projet.'
          : 'Un projet est assigné à un ou plusieurs départements.'
      }
      onClose={onClose}
    >
      <Field label="Nom du projet">
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex. Déploiement du système Mendo"
          maxLength={150}
          disabled={loading}
        />
      </Field>

      <Field label="Description">
        <textarea
          rows={3}
          className={inputClass}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Décrivez les objectifs du projet..."
          disabled={loading}
        />
      </Field>

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
        Départements
      </span>

      {departments.length > 0 ? (
        <CheckList
          items={departments.map((department) => ({
            id: department.id,
            label: department.name,
          }))}
          selected={departmentIds}
          onChange={setDepartmentIds}
        />
      ) : (
        <p className="text-sm text-gray-500">
          Aucun département disponible.
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
          disabled={loading || departments.length === 0}
          className={BTN_PRIMARY}
        >
          {loading
            ? isEdit
              ? 'Enregistrement…'
              : 'Création…'
            : isEdit
              ? 'Enregistrer'
              : 'Créer le projet'}
        </button>
      </div>
    </Modal>
  );
}