import { apiClient } from "./client";

export type SessionType = "FOCUS" | "REVISION" | "PRACTICE" | "READING" | "OTHER" | "focus" | "revision" | "practice" | "reading" | "other";
export type SessionStatus = "ACTIVE" | "COMPLETED" | "CANCELLED" | "active" | "completed" | "cancelled";

export interface StudySession {
  id: string;
  userId?: string;
  subjectId: string;
  goalId?: string | null;
  taskId?: string | null;
  sessionType: SessionType;
  plannedDuration: number; // in seconds
  actualDuration: number;  // in seconds
  startedAt: string;
  endedAt?: string | null;
  status: SessionStatus;
  sessionIntent?: string | null;
  completionResult?: string | null;
  reflection?: string | null;
  qualityRating?: number | null;
  createdAt: string;
  updatedAt: string;
  subject?: { id: string; name: string; color?: string };
  goal?: { id: string; title: string };
  task?: { id: string; title: string };
}

export interface CreateSessionData {
  subjectId: string;
  goalId?: string;
  taskId?: string;
  sessionType?: SessionType;
  plannedDuration: number; // in seconds
  sessionIntent?: string;
}

export async function getActiveSessionApi(): Promise<StudySession | null> {
  const res = await apiClient<{ session: StudySession | null }>("/study-sessions/active", {
    method: "GET",
  });
  return res.session;
}

export async function fetchStudySessionsApi(filters?: {
  subjectId?: string;
  goalId?: string;
  taskId?: string;
  status?: string;
}): Promise<StudySession[]> {
  const queryParams = new URLSearchParams();
  if (filters?.subjectId) queryParams.append("subjectId", filters.subjectId);
  if (filters?.goalId) queryParams.append("goalId", filters.goalId);
  if (filters?.taskId) queryParams.append("taskId", filters.taskId);
  if (filters?.status) queryParams.append("status", filters.status);

  const queryString = queryParams.toString();
  const endpoint = `/study-sessions${queryString ? `?${queryString}` : ""}`;

  const res = await apiClient<{ sessions: StudySession[] }>(endpoint, {
    method: "GET",
  });
  return res.sessions;
}

export async function getStudySessionApi(id: string): Promise<StudySession> {
  const res = await apiClient<{ session: StudySession }>(`/study-sessions/${id}`, {
    method: "GET",
  });
  return res.session;
}

export async function createStudySessionApi(data: CreateSessionData): Promise<StudySession> {
  const res = await apiClient<{ session: StudySession }>("/study-sessions", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.session;
}

export async function completeStudySessionApi(
  id: string,
  data?: { completionResult?: string; reflection?: string; qualityRating?: number }
): Promise<StudySession> {
  const res = await apiClient<{ session: StudySession }>(`/study-sessions/${id}/complete`, {
    method: "POST",
    body: JSON.stringify(data || {}),
  });
  return res.session;
}

export async function cancelStudySessionApi(id: string): Promise<StudySession> {
  const res = await apiClient<{ session: StudySession }>(`/study-sessions/${id}/cancel`, {
    method: "POST",
  });
  return res.session;
}
