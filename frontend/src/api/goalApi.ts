import { apiClient } from "./client";
import type { Goal, CreateGoalData } from "../context/goalcontext";

export async function fetchGoalsApi(filters?: {
  subjectId?: string;
  status?: string;
}): Promise<Goal[]> {
  const queryParams = new URLSearchParams();
  if (filters?.subjectId) queryParams.append("subjectId", filters.subjectId);
  if (filters?.status) queryParams.append("status", filters.status);

  const queryString = queryParams.toString();
  const endpoint = `/goals${queryString ? `?${queryString}` : ""}`;

  const res = await apiClient<{ goals: Goal[] }>(endpoint, {
    method: "GET",
  });
  return res.goals;
}

export async function getGoalApi(id: string): Promise<Goal> {
  const res = await apiClient<{ goal: Goal }>(`/goals/${id}`, {
    method: "GET",
  });
  return res.goal;
}

export async function createGoalApi(data: CreateGoalData): Promise<Goal> {
  const res = await apiClient<{ goal: Goal }>("/goals", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.goal;
}

export async function updateGoalApi(
  id: string,
  data: Partial<Goal>
): Promise<Goal> {
  const res = await apiClient<{ goal: Goal }>(`/goals/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return res.goal;
}

export async function deleteGoalApi(id: string): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/goals/${id}`, {
    method: "DELETE",
  });
}
