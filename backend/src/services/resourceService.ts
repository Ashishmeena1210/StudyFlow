import prisma from "../db/prisma.js";
import OwnershipService from "./ownershipService.js";
import { isValidHttpUrl } from "../utils/urlValidator.js";
import { ResourceType } from "@prisma/client";

export interface CreateResourceInput {
  subjectId: string;
  goalId?: string;
  taskId?: string;
  title: string;
  description?: string;
  url: string;
  type?: ResourceType;
  source?: string;
  isSaved?: boolean;
  isFavorite?: boolean;
}

export interface UpdateResourceInput {
  subjectId?: string;
  goalId?: string | null;
  taskId?: string | null;
  title?: string;
  description?: string;
  url?: string;
  type?: ResourceType;
  source?: string;
  isSaved?: boolean;
  isFavorite?: boolean;
}

export class ResourceService {
  /**
   * Get resources belonging to the authenticated user with optional subjectId, goalId, taskId, type, isSaved, isFavorite filters.
   */
  static async getResources(
    userId: string,
    filters?: {
      subjectId?: string;
      goalId?: string;
      taskId?: string;
      type?: ResourceType;
      isSaved?: boolean;
      isFavorite?: boolean;
    }
  ) {
    const where: any = { userId };

    if (filters?.subjectId) where.subjectId = filters.subjectId;
    if (filters?.goalId) where.goalId = filters.goalId;
    if (filters?.taskId) where.taskId = filters.taskId;
    if (filters?.type) where.type = filters.type;
    if (filters?.isSaved !== undefined) where.isSaved = filters.isSaved;
    if (filters?.isFavorite !== undefined) where.isFavorite = filters.isFavorite;

    return prisma.resource.findMany({
      where,
      include: {
        subject: { select: { id: true, name: true, color: true } },
        goal: { select: { id: true, title: true } },
        task: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get single resource by ID with ownership verification.
   */
  static async getResourceById(userId: string, resourceId: string) {
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      include: {
        subject: { select: { id: true, name: true, color: true } },
        goal: { select: { id: true, title: true } },
        task: { select: { id: true, title: true } },
      },
    });

    if (!resource) {
      throw { status: 404, message: "Resource not found." };
    }

    if (resource.userId !== userId) {
      throw { status: 403, message: "Access forbidden: You do not own this resource." };
    }

    return resource;
  }

  /**
   * Create a new resource after URL and relationship ownership validation.
   */
  static async createResource(userId: string, input: CreateResourceInput) {
    const cleanTitle = input.title ? input.title.trim() : "";
    const cleanUrl = input.url ? input.url.trim() : "";

    if (!cleanTitle) {
      throw { status: 400, message: "Resource title is required." };
    }

    if (!cleanUrl) {
      throw { status: 400, message: "Resource URL is required." };
    }

    if (!isValidHttpUrl(cleanUrl)) {
      throw { status: 400, message: "Invalid or unsafe HTTP/HTTPS URL provided." };
    }

    if (!input.subjectId) {
      throw { status: 400, message: "Subject ID is required." };
    }

    // 1. Validate Subject ownership
    try {
      await OwnershipService.validateSubject(userId, input.subjectId);
    } catch (err: any) {
      throw { status: 403, message: err.message };
    }

    // 2. Validate Goal ownership & match if provided
    if (input.goalId) {
      try {
        await OwnershipService.validateGoal(userId, input.goalId, input.subjectId);
      } catch (err: any) {
        throw { status: 400, message: err.message };
      }
    }

    // 3. Validate Task ownership & match if provided
    if (input.taskId) {
      try {
        await OwnershipService.validateTask(userId, input.taskId, input.subjectId, input.goalId);
      } catch (err: any) {
        throw { status: 400, message: err.message };
      }
    }

    return prisma.resource.create({
      data: {
        userId,
        subjectId: input.subjectId,
        goalId: input.goalId || null,
        taskId: input.taskId || null,
        title: cleanTitle,
        description: input.description?.trim() || null,
        url: cleanUrl,
        type: input.type || ResourceType.WEBSITE,
        source: input.source?.trim() || null,
        isSaved: input.isSaved !== undefined ? input.isSaved : true,
        isFavorite: input.isFavorite !== undefined ? input.isFavorite : false,
        isAISuggested: false,
      },
      include: {
        subject: { select: { id: true, name: true, color: true } },
        goal: { select: { id: true, title: true } },
        task: { select: { id: true, title: true } },
      },
    });
  }

  /**
   * Update resource details after ownership validation.
   */
  static async updateResource(userId: string, resourceId: string, input: UpdateResourceInput) {
    const existing = await this.getResourceById(userId, resourceId);
    const updateData: any = {};

    const targetSubjectId = input.subjectId || existing.subjectId;

    if (input.subjectId !== undefined && input.subjectId !== existing.subjectId) {
      await OwnershipService.validateSubject(userId, input.subjectId);
      updateData.subjectId = input.subjectId;
    }

    if (input.goalId !== undefined) {
      if (input.goalId) {
        await OwnershipService.validateGoal(userId, input.goalId, targetSubjectId);
        updateData.goalId = input.goalId;
      } else {
        updateData.goalId = null;
      }
    }

    if (input.taskId !== undefined) {
      if (input.taskId) {
        await OwnershipService.validateTask(userId, input.taskId, targetSubjectId, input.goalId || existing.goalId || undefined);
        updateData.taskId = input.taskId;
      } else {
        updateData.taskId = null;
      }
    }

    if (input.title !== undefined) {
      const cleanTitle = input.title.trim();
      if (!cleanTitle) throw { status: 400, message: "Title cannot be empty." };
      updateData.title = cleanTitle;
    }

    if (input.url !== undefined) {
      const cleanUrl = input.url.trim();
      if (!cleanUrl || !isValidHttpUrl(cleanUrl)) {
        throw { status: 400, message: "Invalid or unsafe HTTP/HTTPS URL provided." };
      }
      updateData.url = cleanUrl;
    }

    if (input.description !== undefined) updateData.description = input.description?.trim() || null;
    if (input.type !== undefined) updateData.type = input.type;
    if (input.source !== undefined) updateData.source = input.source?.trim() || null;
    if (input.isSaved !== undefined) updateData.isSaved = input.isSaved;
    if (input.isFavorite !== undefined) updateData.isFavorite = input.isFavorite;

    return prisma.resource.update({
      where: { id: resourceId },
      data: updateData,
      include: {
        subject: { select: { id: true, name: true, color: true } },
        goal: { select: { id: true, title: true } },
        task: { select: { id: true, title: true } },
      },
    });
  }

  /**
   * Delete resource cleanly after ownership check.
   */
  static async deleteResource(userId: string, resourceId: string) {
    await this.getResourceById(userId, resourceId);
    return prisma.resource.delete({
      where: { id: resourceId },
    });
  }

  /**
   * Toggle save state (isSaved = true/false).
   */
  static async toggleSaveResource(userId: string, resourceId: string, isSaved?: boolean) {
    const existing = await this.getResourceById(userId, resourceId);
    const newSaveState = isSaved !== undefined ? isSaved : !existing.isSaved;

    return prisma.resource.update({
      where: { id: resourceId },
      data: { isSaved: newSaveState },
      include: {
        subject: { select: { id: true, name: true, color: true } },
        goal: { select: { id: true, title: true } },
        task: { select: { id: true, title: true } },
      },
    });
  }

  /**
   * Toggle favorite state (isFavorite = true/false).
   */
  static async toggleFavoriteResource(userId: string, resourceId: string, isFavorite?: boolean) {
    const existing = await this.getResourceById(userId, resourceId);
    const newFavState = isFavorite !== undefined ? isFavorite : !existing.isFavorite;

    return prisma.resource.update({
      where: { id: resourceId },
      data: { isFavorite: newFavState },
      include: {
        subject: { select: { id: true, name: true, color: true } },
        goal: { select: { id: true, title: true } },
        task: { select: { id: true, title: true } },
      },
    });
  }

  /**
   * Update lastOpenedAt timestamp when user opens resource.
   */
  static async markResourceOpened(userId: string, resourceId: string) {
    await this.getResourceById(userId, resourceId);

    return prisma.resource.update({
      where: { id: resourceId },
      data: { lastOpenedAt: new Date() },
      include: {
        subject: { select: { id: true, name: true, color: true } },
        goal: { select: { id: true, title: true } },
        task: { select: { id: true, title: true } },
      },
    });
  }

  /**
   * Search online discovery resources (returns temporary results, NOT saved to DB until user clicks Save).
   */
  static async searchOnlineResources(subjectName: string, topic?: string, type?: string) {
    const cleanSub = subjectName ? subjectName.trim() : "General";
    const cleanTopic = topic ? topic.trim() : "";
    const cleanType = type ? type.toLowerCase() : "article";

    // Standard curated discovery educational links matched specifically to subject & topic
    const searchResults = [
      {
        title: `${cleanSub} ${cleanTopic ? cleanTopic + " " : ""}Comprehensive Study Guide`,
        description: `In-depth documentation, tutorials, and practical examples covering ${cleanSub} ${cleanTopic}.`,
        url: `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(cleanSub + " " + cleanTopic)}`,
        type: cleanType === "video" ? "VIDEO" : cleanType === "course" ? "COURSE" : "ARTICLE",
        source: "MDN Web Docs / Open Education",
      },
      {
        title: `${cleanSub} ${cleanTopic ? cleanTopic + " " : ""}Video Lecture Series`,
        description: `Step-by-step video tutorials and visual explanations for ${cleanSub}.`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanSub + " " + cleanTopic + " tutorial")}`,
        type: "VIDEO",
        source: "YouTube Learning",
      },
      {
        title: `${cleanSub} Interactive Practice & Exercises`,
        description: `Interactive exercises and practice problems to master ${cleanSub} concepts.`,
        url: `https://geeksforgeeks.org/search?q=${encodeURIComponent(cleanSub + " " + cleanTopic)}`,
        type: "PRACTICE",
        source: "GeeksforGeeks / Practice Hub",
      },
    ];

    return searchResults;
  }
}

export default ResourceService;
