/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Priority } from "./taskcontext";
import {
  fetchGoalsApi,
  createGoalApi,
  updateGoalApi,
  deleteGoalApi,
} from "../api/goalApi";

export interface Goal {
  id: string;
  title: string;
  description?: string;
  subject: string;
  subjectId: string;
  targetDate?: string;
  priority?: Priority;
  progress?: number;
  status: "active" | "completed" | "on_track" | "at_risk" | "behind" | "ACTIVE" | "COMPLETED";
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalData {
  title: string;
  description?: string;
  subject?: string;
  subjectId: string;
  targetDate?: string;
  priority?: Priority;
  color?: string;
  progress?: number;
}

interface GoalContextType {
  goals: Goal[];
  loading: boolean;
  error: string | null;
  refreshGoals: () => Promise<void>;
  addGoal: (data: CreateGoalData) => Promise<Goal>;
  updateGoal: (id: string, data: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  getGoal: (id: string) => Goal | undefined;
}

const GoalContext = createContext<GoalContextType | undefined>(undefined);

const defaultGoals: Goal[] = [
  {
    id: "g1",
    title: "Master Computer Networks & Protocols",
    description: "Cover OSI model, TCP/IP, subnetting, routing algorithms, and network security.",
    subject: "Networks",
    subjectId: "sub-networks",
    targetDate: new Date(Date.now() + 86400000 * 14).toISOString().split("T")[0],
    priority: "high",
    progress: 50,
    status: "active",
    color: "#06B6D4",
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: "g2",
    title: "Calculus & Advanced Integration",
    description: "Complete all exercise chapters on integration techniques, series, and differential equations.",
    subject: "Mathematics",
    subjectId: "sub-math",
    targetDate: new Date(Date.now() + 86400000 * 20).toISOString().split("T")[0],
    priority: "medium",
    progress: 0,
    status: "active",
    color: "#8B5CF6",
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
];

export function GoalProvider({ children }: { children: ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>(defaultGoals);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadGoalsFromApi = async () => {
    const token = localStorage.getItem("studyflow-token");

    if (!token) {
      const saved = localStorage.getItem("studyflow-goals");
      if (saved) {
        try {
          setGoals(JSON.parse(saved));
        } catch {
          setGoals(defaultGoals);
        }
      }
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const apiGoals = await fetchGoalsApi();
      const normalized = apiGoals.map((g: any) => ({
        ...g,
        subject: g.subject?.name || g.subject || "General",
        status: (g.status ? g.status.toLowerCase() : "active") as any,
      }));
      setGoals(normalized);
    } catch (err: any) {
      console.warn("Failed to load goals from API, using fallback:", err);
      setError("Unable to load goals from server. Displaying cached data.");
      const saved = localStorage.getItem("studyflow-goals");
      if (saved) {
        try {
          setGoals(JSON.parse(saved));
        } catch {
          setGoals(defaultGoals);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoalsFromApi();
  }, []);

  const addGoal = async (data: CreateGoalData): Promise<Goal> => {
    const token = localStorage.getItem("studyflow-token");

    if (token) {
      try {
        const created: any = await createGoalApi(data);
        const normalized: Goal = {
          ...created,
          subject: created.subject?.name || data.subject || "General",
          status: (created.status ? created.status.toLowerCase() : "active") as any,
        };
        setGoals((prev) => [normalized, ...prev]);
        return normalized;
      } catch (err: any) {
        throw new Error(err.message || "Failed to create goal on server.");
      }
    }

    const now = new Date().toISOString();
    const newGoal: Goal = {
      id: "goal-" + crypto.randomUUID(),
      ...data,
      subject: data.subject || "General",
      description: data.description || "",
      progress: data.progress || 0,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };

    setGoals((current) => [newGoal, ...current]);
    localStorage.setItem("studyflow-goals", JSON.stringify([newGoal, ...goals]));
    return newGoal;
  };

  const updateGoal = async (id: string, data: Partial<Goal>): Promise<void> => {
    const token = localStorage.getItem("studyflow-token");

    if (token && !id.startsWith("goal-") && id !== "g1" && id !== "g2") {
      try {
        const updated: any = await updateGoalApi(id, data);
        const normalized: Goal = {
          ...updated,
          subject: updated.subject?.name || data.subject || "General",
          status: (updated.status ? updated.status.toLowerCase() : "active") as any,
        };
        setGoals((current) => current.map((g) => (g.id === id ? normalized : g)));
        return;
      } catch (err: any) {
        throw new Error(err.message || "Failed to update goal on server.");
      }
    }

    setGoals((current) =>
      current.map((goal) =>
        goal.id === id ? { ...goal, ...data, updatedAt: new Date().toISOString() } : goal
      )
    );
  };

  const deleteGoal = async (id: string): Promise<void> => {
    const token = localStorage.getItem("studyflow-token");

    if (token && !id.startsWith("goal-") && id !== "g1" && id !== "g2") {
      try {
        await deleteGoalApi(id);
      } catch (err: any) {
        throw new Error(err.message || "Failed to delete goal from server.");
      }
    }

    setGoals((current) => current.filter((goal) => goal.id !== id));
  };

  const getGoal = (id: string) => {
    return goals.find((goal) => goal.id === id);
  };

  return (
    <GoalContext.Provider
      value={{
        goals,
        loading,
        error,
        refreshGoals: loadGoalsFromApi,
        addGoal,
        updateGoal,
        deleteGoal,
        getGoal,
      }}
    >
      {children}
    </GoalContext.Provider>
  );
}

export function useGoals() {
  const context = useContext(GoalContext);

  if (!context) {
    throw new Error("useGoals must be used inside GoalProvider");
  }

  return context;
}
