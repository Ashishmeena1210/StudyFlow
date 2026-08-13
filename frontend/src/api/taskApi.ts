import { apiClient } from "./client";
import type { Task, CreateTaskData } from "../context/taskcontext";

export async function fetchTasksApi(filters?: {
  subjectId?: string;
  goalId?: string;
  status?: string;
  priority?: string;
}): Promise<Task[]> {
  const queryParams = new URLSearchParams();
  if (filters?.subjectId) queryParams.append("subjectId", filters.subjectId);
  if (filters?.goalId) queryParams.append("goalId", filters.goalId);
  if (filters?.status) queryParams.append("status", filters.status);
  if (filters?.priority) queryParams.append("priority", filters.priority);

  const queryString = queryParams.toString();
  const endpoint = `/tasks${queryString ? `?${queryString}` : ""}`;

  const res = await apiClient<{ tasks: Task[] }>(endpoint, {
    method: "GET",
  });
  return res.tasks;
}

export async function getTaskApi(id: string): Promise<Task> {
  const res = await apiClient<{ task: Task }>(`/tasks/${id}`, {
    method: "GET",
  });
  return res.task;
}

export async function createTaskApi(data: CreateTaskData): Promise<Task> {
  const res = await apiClient<{ task: Task }>("/tasks", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.task;
}

export async function updateTaskApi(
  id: string,
  data: Partial<Task>
): Promise<Task> {
  const res = await apiClient<{ task: Task }>(`/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return res.task;
}

export async function deleteTaskApi(id: string): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/tasks/${id}`, {
    method: "DELETE",
  });
}
