import { apiFetch } from "./api";

export function getTasks() {
  return apiFetch("/tasks");
}

export function createTask(data: any) {
  return apiFetch("/tasks", {
    method: "POST",
    body: JSON.stringify(data),
  });
}