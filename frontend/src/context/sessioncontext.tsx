/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  getActiveSessionApi,
  fetchStudySessionsApi,
  createStudySessionApi,
  completeStudySessionApi,
  cancelStudySessionApi,
} from "../api/sessionApi";

export type SessionType =
  | "Focus"
  | "Review"
  | "Practice"
  | "Reading"
  | "Revision"
  | "Other"
  | "FOCUS"
  | "REVISION"
  | "PRACTICE"
  | "READING"
  | "OTHER";

export type SessionStatus = "completed" | "cancelled" | "active" | "COMPLETED" | "CANCELLED" | "ACTIVE";
export type CompletionResult = "Yes" | "Partially" | "No";

export interface StudySession {
  id: string;
  subjectId: string;
  subjectName: string;
  goalId?: string;
  goalTitle?: string;
  taskId?: string;
  taskTitle?: string;
  sessionType: SessionType;
  durationMinutes: number; // actual duration
  plannedDuration?: number;
  sessionIntention?: string;
  completionResult?: CompletionResult;
  startedAt: string;
  endedAt?: string;
  date: string; // YYYY-MM-DD
  notes?: string;
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionData {
  subjectId: string;
  subjectName?: string;
  goalId?: string;
  goalTitle?: string;
  taskId?: string;
  taskTitle?: string;
  sessionType: SessionType;
  durationMinutes: number;
  plannedDuration?: number;
  sessionIntent?: string;
  sessionIntention?: string;
  completionResult?: CompletionResult;
  startedAt?: string;
  endedAt?: string;
  date?: string;
  notes?: string;
  status?: SessionStatus;
}

export interface ActiveSessionState {
  id?: string;
  subjectId: string;
  subjectName: string;
  goalId?: string;
  goalTitle?: string;
  taskId?: string;
  taskTitle?: string;
  sessionType: SessionType;
  targetDurationMinutes: number;
  sessionIntention?: string;
  elapsedSeconds: number;
  isPaused: boolean;
  startedAt: string;
}

interface SessionContextType {
  sessions: StudySession[];
  activeSession: ActiveSessionState | null;
  loading: boolean;
  error: string | null;

  startActiveSession: (params: {
    subjectId: string;
    subjectName: string;
    goalId?: string;
    goalTitle?: string;
    taskId?: string;
    taskTitle?: string;
    sessionType: SessionType;
    targetDurationMinutes: number;
    sessionIntention?: string;
  }) => Promise<void>;
  pauseActiveSession: () => void;
  resumeActiveSession: () => void;
  tickActiveSession: () => void;
  finishActiveSession: (reflectionData?: {
    notes?: string;
    completionResult?: CompletionResult;
  }) => Promise<StudySession | null>;
  cancelActiveSession: () => Promise<void>;

  addSession: (data: CreateSessionData) => Promise<StudySession>;
  updateSession: (id: string, data: Partial<StudySession>) => void;
  deleteSession: (id: string) => void;

  getSessionsForSubject: (subjectIdOrName: string) => StudySession[];
  getTotalMinutesForSubject: (subjectIdOrName: string) => number;

  getStudyTimeToday: () => number;
  getSessionsCountToday: () => number;
  getStudyTimeThisWeek: () => number;
  getCurrentStreak: () => number;
  getWeeklyDailyBreakdown: () => { day: string; date: string; minutes: number }[];
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const todayStr = new Date().toISOString().split("T")[0];

const defaultSessions: StudySession[] = [
  {
    id: "sess-1",
    subjectId: "sub-networks",
    subjectName: "Networks",
    goalId: "g1",
    goalTitle: "Master Computer Networks & Protocols",
    taskId: "1",
    taskTitle: "Network Layer Protocols",
    sessionType: "Practice",
    durationMinutes: 45,
    plannedDuration: 50,
    sessionIntention: "Complete 20 subnetting questions",
    completionResult: "Yes",
    startedAt: `${todayStr}T10:30:00.000Z`,
    endedAt: `${todayStr}T11:15:00.000Z`,
    date: todayStr,
    notes: "Completed subnetting exercises and reviewed routing algorithms.",
    status: "completed",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<StudySession[]>(defaultSessions);
  const [activeSession, setActiveSession] = useState<ActiveSessionState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Sync active session and history on mount from backend
  const loadSessionsFromApi = async () => {
    const token = localStorage.getItem("studyflow-token");

    if (!token) {
      const saved = localStorage.getItem("studyflow-sessions");
      if (saved) {
        try {
          setSessions(JSON.parse(saved));
        } catch {
          setSessions(defaultSessions);
        }
      }
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Check for active session
      const backendActive = await getActiveSessionApi();
      if (backendActive) {
        const startTime = new Date(backendActive.startedAt).getTime();
        const elapsed = Math.max(0, Math.floor((Date.now() - startTime) / 1000));

        setActiveSession({
          id: backendActive.id,
          subjectId: backendActive.subjectId,
          subjectName: backendActive.subject?.name || "General",
          goalId: backendActive.goalId || undefined,
          goalTitle: backendActive.goal?.title || undefined,
          taskId: backendActive.taskId || undefined,
          taskTitle: backendActive.task?.title || undefined,
          sessionType: (backendActive.sessionType ? backendActive.sessionType.charAt(0) + backendActive.sessionType.slice(1).toLowerCase() : "Focus") as SessionType,
          targetDurationMinutes: Math.round(backendActive.plannedDuration / 60),
          sessionIntention: backendActive.sessionIntent || undefined,
          elapsedSeconds: elapsed,
          isPaused: false,
          startedAt: backendActive.startedAt,
        });
      } else {
        setActiveSession(null);
      }

      // 2. Fetch recent session history
      const apiSessions = await fetchStudySessionsApi();
      const normalized = apiSessions.map((s: any) => ({
        id: s.id,
        subjectId: s.subjectId,
        subjectName: s.subject?.name || "General",
        goalId: s.goalId || undefined,
        goalTitle: s.goal?.title || undefined,
        taskId: s.taskId || undefined,
        taskTitle: s.task?.title || undefined,
        sessionType: (s.sessionType ? s.sessionType.charAt(0) + s.sessionType.slice(1).toLowerCase() : "Focus") as SessionType,
        durationMinutes: Math.max(1, Math.round(s.actualDuration / 60)),
        plannedDuration: Math.round(s.plannedDuration / 60),
        sessionIntention: s.sessionIntent || undefined,
        completionResult: (s.completionResult || "Yes") as CompletionResult,
        startedAt: s.startedAt,
        endedAt: s.endedAt || undefined,
        date: s.startedAt ? s.startedAt.split("T")[0] : todayStr,
        notes: s.reflection || s.notes || undefined,
        status: (s.status ? s.status.toLowerCase() : "completed") as SessionStatus,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }));

      setSessions(normalized);
    } catch (err: any) {
      console.warn("Failed to load study sessions from backend:", err);
      setError("Unable to load study sessions from server. Displaying cached data.");
      const saved = localStorage.getItem("studyflow-sessions");
      if (saved) {
        try {
          setSessions(JSON.parse(saved));
        } catch {
          setSessions(defaultSessions);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessionsFromApi();
  }, []);

  /*
   * Active Timer Session handlers
   */
  const startActiveSession = async (params: {
    subjectId: string;
    subjectName: string;
    goalId?: string;
    goalTitle?: string;
    taskId?: string;
    taskTitle?: string;
    sessionType: SessionType;
    targetDurationMinutes: number;
    sessionIntention?: string;
  }): Promise<void> => {
    const token = localStorage.getItem("studyflow-token");

    if (token && !params.subjectId.startsWith("sub-")) {
      try {
        const created = await createStudySessionApi({
          subjectId: params.subjectId,
          goalId: params.goalId,
          taskId: params.taskId,
          sessionType: params.sessionType.toUpperCase() as any,
          plannedDuration: params.targetDurationMinutes * 60,
          sessionIntent: params.sessionIntention,
        });

        setActiveSession({
          id: created.id,
          ...params,
          elapsedSeconds: 0,
          isPaused: false,
          startedAt: created.startedAt,
        });
        return;
      } catch (err: any) {
        throw new Error(err.message || "Failed to start active session on server.");
      }
    }

    setActiveSession({
      id: "sess-" + crypto.randomUUID(),
      ...params,
      elapsedSeconds: 0,
      isPaused: false,
      startedAt: new Date().toISOString(),
    });
  };

  const pauseActiveSession = () => {
    setActiveSession((prev) => (prev ? { ...prev, isPaused: true } : null));
  };

  const resumeActiveSession = () => {
    setActiveSession((prev) => (prev ? { ...prev, isPaused: false } : null));
  };

  const tickActiveSession = () => {
    setActiveSession((prev) => {
      if (!prev || prev.isPaused) return prev;
      // Precision timestamp calculation to prevent drift
      const startTime = new Date(prev.startedAt).getTime();
      const actualElapsed = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
      return { ...prev, elapsedSeconds: actualElapsed };
    });
  };

  const finishActiveSession = async (reflectionData?: {
    notes?: string;
    completionResult?: CompletionResult;
  }): Promise<StudySession | null> => {
    if (!activeSession) return null;

    const token = localStorage.getItem("studyflow-token");

    if (token && activeSession.id && !activeSession.id.startsWith("sess-")) {
      try {
        const completed = await completeStudySessionApi(activeSession.id, {
          reflection: reflectionData?.notes,
          completionResult: reflectionData?.completionResult,
        });

        const normalized: StudySession = {
          id: completed.id,
          subjectId: completed.subjectId,
          subjectName: completed.subject?.name || activeSession.subjectName,
          goalId: completed.goalId || undefined,
          goalTitle: completed.goal?.title || activeSession.goalTitle,
          taskId: completed.taskId || undefined,
          taskTitle: completed.task?.title || activeSession.taskTitle,
          sessionType: activeSession.sessionType,
          durationMinutes: Math.max(1, Math.round(completed.actualDuration / 60)),
          plannedDuration: Math.round(completed.plannedDuration / 60),
          sessionIntention: completed.sessionIntent || activeSession.sessionIntention,
          completionResult: reflectionData?.completionResult || "Yes",
          startedAt: completed.startedAt,
          endedAt: completed.endedAt || new Date().toISOString(),
          date: completed.startedAt ? completed.startedAt.split("T")[0] : todayStr,
          notes: reflectionData?.notes?.trim() || undefined,
          status: "completed",
          createdAt: completed.createdAt,
          updatedAt: completed.updatedAt,
        };

        setSessions((prev) => [normalized, ...prev]);
        setActiveSession(null);
        return normalized;
      } catch (err: any) {
        throw new Error(err.message || "Failed to complete study session on server.");
      }
    }

    const elapsedMins = Math.max(1, Math.round(activeSession.elapsedSeconds / 60));
    const now = new Date().toISOString();

    const newSession: StudySession = {
      id: "sess-" + crypto.randomUUID(),
      subjectId: activeSession.subjectId,
      subjectName: activeSession.subjectName,
      goalId: activeSession.goalId,
      goalTitle: activeSession.goalTitle,
      taskId: activeSession.taskId,
      taskTitle: activeSession.taskTitle,
      sessionType: activeSession.sessionType,
      durationMinutes: elapsedMins,
      plannedDuration: activeSession.targetDurationMinutes,
      sessionIntention: activeSession.sessionIntention,
      completionResult: reflectionData?.completionResult || "Yes",
      startedAt: activeSession.startedAt,
      endedAt: now,
      date: now.split("T")[0],
      notes: reflectionData?.notes?.trim() || undefined,
      status: "completed",
      createdAt: now,
      updatedAt: now,
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSession(null);
    return newSession;
  };

  const cancelActiveSession = async (): Promise<void> => {
    if (!activeSession) return;
    const token = localStorage.getItem("studyflow-token");

    if (token && activeSession.id && !activeSession.id.startsWith("sess-")) {
      try {
        await cancelStudySessionApi(activeSession.id);
      } catch (err: any) {
        console.warn("Failed to cancel active session on server:", err);
      }
    }

    setActiveSession(null);
  };

  const addSession = async (data: CreateSessionData): Promise<StudySession> => {
    const now = new Date().toISOString();
    const newSession: StudySession = {
      id: "sess-" + crypto.randomUUID(),
      subjectId: data.subjectId,
      subjectName: data.subjectName || "General",
      goalId: data.goalId,
      goalTitle: data.goalTitle,
      taskId: data.taskId,
      taskTitle: data.taskTitle,
      sessionType: data.sessionType || "Focus",
      durationMinutes: Math.max(1, data.durationMinutes),
      plannedDuration: data.plannedDuration || data.durationMinutes,
      sessionIntention: data.sessionIntention?.trim() || undefined,
      completionResult: data.completionResult || "Yes",
      startedAt: data.startedAt || now,
      endedAt: data.endedAt,
      date: data.date || now.split("T")[0],
      notes: data.notes?.trim() || undefined,
      status: data.status || "completed",
      createdAt: now,
      updatedAt: now,
    };

    setSessions((current) => [newSession, ...current]);
    return newSession;
  };

  const updateSession = (id: string, data: Partial<StudySession>) => {
    setSessions((current) =>
      current.map((s) => (s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString() } : s))
    );
  };

  const deleteSession = (id: string) => {
    setSessions((current) => current.filter((s) => s.id !== id));
  };

  const getSessionsForSubject = (subjectIdOrName: string) => {
    return sessions.filter(
      (s) =>
        s.subjectId === subjectIdOrName ||
        s.subjectName.toLowerCase() === subjectIdOrName.toLowerCase()
    );
  };

  const getTotalMinutesForSubject = (subjectIdOrName: string) => {
    return getSessionsForSubject(subjectIdOrName)
      .filter((s) => s.status === "completed")
      .reduce((acc, s) => acc + s.durationMinutes, 0);
  };

  const getStudyTimeToday = () => {
    const today = new Date().toISOString().split("T")[0];
    return sessions
      .filter((s) => s.date === today && s.status === "completed")
      .reduce((acc, s) => acc + s.durationMinutes, 0);
  };

  const getSessionsCountToday = () => {
    const today = new Date().toISOString().split("T")[0];
    return sessions.filter((s) => s.date === today && s.status === "completed").length;
  };

  const getStudyTimeThisWeek = () => {
    const now = new Date();
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek);
    monday.setHours(0, 0, 0, 0);
    const mondayStr = monday.toISOString().split("T")[0];

    return sessions
      .filter((s) => s.date >= mondayStr && s.status === "completed")
      .reduce((acc, s) => acc + s.durationMinutes, 0);
  };

  const getCurrentStreak = () => {
    const completedDates = new Set(
      sessions.filter((s) => s.status === "completed").map((s) => s.date)
    );

    let streak = 0;
    const checkDate = new Date();
    const today = checkDate.toISOString().split("T")[0];
    if (!completedDates.has(today)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dateStr = checkDate.toISOString().split("T")[0];
      if (completedDates.has(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  const getWeeklyDailyBreakdown = () => {
    const daysName = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const now = new Date();
    const currentDayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1;

    const monday = new Date(now);
    monday.setDate(now.getDate() - currentDayIdx);

    return daysName.map((dayLabel, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const dateStr = d.toISOString().split("T")[0];

      const mins = sessions
        .filter((s) => s.date === dateStr && s.status === "completed")
        .reduce((acc, s) => acc + s.durationMinutes, 0);

      return {
        day: dayLabel,
        date: dateStr,
        minutes: mins,
      };
    });
  };

  return (
    <SessionContext.Provider
      value={{
        sessions,
        activeSession,
        loading,
        error,
        startActiveSession,
        pauseActiveSession,
        resumeActiveSession,
        tickActiveSession,
        finishActiveSession,
        cancelActiveSession,
        addSession,
        updateSession,
        deleteSession,
        getSessionsForSubject,
        getTotalMinutesForSubject,
        getStudyTimeToday,
        getSessionsCountToday,
        getStudyTimeThisWeek,
        getCurrentStreak,
        getWeeklyDailyBreakdown,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSessions() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSessions must be used inside SessionProvider");
  }
  return context;
}
