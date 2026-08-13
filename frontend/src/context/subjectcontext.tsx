/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  fetchSubjectsApi,
  createSubjectApi,
  updateSubjectApi,
  deleteSubjectApi,
} from "../api/subjectApi";

export type SubjectStatus = "ACTIVE" | "COMPLETED" | "ARCHIVED" | "active" | "completed" | "archived";

export interface Subject {
  id: string;
  name: string;
  courseCode?: string;
  description?: string;
  color?: string;
  icon?: string;
  status: SubjectStatus;
  startDate?: string;
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubjectData {
  name: string;
  courseCode?: string;
  description?: string;
  color?: string;
  status?: SubjectStatus;
  startDate?: string;
  targetDate?: string;
}

interface SubjectContextType {
  subjects: Subject[];
  loading: boolean;
  error: string | null;
  refreshSubjects: () => Promise<void>;
  addSubject: (data: CreateSubjectData) => Promise<Subject>;
  updateSubject: (id: string, data: Partial<Subject>) => Promise<void>;
  archiveSubject: (id: string) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  getSubject: (id: string) => Subject | undefined;
}

const SubjectContext = createContext<SubjectContextType | undefined>(undefined);

export const defaultSubjects: Subject[] = [
  {
    id: "sub-networks",
    name: "Networks",
    courseCode: "CS-301",
    description: "Computer Networks, OSI Layer Protocols, Subnetting & Network Security",
    color: "#06B6D4",
    status: "active",
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: "sub-math",
    name: "Mathematics",
    courseCode: "MATH-201",
    description: "Calculus, Differential Equations & Linear Algebra",
    color: "#8B5CF6",
    status: "active",
    createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 25).toISOString(),
  },
  {
    id: "sub-dsa",
    name: "DSA",
    courseCode: "CS-202",
    description: "Data Structures, Algorithms, BSTs & Complexity Analysis",
    color: "#F59E0B",
    status: "active",
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
  {
    id: "sub-dbms",
    name: "DBMS",
    courseCode: "CS-304",
    description: "Database Systems, SQL Indexing, Transactions & Normalization",
    color: "#10B981",
    status: "active",
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
];

export function SubjectProvider({ children }: { children: ReactNode }) {
  const [subjects, setSubjects] = useState<Subject[]>(defaultSubjects);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubjectsFromApi = async () => {
    const token = localStorage.getItem("studyflow-token");

    if (!token) {
      // Fallback to local storage or defaults if not logged in
      const saved = localStorage.getItem("studyflow-subjects");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSubjects(parsed);
          }
        } catch {
          setSubjects(defaultSubjects);
        }
      }
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const apiSubjects = await fetchSubjectsApi();
      // Normalize statuses to lowercase for UI consistency
      const normalized = apiSubjects.map((s) => ({
        ...s,
        status: (s.status ? s.status.toLowerCase() : "active") as SubjectStatus,
      }));
      setSubjects(normalized);
    } catch (err: any) {
      console.warn("Failed to load subjects from backend API, using local fallback:", err);
      setError("Unable to load subjects from server. Displaying cached data.");
      const saved = localStorage.getItem("studyflow-subjects");
      if (saved) {
        try {
          setSubjects(JSON.parse(saved));
        } catch {
          setSubjects(defaultSubjects);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjectsFromApi();
  }, []);

  const addSubject = async (data: CreateSubjectData): Promise<Subject> => {
    const token = localStorage.getItem("studyflow-token");

    if (token) {
      try {
        const created = await createSubjectApi({
          name: data.name,
          description: data.description,
          color: data.color,
          targetDate: data.targetDate,
        });
        const normalized: Subject = {
          ...created,
          status: (created.status ? created.status.toLowerCase() : "active") as SubjectStatus,
        };
        setSubjects((prev) => [normalized, ...prev]);
        return normalized;
      } catch (err: any) {
        throw new Error(err.message || "Failed to create subject on server.");
      }
    }

    // Local fallback
    const now = new Date().toISOString();
    const newSubject: Subject = {
      id: "sub-" + crypto.randomUUID(),
      name: data.name.trim(),
      description: data.description?.trim(),
      color: data.color || "#06B6D4",
      status: "active",
      targetDate: data.targetDate,
      createdAt: now,
      updatedAt: now,
    };

    setSubjects((current) => [newSubject, ...current]);
    localStorage.setItem("studyflow-subjects", JSON.stringify([newSubject, ...subjects]));
    return newSubject;
  };

  const updateSubject = async (id: string, data: Partial<Subject>): Promise<void> => {
    const token = localStorage.getItem("studyflow-token");

    if (token && !id.startsWith("sub-")) {
      try {
        const updated = await updateSubjectApi(id, data);
        const normalized: Subject = {
          ...updated,
          status: (updated.status ? updated.status.toLowerCase() : "active") as SubjectStatus,
        };
        setSubjects((current) => current.map((s) => (s.id === id ? normalized : s)));
        return;
      } catch (err: any) {
        throw new Error(err.message || "Failed to update subject on server.");
      }
    }

    setSubjects((current) =>
      current.map((sub) =>
        sub.id === id ? { ...sub, ...data, updatedAt: new Date().toISOString() } : sub
      )
    );
  };

  const archiveSubject = async (id: string): Promise<void> => {
    await updateSubject(id, { status: "archived" });
  };

  const deleteSubject = async (id: string): Promise<void> => {
    const token = localStorage.getItem("studyflow-token");

    if (token && !id.startsWith("sub-")) {
      try {
        await deleteSubjectApi(id);
      } catch (err: any) {
        throw new Error(err.message || "Failed to delete subject from server.");
      }
    }

    setSubjects((current) => current.filter((sub) => sub.id !== id));
  };

  const getSubject = (id: string) => {
    return subjects.find((sub) => sub.id === id);
  };

  return (
    <SubjectContext.Provider
      value={{
        subjects,
        loading,
        error,
        refreshSubjects: loadSubjectsFromApi,
        addSubject,
        updateSubject,
        archiveSubject,
        deleteSubject,
        getSubject,
      }}
    >
      {children}
    </SubjectContext.Provider>
  );
}

export function useSubjects() {
  const context = useContext(SubjectContext);

  if (!context) {
    throw new Error("useSubjects must be used inside SubjectProvider");
  }

  return context;
}
