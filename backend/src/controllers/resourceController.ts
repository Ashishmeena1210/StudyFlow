import { Request, Response } from "express";
import ResourceService from "../services/resourceService.js";
import { ResourceType } from "@prisma/client";

export class ResourceController {
  static async getResources(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { subjectId, goalId, taskId, type, isSaved, isFavorite } = req.query;

      const resources = await ResourceService.getResources(userId, {
        subjectId: typeof subjectId === "string" ? subjectId : undefined,
        goalId: typeof goalId === "string" ? goalId : undefined,
        taskId: typeof taskId === "string" ? taskId : undefined,
        type: typeof type === "string" ? (type.toUpperCase() as ResourceType) : undefined,
        isSaved: isSaved !== undefined ? isSaved === "true" : undefined,
        isFavorite: isFavorite !== undefined ? isFavorite === "true" : undefined,
      });

      res.status(200).json({ resources });
    } catch (error: any) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        error: "Internal Server Error",
        message: error.message || "Failed to fetch resources.",
      });
    }
  }

  static async getResourceById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const resourceId = req.params.id as string;
      const resource = await ResourceService.getResourceById(userId, resourceId);
      res.status(200).json({ resource });
    } catch (error: any) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        error: statusCode === 404 ? "Not Found" : statusCode === 403 ? "Forbidden" : "Internal Server Error",
        message: error.message || "Failed to fetch resource.",
      });
    }
  }

  static async createResource(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { subjectId, goalId, taskId, title, description, url, type, source, isSaved, isFavorite } = req.body;

      const resource = await ResourceService.createResource(userId, {
        subjectId,
        goalId,
        taskId,
        title,
        description,
        url,
        type: type ? (type.toUpperCase() as ResourceType) : undefined,
        source,
        isSaved,
        isFavorite,
      });

      res.status(201).json({ resource });
    } catch (error: any) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        error: statusCode === 400 ? "Bad Request" : statusCode === 403 ? "Forbidden" : "Internal Server Error",
        message: error.message || "Failed to create resource.",
      });
    }
  }

  static async updateResource(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const resourceId = req.params.id as string;
      const { subjectId, goalId, taskId, title, description, url, type, source, isSaved, isFavorite } = req.body;

      const resource = await ResourceService.updateResource(userId, resourceId, {
        subjectId,
        goalId,
        taskId,
        title,
        description,
        url,
        type: type ? (type.toUpperCase() as ResourceType) : undefined,
        source,
        isSaved,
        isFavorite,
      });

      res.status(200).json({ resource });
    } catch (error: any) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        error: statusCode === 404 ? "Not Found" : statusCode === 403 ? "Forbidden" : statusCode === 400 ? "Bad Request" : "Internal Server Error",
        message: error.message || "Failed to update resource.",
      });
    }
  }

  static async deleteResource(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const resourceId = req.params.id as string;
      await ResourceService.deleteResource(userId, resourceId);
      res.status(200).json({ message: "Resource deleted successfully." });
    } catch (error: any) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        error: statusCode === 404 ? "Not Found" : statusCode === 403 ? "Forbidden" : "Internal Server Error",
        message: error.message || "Failed to delete resource.",
      });
    }
  }

  static async saveResource(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const resourceId = req.params.id as string;
      const { isSaved } = req.body;

      const resource = await ResourceService.toggleSaveResource(userId, resourceId, isSaved);
      res.status(200).json({ resource });
    } catch (error: any) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        error: statusCode === 404 ? "Not Found" : statusCode === 403 ? "Forbidden" : "Internal Server Error",
        message: error.message || "Failed to save resource.",
      });
    }
  }

  static async favoriteResource(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const resourceId = req.params.id as string;
      const { isFavorite } = req.body;

      const resource = await ResourceService.toggleFavoriteResource(userId, resourceId, isFavorite);
      res.status(200).json({ resource });
    } catch (error: any) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        error: statusCode === 404 ? "Not Found" : statusCode === 403 ? "Forbidden" : "Internal Server Error",
        message: error.message || "Failed to favorite resource.",
      });
    }
  }

  static async openResource(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const resourceId = req.params.id as string;

      const resource = await ResourceService.markResourceOpened(userId, resourceId);
      res.status(200).json({ resource });
    } catch (error: any) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        error: statusCode === 404 ? "Not Found" : statusCode === 403 ? "Forbidden" : "Internal Server Error",
        message: error.message || "Failed to record resource open timestamp.",
      });
    }
  }

  static async searchResources(req: Request, res: Response): Promise<void> {
    try {
      const { subject, topic, type } = req.query;
      const results = await ResourceService.searchOnlineResources(
        typeof subject === "string" ? subject : "General",
        typeof topic === "string" ? topic : undefined,
        typeof type === "string" ? type : undefined
      );

      res.status(200).json({ results });
    } catch (error: any) {
      res.status(500).json({
        error: "Internal Server Error",
        message: error.message || "Failed to search online resources.",
      });
    }
  }
}

export default ResourceController;
