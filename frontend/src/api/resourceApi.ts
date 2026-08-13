import { apiClient } from "./client";
import type { Resource, ResourceType } from "../context/resourcecontext";

export async function fetchResourcesApi(filters?: {
  subjectId?: string;
  goalId?: string;
  taskId?: string;
  type?: string;
  isSaved?: boolean;
  isFavorite?: boolean;
}): Promise<Resource[]> {
  const queryParams = new URLSearchParams();
  if (filters?.subjectId) queryParams.append("subjectId", filters.subjectId);
  if (filters?.goalId) queryParams.append("goalId", filters.goalId);
  if (filters?.taskId) queryParams.append("taskId", filters.taskId);
  if (filters?.type) queryParams.append("type", filters.type);
  if (filters?.isSaved !== undefined) queryParams.append("isSaved", String(filters.isSaved));
  if (filters?.isFavorite !== undefined) queryParams.append("isFavorite", String(filters.isFavorite));

  const queryString = queryParams.toString();
  const endpoint = `/resources${queryString ? `?${queryString}` : ""}`;

  const res = await apiClient<{ resources: Resource[] }>(endpoint, {
    method: "GET",
  });
  return res.resources;
}

export async function getResourceApi(id: string): Promise<Resource> {
  const res = await apiClient<{ resource: Resource }>(`/resources/${id}`, {
    method: "GET",
  });
  return res.resource;
}

export async function createResourceApi(data: {
  subjectId: string;
  goalId?: string;
  taskId?: string;
  title: string;
  description?: string;
  url: string;
  type?: ResourceType;
  source?: string;
  isSaved?: boolean;
  isFavorite?: boolean;
}): Promise<Resource> {
  const res = await apiClient<{ resource: Resource }>("/resources", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.resource;
}

export async function updateResourceApi(
  id: string,
  data: Partial<Resource>
): Promise<Resource> {
  const res = await apiClient<{ resource: Resource }>(`/resources/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return res.resource;
}

export async function deleteResourceApi(id: string): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/resources/${id}`, {
    method: "DELETE",
  });
}

export async function saveResourceApi(id: string, isSaved?: boolean): Promise<Resource> {
  const res = await apiClient<{ resource: Resource }>(`/resources/${id}/save`, {
    method: "POST",
    body: JSON.stringify({ isSaved }),
  });
  return res.resource;
}

export async function favoriteResourceApi(id: string, isFavorite?: boolean): Promise<Resource> {
  const res = await apiClient<{ resource: Resource }>(`/resources/${id}/favorite`, {
    method: "POST",
    body: JSON.stringify({ isFavorite }),
  });
  return res.resource;
}

export async function openResourceApi(id: string): Promise<Resource> {
  const res = await apiClient<{ resource: Resource }>(`/resources/${id}/open`, {
    method: "PATCH",
  });
  return res.resource;
}

export async function searchResourcesApi(query: {
  subject: string;
  topic?: string;
  type?: string;
}): Promise<any[]> {
  const queryParams = new URLSearchParams();
  queryParams.append("subject", query.subject);
  if (query.topic) queryParams.append("topic", query.topic);
  if (query.type) queryParams.append("type", query.type);

  const res = await apiClient<{ results: any[] }>(`/resources/search?${queryParams.toString()}`, {
    method: "GET",
  });
  return res.results;
}
