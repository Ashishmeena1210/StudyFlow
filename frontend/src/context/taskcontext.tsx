/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  fetchTasksApi,
  createTaskApi,
  updateTaskApi,
  deleteTaskApi,
} from "../api/taskApi";

export type Priority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description: string;
  subject: string;
  subjectId?: string;
  priority: Priority;
  dueDate: string;
  completed: boolean;
  goalId?: string;
  createdAt: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  subject?: string;
  subjectId?: string;
  priority: Priority;
  dueDate: string;
  goalId?: string;
}

interface TaskContextType {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  refreshTasks: () => Promise<void>;
  addTask: (data: CreateTaskData) => Promise<Task>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  getTask: (id: string) => Task | undefined;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const getFormattedDate = (offsetDays: number = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const defaultTasks: Task[] = [
  {
    id: "1",
    title: "Network Layer Protocols",
    description: "Revise IP addressing, subnetting, and routing basics.",
    subject: "Networks",
    subjectId: "sub-networks",
    priority: "high",
    dueDate: getFormattedDate(-3),
    completed: false,
    goalId: "g1",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "2",
    title: "Integration by Parts",
    description: "Complete the exercise set on integration by parts from Chapter 7.",
    subject: "Mathematics",
    subjectId: "sub-math",
    priority: "medium",
    dueDate: getFormattedDate(0),
    completed: false,
    goalId: "g2",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(defaultTasks);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasksFromApi = async () => {
    const token = localStorage.getItem("studyflow-token");

    if (!token) {
      const saved = localStorage.getItem("studyflow-tasks");
      if (saved) {
        try {
          setTasks(JSON.parse(saved));
        } catch {
          setTasks(defaultTasks);
        }
      }
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const apiTasks = await fetchTasksApi();
      const normalized = apiTasks.map((t: any) => ({
        ...t,
        subject: t.subject?.name || t.subject || "General",
        priority: (t.priority ? t.priority.toLowerCase() : "medium") as Priority,
        completed: t.status === "COMPLETED" || t.completed === true,
        dueDate: t.dueDate || getFormattedDate(0),
      }));
      setTasks(normalized);
    } catch (err: any) {
      console.warn("Failed to load tasks from API, using fallback:", err);
      setError("Unable to load tasks from server. Displaying cached data.");
      const saved = localStorage.getItem("studyflow-tasks");
      if (saved) {
        try {
          setTasks(JSON.parse(saved));
        } catch {
          setTasks(defaultTasks);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasksFromApi();
  }, []);

  const addTask = async (data: CreateTaskData): Promise<Task> => {
    const token = localStorage.getItem("studyflow-token");

    if (token && data.subjectId && !data.subjectId.startsWith("sub-")) {
      try {
        const created: any = await createTaskApi({
          subjectId: data.subjectId,
          goalId: data.goalId,
          title: data.title,
          description: data.description,
          dueDate: data.dueDate,
          priority: (data.priority ? data.priority.toUpperCase() : "MEDIUM") as any,
        });

        const normalized: Task = {
          ...created,
          subject: created.subject?.name || data.subject || "General",
          priority: (created.priority ? created.priority.toLowerCase() : "medium") as Priority,
          completed: created.status === "COMPLETED",
          dueDate: created.dueDate || data.dueDate,
        };
        setTasks((prev) => [normalized, ...prev]);
        return normalized;
      } catch (err: any) {
        throw new Error(err.message || "Failed to create task on server.");
      }
    }

    const task: Task = {
      id: "task-" + crypto.randomUUID(),
      ...data,
      subject: data.subject || "General",
      description: data.description || "",
      completed: false,
      createdAt: new Date().toISOString(),
    };

    setTasks((current) => [task, ...current]);
    localStorage.setItem("studyflow-tasks", JSON.stringify([task, ...tasks]));
    return task;
  };

  const updateTask = async (id: string, data: Partial<Task>): Promise<void> => {
    const token = localStorage.getItem("studyflow-token");

    if (token && !id.startsWith("task-") && id !== "1" && id !== "2") {
      try {
        const payload: any = { ...data };
        if (data.completed !== undefined) {
          payload.status = data.completed ? "COMPLETED" : "TODO";
        }
        if (data.priority) {
          payload.priority = data.priority.toUpperCase();
        }

        const updated: any = await updateTaskApi(id, payload);
        const normalized: Task = {
          ...updated,
          subject: updated.subject?.name || data.subject || "General",
          priority: (updated.priority ? updated.priority.toLowerCase() : "medium") as Priority,
          completed: updated.status === "COMPLETED",
          dueDate: updated.dueDate || data.dueDate,
        };
        setTasks((current) => current.map((t) => (t.id === id ? normalized : t)));
        return;
      } catch (err: any) {
        throw new Error(err.message || "Failed to update task on server.");
      }
    }

    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, ...data } : task))
    );
  };

  const toggleTask = async (id: string): Promise<void> => {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;
    await updateTask(id, { completed: !target.completed });
  };

  const deleteTask = async (id: string): Promise<void> => {
    const token = localStorage.getItem("studyflow-token");

    if (token && !id.startsWith("task-") && id !== "1" && id !== "2") {
      try {
        await deleteTaskApi(id);
      } catch (err: any) {
        throw new Error(err.message || "Failed to delete task from server.");
      }
    }

    setTasks((current) => current.filter((task) => task.id !== id));
  };

  const getTask = (id: string) => {
    return tasks.find((task) => task.id === id);
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        loading,
        error,
        refreshTasks: loadTasksFromApi,
        addTask,
        updateTask,
        deleteTask,
        toggleTask,
        getTask,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);

  if (!context) {
    throw new Error("useTasks must be used inside TaskProvider");
  }

  return context;
}