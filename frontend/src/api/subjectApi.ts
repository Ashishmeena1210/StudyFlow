import { apiClient } from "./client";
import type { Subject, CreateSubjectData } from "../context/subjectcontext";

export async function fetchSubjectsApi(): Promise<Subject[]> {
  const res = await apiClient<{ subjects: Subject[] }>("/subjects", {
    method: "GET",
  });
  return res.subjects;
}

export async function getSubjectApi(id: string): Promise<Subject> {
  const res = await apiClient<{ subject: Subject }>(`/subjects/${id}`, {
    method: "GET",
  });
  return res.subject;
}

export async function createSubjectApi(data: CreateSubjectData): Promise<Subject> {
  const res = await apiClient<{ subject: Subject }>("/subjects", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.subject;
}

export async function updateSubjectApi(
  id: string,
  data: Partial<Subject>
): Promise<Subject> {
  const res = await apiClient<{ subject: Subject }>(`/subjects/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return res.subject;
}

export async function deleteSubjectApi(id: string): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/subjects/${id}`, {
    method: "DELETE",
  });
}
