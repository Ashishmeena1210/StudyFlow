import { Request, Response } from "express";
import GoalService from "../services/goalService.js";
import { GoalStatus } from "@prisma/client";

export class GoalController {
  static async getGoals(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { subjectId, status } = req.query;

      const goals = await GoalService.getGoals(userId, {
        subjectId: typeof subjectId === "string" ? subjectId : undefined,
        status: typeof status === "string" ? (status.toUpperCase() as GoalStatus) : undefined,
      });

      res.status(200).json({ goals });
    } catch (error: any) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        error: "Internal Server Error",
        message: error.message || "Failed to fetch goals.",
      });
    }
  }

  static async getGoalById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const goalId = req.params.id as string;
      const goal = await GoalService.getGoalById(userId, goalId);
      res.status(200).json({ goal });
    } catch (error: any) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        error: statusCode === 404 ? "Not Found" : statusCode === 403 ? "Forbidden" : "Internal Server Error",
        message: error.message || "Failed to fetch goal.",
      });
    }
  }

  static async createGoal(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { subjectId, title, description, targetDate, status, progress } = req.body;

      const goal = await GoalService.createGoal(userId, {
        subjectId,
        title,
        description,
        targetDate,
        status: status ? (status.toUpperCase() as GoalStatus) : undefined,
        progress,
      });

      res.status(201).json({ goal });
    } catch (error: any) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        error: statusCode === 400 ? "Bad Request" : statusCode === 403 ? "Forbidden" : "Internal Server Error",
        message: error.message || "Failed to create goal.",
      });
    }
  }

  static async updateGoal(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const goalId = req.params.id as string;
      const { subjectId, title, description, targetDate, status, progress } = req.body;

      const goal = await GoalService.updateGoal(userId, goalId, {
        subjectId,
        title,
        description,
        targetDate,
        status: status ? (status.toUpperCase() as GoalStatus) : undefined,
        progress,
      });

      res.status(200).json({ goal });
    } catch (error: any) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        error: statusCode === 404 ? "Not Found" : statusCode === 403 ? "Forbidden" : statusCode === 400 ? "Bad Request" : "Internal Server Error",
        message: error.message || "Failed to update goal.",
      });
    }
  }

  static async deleteGoal(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const goalId = req.params.id as string;
      await GoalService.deleteGoal(userId, goalId);
      res.status(200).json({ message: "Goal deleted successfully." });
    } catch (error: any) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        error: statusCode === 404 ? "Not Found" : statusCode === 403 ? "Forbidden" : "Internal Server Error",
        message: error.message || "Failed to delete goal.",
      });
    }
  }
}

export default GoalController;
