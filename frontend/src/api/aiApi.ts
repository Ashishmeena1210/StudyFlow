import { apiClient } from "./client";
import type { ResourceType } from "../context/resourcecontext";

export interface AISuggestionRequest {
  subjectId: string;
  topic: string;
  goalId?: string;
  taskId?: string;
  resourceType?: string;
  maxResults?: number;
}

export interface AISuggestionItem {
  title: string;
  description: string;
  type: ResourceType;
  url: string;
  source: string;
  reason: string;
  alreadySaved?: boolean;
}

export async function suggestAIResourcesApi(
  data: AISuggestionRequest
): Promise<AISuggestionItem[]> {
  const res = await apiClient<{ suggestions: AISuggestionItem[] }>("/ai/resources/suggest", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.suggestions;
}
