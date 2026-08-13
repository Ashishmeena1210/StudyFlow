import prisma from "../db/prisma.js";
import OwnershipService from "./ownershipService.js";
import ResourceService from "./resourceService.js";
import { isValidHttpUrl } from "../utils/urlValidator.js";
import { ResourceType } from "@prisma/client";

export interface AISuggestionInput {
  subjectId: string;
  topic: string;
  goalId?: string;
  taskId?: string;
  resourceType?: string;
  maxResults?: number;
}

export interface AISuggestionResult {
  title: string;
  description: string;
  type: ResourceType;
  url: string;
  source: string;
  reason: string;
  alreadySaved?: boolean;
}

export class AIResourceService {
  /**
   * Generates AI-assisted structured study resource recommendations.
   * Leverages real online resource search, subject/goal/task learning context,
   * and provides explicit relevance explanations.
   */
  static async suggestResources(userId: string, input: AISuggestionInput): Promise<{ suggestions: AISuggestionResult[] }> {
    const cleanTopic = input.topic ? input.topic.trim() : "";

    if (!input.subjectId) {
      throw { status: 400, message: "Subject ID is required for AI resource suggestions." };
    }

    if (!cleanTopic) {
      throw { status: 400, message: "Learning topic is required for AI resource suggestions." };
    }

    // 1. Validate Subject ownership
    const subject = await prisma.subject.findFirst({
      where: { id: input.subjectId, userId },
      select: { id: true, name: true },
    });

    if (!subject) {
      throw { status: 403, message: "Unauthorized or invalid subjectId for current user." };
    }

    // 2. Validate Goal ownership & match if provided
    let goalTitle: string | undefined;
    if (input.goalId) {
      await OwnershipService.validateGoal(userId, input.goalId, input.subjectId);
      const goal = await prisma.goal.findUnique({ where: { id: input.goalId }, select: { title: true } });
      goalTitle = goal?.title;
    }

    // 3. Validate Task ownership & match if provided
    let taskTitle: string | undefined;
    if (input.taskId) {
      await OwnershipService.validateTask(userId, input.taskId, input.subjectId, input.goalId);
      const task = await prisma.task.findUnique({ where: { id: input.taskId }, select: { title: true } });
      taskTitle = task?.title;
    }

    // 4. Fetch existing saved resources for this Subject to avoid duplicates
    const existingSaved = await ResourceService.getResources(userId, {
      subjectId: input.subjectId,
      isSaved: true,
    });
    const savedUrls = new Set(existingSaved.map((r) => r.url.toLowerCase()));

    // 5. Query verified online educational search provider for the subject + topic
    const searchResults = await ResourceService.searchOnlineResources(
      subject.name,
      cleanTopic,
      input.resourceType
    );

    const limit = Math.min(Math.max(input.maxResults || 5, 1), 10);

    // 6. Format structured suggestions with concise relevance explanations
    const suggestions: AISuggestionResult[] = [];

    for (const raw of searchResults.slice(0, limit)) {
      if (!isValidHttpUrl(raw.url)) {
        continue;
      }

      const isAlreadySaved = savedUrls.has(raw.url.toLowerCase());

      let reason = `Directly relevant to ${subject.name} - ${cleanTopic}.`;
      if (taskTitle) {
        reason += ` Helps you complete your task "${taskTitle}".`;
      } else if (goalTitle) {
        reason += ` Supports your study goal "${goalTitle}".`;
      }

      const resourceTypeEnum = (raw.type && Object.values(ResourceType).includes(raw.type as ResourceType))
        ? (raw.type as ResourceType)
        : ResourceType.ARTICLE;

      suggestions.push({
        title: raw.title,
        description: raw.description,
        type: resourceTypeEnum,
        url: raw.url,
        source: raw.source || "Educational Resource",
        reason,
        alreadySaved: isAlreadySaved,
      });
    }

    return { suggestions };
  }
}

export default AIResourceService;
