// // const API_URL = "http://localhost:3001";

// import { apiFetch } from "./api";

// export function login(email: string, password: string) {
//   return apiFetch("/auth/login", {
//     method: "POST",
//     body: JSON.stringify({
//       email,
//       password,
//     }),
//   });
// }

// export function register(data: any) {
//   return apiFetch("/auth/register", {
//     method: "POST",
//     body: JSON.stringify(data),
//   });
// }

import { apiFetch } from "./api";

export async function login(email: string, password: string) {
  const data = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (data.token) {
    localStorage.setItem("token", data.token);
  }

  return data;
}