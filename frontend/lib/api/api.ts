const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
) {
  if (!API_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_URL n'est pas défini dans .env.local",
    );
  }

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",

      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),

      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message || "Erreur lors de la requête",
    );
  }

  return data;
}