import { apiFetch } from "./api";

export function getUsers() {
  return apiFetch("/users");
}

export function getUser(id: number) {
  return apiFetch(`/users/${id}`);
}

export function createUser(data: any) {
  return apiFetch("/users/employee", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateUser(id: number, data: any) {
  return apiFetch(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteUser(id: number) {
  return apiFetch(`/users/${id}`, {
    method: "DELETE",
  });
}