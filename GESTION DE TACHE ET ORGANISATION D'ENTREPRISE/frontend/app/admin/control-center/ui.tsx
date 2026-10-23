"use client";

import { ReactNode, useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import type { Priority, WorkStatus } from "@/lib/actions/projectActions";
// Vérifiez le fichier d’export (ex. ui/colors.ts, ui/theme.ts, etc.)
// et remplacez par le nom exact existant, par exemple :

// Mapping des statuts → colonnes + couleurs (adapté à ton STATUS_META)


// --- Classes réutilisables (identiques au style de votre dashboard) ----
export const BTN_PRIMARY =
  "inline-flex items-center gap-2 rounded-xl bg-[#263a81] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#3c4e8e] disabled:opacity-60";
export const BTN_SECONDARY =
  "inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#263a81] shadow-sm ring-1 ring-[#e9ebf2] transition hover:bg-[#f4f5fb]";
export const CARD = "rounded-2xl bg-white p-4 shadow-[0_2px_14px_rgba(38,58,129,0.07)]";
export const CHIP =
  "inline-flex items-center gap-1.5 rounded-full bg-[#e9ebf2] px-2.5 py-1 text-[11px] font-bold text-[#263a81]";
export const AVATAR =
  "flex items-center justify-center rounded-full bg-gradient-to-br from-[#4254b3] to-[#304393] font-bold text-white";
export const inputClass =
  "w-full rounded-xl border border-[#e5e7eb] bg-white px-3 py-2.5 text-sm text-[#16193a] outline-none transition placeholder:text-[#6b73a8]/60 focus:border-[#263a81] focus:ring-2 focus:ring-[#263a81]/20";

// --- Couleurs des statuts et priorités (points colorés) ------------------
export const STATUS_META: Record<WorkStatus, { label: string; dot: string }> = {
  TODO: { label: "À faire", dot: "bg-[#a9b3e8]" },
  IN_PROGRESS: { label: "En cours", dot: "bg-[#5a6bc4]" },
  COMPLETED: { label: "Terminé", dot: "bg-[#263a81]" },
};
export const PRIORITY_META: Record<Priority, { label: string; dot: string }> = {
  LOW: { label: "Basse", dot: "bg-[#a9b3e8]" },
  MEDIUM: { label: "Moyenne", dot: "bg-[#3b95e6]" },
  HIGH: { label: "Haute", dot: "bg-[#fb2c36]" }, // même rouge que le point de notification
};

// Chip avec un point de couleur devant (ex. "● En cours").
export function DotChip({ dot, children }: { dot: string; children: ReactNode }) {
  return (
    <span className={CHIP}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------
// Modal : fond assombri + boîte blanche. Échap ou clic dehors = fermer.
// ---------------------------------------------------------------------
export function Modal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#16193a]/40 p-4"
      onMouseDown={onClose}
    >
      {/* stopPropagation : un clic DANS la boîte ne ferme pas la modale */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#16193a]">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-[#6b7280]">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-full bg-[#f4f5fb] p-1.5 text-[#263a81] hover:bg-[#e9ebf2]"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Libellé + champ (le <label> rend le libellé cliquable).
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="mb-4 block">
      <span className="mb-1.5 block text-sm font-semibold text-[#16193a]">{label}</span>
      {children}
    </label>
  );
}

export interface CheckItem {
  id: string;
  label: string;
  hint?: string;
  badge?: string;
}

// ---------------------------------------------------------------------
// CheckList : sélection multiple (+ recherche optionnelle).
// Le parent garde la liste `selected` et la modifie via `onChange`.
// ---------------------------------------------------------------------
export function CheckList({
  items,
  selected,
  onChange,
  searchable,
}: {
  items: CheckItem[];
  selected: string[];
  onChange: (ids: string[]) => void;
  searchable?: boolean;
}) {
  const [q, setQ] = useState("");

  // Filtre sur le nom et l'email, sans tenir compte des majuscules.
  const shown = items.filter((i) =>
    `${i.label} ${i.hint ?? ""}`.toLowerCase().includes(q.toLowerCase())
  );

  // Coche/décoche : retire l'id s'il est présent, sinon l'ajoute.
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);

  return (
    <div className="mb-4 rounded-xl border border-[#e5e7eb]">
      {searchable && (
        <div className="flex items-center gap-2 border-b border-[#e9ebf2] px-3 py-2">
          <Search size={15} className="text-[#6b73a8]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher…"
            className="w-full bg-transparent text-sm text-[#16193a] outline-none"
          />
        </div>
      )}
      <ul className="max-h-48 overflow-y-auto p-1">
        {shown.length === 0 && <li className="px-3 py-3 text-sm text-[#6b73a8]">Aucun résultat.</li>}
        {shown.map((i) => (
          <li key={i.id}>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-[#f4f5fb]">
              <input
                type="checkbox"
                checked={selected.includes(i.id)}
                onChange={() => toggle(i.id)}
                className="h-4 w-4 accent-[#263a81]"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-[#16193a]">{i.label}</span>
                {i.hint && <span className="block truncate text-xs text-[#707ead]">{i.hint}</span>}
              </span>
              {i.badge && <span className={CHIP}>{i.badge}</span>}
            </label>
          </li>
        ))}
      </ul>
      <div className="border-t border-[#e9ebf2] px-3 py-1.5 text-xs font-semibold text-[#6b73a8]">
        {selected.length} sélectionné(s)
      </div>
    </div>
  );
}
