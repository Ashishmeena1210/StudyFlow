import { Request, Response } from "express";
import AIResourceService from "../services/aiResourceService.js";

export class AIController {
  static async suggestResources(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { subjectId, topic, goalId, taskId, resourceType, maxResults } = req.body;

      const result = await AIResourceService.suggestResources(userId, {
        subjectId,
        topic,
        goalId,
        taskId,
        resourceType,
        maxResults: maxResults ? Number(maxResults) : undefined,
      });

      res.status(200).json(result);
    } catch (error: any) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        error: statusCode === 400 ? "Bad Request" : statusCode === 403 ? "Forbidden" : "Internal Server Error",
        message: error.message || "AI resource suggestions are temporarily unavailable. Please try standard online search.",
      });
    }
  }
}

export default AIController;
