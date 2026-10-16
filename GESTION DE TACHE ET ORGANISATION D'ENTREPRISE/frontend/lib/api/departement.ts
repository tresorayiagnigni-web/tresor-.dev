import { apiFetch } from "./api";

export async function getDepartements() {
  return apiFetch("/departements");
}

export async function createDepartement(data: any) {
  return apiFetch("/departments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// export async function updateDepartement(id: number, data: any) {
//   return apiFetch(`/departments/${id}`, {
//     method: "PATCH",
//     body: JSON.stringify(data),
//   });
// }
// lib/actions/departmentActions.ts  (ou ton fichier api)

export async function updateDepartement(
  id: number,
  data: {
    nom_departement?: string;
    description?: string;
    chef_DepartementId?: number | null;
  },
) {
  // 1. Mettre à jour nom / description
  const result = await apiFetch(`/departements/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      nom_departement: data.nom_departement,
      description: data.description,
    }),
  });

  // 2. Si un chef est choisi → route dédiée
  if (data.chef_DepartementId) {
    await apiFetch(`/departements/${id}/chef`, {
      method: "PATCH",
      body: JSON.stringify({
        chef_DepartementId: data.chef_DepartementId,
      }),
    });
  }

  return result;
}

export async function deleteDepartement(id: number) {
  return apiFetch(`/departments/${id}`, {
    method: "DELETE",
  });
}

export async function assignChefDepartement(
  departementId: number,
  chef_DepartementId: number,
) {
  return apiFetch(`/departements/${departementId}/chef`, {
    method: "PATCH",
    body: JSON.stringify({ chef_DepartementId }),
  });
}