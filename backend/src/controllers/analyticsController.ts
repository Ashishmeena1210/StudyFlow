import { Request, Response } from "express";
import AnalyticsService from "../services/analyticsService.js";

export class AnalyticsController {
  static async getOverview(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { range, subjectId } = req.query;

      const data = await AnalyticsService.getAnalyticsOverview(userId, {
        range: typeof range === "string" ? range : undefined,
        subjectId: typeof subjectId === "string" ? subjectId : undefined,
      });

      res.status(200).json(data);
    } catch (error: any) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        error: "Internal Server Error",
        message: error.message || "Failed to calculate analytics overview.",
      });
    }
  }
}

export default AnalyticsController;
