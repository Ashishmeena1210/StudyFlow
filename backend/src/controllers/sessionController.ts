import { Request, Response } from "express";
import SessionService from "../services/sessionService.js";
import { SessionStatus, SessionType } from "@prisma/client";

export class SessionController {
  static async getActiveSession(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const session = await SessionService.getActiveSession(userId);
      res.status(200).json({ session });
    } catch (error: any) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        error: "Internal Server Error",
        message: error.message || "Failed to fetch active session.",
      });
    }
  }

  static async getStudySessions(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { subjectId, goalId, taskId, status, sessionType } = req.query;

      const sessions = await SessionService.getStudySessions(userId, {
        subjectId: typeof subjectId === "string" ? subjectId : undefined,
        goalId: typeof goalId === "string" ? goalId : undefined,
        taskId: typeof taskId === "string" ? taskId : undefined,
        status: typeof status === "string" ? (status.toUpperCase() as SessionStatus) : undefined,
        sessionType: typeof sessionType === "string" ? (sessionType.toUpperCase() as SessionType) : undefined,
      });

      res.status(200).json({ sessions });
    } catch (error: any) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        error: "Internal Server Error",
        message: error.message || "Failed to fetch study sessions.",
      });
    }
  }

  static async getStudySessionById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const sessionId = req.params.id as string;
      const session = await SessionService.getStudySessionById(userId, sessionId);
      res.status(200).json({ session });
    } catch (error: any) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        error: statusCode === 404 ? "Not Found" : statusCode === 403 ? "Forbidden" : "Internal Server Error",
        message: error.message || "Failed to fetch study session.",
      });
    }
  }

  static async createStudySession(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { subjectId, goalId, taskId, sessionType, plannedDuration, sessionIntent } = req.body;

      const session = await SessionService.createStudySession(userId, {
        subjectId,
        goalId,
        taskId,
        sessionType: sessionType ? (sessionType.toUpperCase() as SessionType) : undefined,
        plannedDuration: Number(plannedDuration),
        sessionIntent,
      });

      res.status(201).json({ session });
    } catch (error: any) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        error: statusCode === 409 ? "Conflict" : statusCode === 400 ? "Bad Request" : statusCode === 403 ? "Forbidden" : "Internal Server Error",
        message: error.message || "Failed to create study session.",
      });
    }
  }

  static async completeStudySession(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const sessionId = req.params.id as string;
      const { completionResult, reflection, qualityRating } = req.body;

      const session = await SessionService.completeStudySession(userId, sessionId, {
        completionResult,
        reflection,
        qualityRating: qualityRating ? Number(qualityRating) : undefined,
      });

      res.status(200).json({ session });
    } catch (error: any) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        error: statusCode === 404 ? "Not Found" : statusCode === 403 ? "Forbidden" : "Internal Server Error",
        message: error.message || "Failed to complete study session.",
      });
    }
  }

  static async cancelStudySession(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const sessionId = req.params.id as string;

      const session = await SessionService.cancelStudySession(userId, sessionId);
      res.status(200).json({ session });
    } catch (error: any) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        error: statusCode === 404 ? "Not Found" : statusCode === 403 ? "Forbidden" : "Internal Server Error",
        message: error.message || "Failed to cancel study session.",
      });
    }
  }
}

export default SessionController;
