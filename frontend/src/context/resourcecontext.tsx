/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  fetchResourcesApi,
  createResourceApi,
  updateResourceApi,
  deleteResourceApi,
  saveResourceApi,
  favoriteResourceApi,
  openResourceApi,
} from "../api/resourceApi";

export type ResourceType =
  | "Video"
  | "Article"
  | "Website"
  | "Documentation"
  | "Course"
  | "PDF"
  | "Book"
  | "Tutorial"
  | "Practice"
  | "Other"
  | "VIDEO"
  | "ARTICLE"
  | "WEBSITE"
  | "DOCUMENTATION"
  | "COURSE"
  | "TUTORIAL"
  | "PRACTICE"
  | "OTHER";

export type DifficultyLevel = "Beginner" | "Intermediate" | "Advanced";
export type RelevanceScore = "Highly relevant" | "Relevant" | "Possibly useful";
export type UserFeedback = "useful" | "not_relevant";

export interface Resource {
  id: string;
  title: string;
  type: ResourceType;
  source: string;
  url?: string;
  description?: string;
  subjectId: string;
  subjectName: string;
  goalId?: string;
  goalTitle?: string;
  taskId?: string;
  taskTitle?: string;
  tags: string[];
  isSaved: boolean;
  isFavorite: boolean;
  isAISuggested?: boolean;
  lastOpenedAt?: string;
  difficulty?: DifficultyLevel;
  relevanceScore?: RelevanceScore;
  relevanceReason?: string;
  userFeedback?: UserFeedback;
  createdAt: string;
  updatedAt: string;
}

export interface CreateResourceData {
  title: string;
  type: ResourceType;
  source?: string;
  url?: string;
  description?: string;
  subjectId: string;
  subjectName?: string;
  goalId?: string;
  goalTitle?: string;
  taskId?: string;
  taskTitle?: string;
  tags?: string[];
  isSaved?: boolean;
  isFavorite?: boolean;
  isAISuggested?: boolean;
  difficulty?: DifficultyLevel;
  relevanceScore?: RelevanceScore;
  relevanceReason?: string;
}

interface ResourceContextType {
  resources: Resource[];
  loading: boolean;
  error: string | null;
  refreshResources: () => Promise<void>;
  addResource: (data: CreateResourceData) => Promise<Resource>;
  saveDiscoveredResource: (
    item: any,
    subjectId?: string,
    goalId?: string,
    taskId?: string,
    tags?: string[]
  ) => Promise<Resource>;
  unsaveResource: (id: string) => Promise<void>;
  updateResource: (id: string, data: Partial<Resource>) => Promise<void>;
  deleteResource: (id: string) => Promise<void>;
  toggleFavoriteResource: (id: string) => Promise<void>;
  markResourceOpened: (id: string) => Promise<void>;
  setResourceFeedback: (id: string, feedback: UserFeedback) => void;
  getResourcesForSubject: (subjectIdOrName: string) => Resource[];
}

const ResourceContext = createContext<ResourceContextType | undefined>(undefined);

const defaultResources: Resource[] = [
  {
    id: "res-1",
    title: "OSI Model & TCP/IP Stack Guide",
    type: "Article",
    source: "Wikipedia",
    url: "https://en.wikipedia.org/wiki/OSI_model",
    description: "Comprehensive breakdown of the 7 OSI layers and protocol mappings.",
    subjectId: "sub-networks",
    subjectName: "Networks",
    goalId: "g1",
    goalTitle: "Master Computer Networks & Protocols",
    taskId: "1",
    taskTitle: "Network Layer Protocols",
    tags: ["Networking", "OSI", "Protocols"],
    isSaved: true,
    isFavorite: true,
    difficulty: "Beginner",
    relevanceScore: "Highly relevant",
    relevanceReason: "Directly matches your Computer Networks course and OSI model task.",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

export function ResourceProvider({ children }: { children: ReactNode }) {
  const [resources, setResources] = useState<Resource[]>(defaultResources);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadResourcesFromApi = async () => {
    const token = localStorage.getItem("studyflow-token");

    if (!token) {
      const saved = localStorage.getItem("studyflow-resources");
      if (saved) {
        try {
          setResources(JSON.parse(saved));
        } catch {
          setResources(defaultResources);
        }
      }
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const apiResources = await fetchResourcesApi();
      const normalized = apiResources.map((r: any) => ({
        id: r.id,
        title: r.title,
        type: (r.type ? r.type.charAt(0) + r.type.slice(1).toLowerCase() : "Website") as ResourceType,
        source: r.source || (r.url ? new URL(r.url).hostname : "Resource"),
        url: r.url,
        description: r.description || undefined,
        subjectId: r.subjectId,
        subjectName: r.subject?.name || "General",
        goalId: r.goalId || undefined,
        goalTitle: r.goal?.title || undefined,
        taskId: r.taskId || undefined,
        taskTitle: r.task?.title || undefined,
        tags: [],
        isSaved: r.isSaved !== undefined ? r.isSaved : true,
        isFavorite: r.isFavorite || false,
        isAISuggested: r.isAISuggested || false,
        lastOpenedAt: r.lastOpenedAt || undefined,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));
      setResources(normalized);
    } catch (err: any) {
      console.warn("Failed to load resources from API, using fallback:", err);
      setError("Unable to load resources from server. Displaying cached data.");
      const saved = localStorage.getItem("studyflow-resources");
      if (saved) {
        try {
          setResources(JSON.parse(saved));
        } catch {
          setResources(defaultResources);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResourcesFromApi();
  }, []);

  const addResource = async (data: CreateResourceData): Promise<Resource> => {
    const token = localStorage.getItem("studyflow-token");

    if (token && data.subjectId && !data.subjectId.startsWith("sub-")) {
      try {
        const created: any = await createResourceApi({
          subjectId: data.subjectId,
          goalId: data.goalId,
          taskId: data.taskId,
          title: data.title,
          description: data.description,
          url: data.url || "https://example.com",
          type: (data.type ? data.type.toUpperCase() : "WEBSITE") as any,
          source: data.source,
          isSaved: data.isSaved !== undefined ? data.isSaved : true,
          isFavorite: data.isFavorite || false,
        });

        const normalized: Resource = {
          id: created.id,
          title: created.title,
          type: (created.type ? created.type.charAt(0) + created.type.slice(1).toLowerCase() : "Website") as ResourceType,
          source: created.source || data.source || "Resource",
          url: created.url,
          description: created.description || undefined,
          subjectId: created.subjectId,
          subjectName: created.subject?.name || data.subjectName || "General",
          goalId: created.goalId || undefined,
          goalTitle: created.goal?.title || data.goalTitle,
          taskId: created.taskId || undefined,
          taskTitle: created.task?.title || data.taskTitle,
          tags: data.tags || [],
          isSaved: created.isSaved,
          isFavorite: created.isFavorite,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        };

        setResources((prev) => [normalized, ...prev]);
        return normalized;
      } catch (err: any) {
        throw new Error(err.message || "Failed to create resource on server.");
      }
    }

    const now = new Date().toISOString();
    const newResource: Resource = {
      id: "res-" + crypto.randomUUID(),
      title: data.title.trim(),
      type: data.type || "Website",
      source: data.source || "Manual Entry",
      url: data.url?.trim(),
      description: data.description?.trim(),
      subjectId: data.subjectId,
      subjectName: data.subjectName || "General",
      goalId: data.goalId,
      goalTitle: data.goalTitle,
      taskId: data.taskId,
      taskTitle: data.taskTitle,
      tags: data.tags || [],
      isSaved: data.isSaved !== undefined ? data.isSaved : true,
      isFavorite: data.isFavorite || false,
      createdAt: now,
      updatedAt: now,
    };

    setResources((prev) => [newResource, ...prev]);
    localStorage.setItem("studyflow-resources", JSON.stringify([newResource, ...resources]));
    return newResource;
  };

  const saveDiscoveredResource = async (
    item: any,
    subjectId?: string,
    goalId?: string,
    taskId?: string,
    tags?: string[]
  ): Promise<Resource> => {
    return addResource({
      title: item.title,
      type: (item.type ? item.type.charAt(0) + item.type.slice(1).toLowerCase() : "Website") as ResourceType,
      source: item.source || "Online Suggestion",
      url: item.url,
      description: item.description,
      subjectId: subjectId || item.subjectId || "sub-networks",
      goalId: goalId || item.goalId,
      taskId: taskId || item.taskId,
      tags: tags || item.tags || [],
      isSaved: true,
    });
  };

  const unsaveResource = async (id: string): Promise<void> => {
    const token = localStorage.getItem("studyflow-token");

    if (token && !id.startsWith("res-") && id !== "res-1") {
      try {
        await saveResourceApi(id, false);
      } catch (err: any) {
        console.warn("Failed to unsave resource on server:", err);
      }
    }

    setResources((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isSaved: false } : r))
    );
  };

  const updateResource = async (id: string, data: Partial<Resource>): Promise<void> => {
    const token = localStorage.getItem("studyflow-token");

    if (token && !id.startsWith("res-") && id !== "res-1") {
      try {
        const payload: any = { ...data };
        if (data.type) payload.type = data.type.toUpperCase();
        await updateResourceApi(id, payload);
      } catch (err: any) {
        throw new Error(err.message || "Failed to update resource on server.");
      }
    }

    setResources((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r
      )
    );
  };

  const deleteResource = async (id: string): Promise<void> => {
    const token = localStorage.getItem("studyflow-token");

    if (token && !id.startsWith("res-") && id !== "res-1") {
      try {
        await deleteResourceApi(id);
      } catch (err: any) {
        throw new Error(err.message || "Failed to delete resource on server.");
      }
    }

    setResources((prev) => prev.filter((r) => r.id !== id));
  };

  const toggleFavoriteResource = async (id: string): Promise<void> => {
    const target = resources.find((r) => r.id === id);
    if (!target) return;

    const token = localStorage.getItem("studyflow-token");

    if (token && !id.startsWith("res-") && id !== "res-1") {
      try {
        await favoriteResourceApi(id, !target.isFavorite);
      } catch (err: any) {
        console.warn("Failed to favorite resource on server:", err);
      }
    }

    setResources((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isFavorite: !r.isFavorite } : r))
    );
  };

  const markResourceOpened = async (id: string): Promise<void> => {
    const token = localStorage.getItem("studyflow-token");

    if (token && !id.startsWith("res-") && id !== "res-1") {
      try {
        await openResourceApi(id);
      } catch (err: any) {
        console.warn("Failed to mark resource opened on server:", err);
      }
    }

    setResources((prev) =>
      prev.map((r) => (r.id === id ? { ...r, lastOpenedAt: new Date().toISOString() } : r))
    );
  };

  const setResourceFeedback = (id: string, feedback: UserFeedback) => {
    setResources((prev) =>
      prev.map((r) => (r.id === id ? { ...r, userFeedback: feedback } : r))
    );
  };

  const getResourcesForSubject = (subjectIdOrName: string) => {
    return resources.filter(
      (r) =>
        r.isSaved &&
        (r.subjectId === subjectIdOrName ||
          r.subjectName.toLowerCase() === subjectIdOrName.toLowerCase())
    );
  };

  return (
    <ResourceContext.Provider
      value={{
        resources,
        loading,
        error,
        refreshResources: loadResourcesFromApi,
        addResource,
        saveDiscoveredResource,
        unsaveResource,
        updateResource,
        deleteResource,
        toggleFavoriteResource,
        markResourceOpened,
        setResourceFeedback,
        getResourcesForSubject,
      }}
    >
      {children}
    </ResourceContext.Provider>
  );
}

export function useResources() {
  const context = useContext(ResourceContext);
  if (!context) {
    throw new Error("useResources must be used inside ResourceProvider");
  }
  return context;
}
