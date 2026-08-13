const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("studyflow-token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `API Error: ${response.statusText}`);
    (error as any).status = response.status;
    (error as any).data = data;
    throw error;
  }

  return data as T;
}

export default apiClient;
