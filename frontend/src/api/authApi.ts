import { apiClient } from "./client";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
}

export async function loginApi(email: string, password: string): Promise<AuthResponse> {
  return apiClient<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function registerApi(email: string, password: string, name: string): Promise<AuthResponse> {
  return apiClient<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
}

export async function getMeApi(): Promise<{ user: UserProfile }> {
  return apiClient<{ user: UserProfile }>("/auth/me", {
    method: "GET",
  });
}
