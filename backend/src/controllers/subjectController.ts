import { Request, Response } from "express";
import SubjectService from "../services/subjectService.js";

export class SubjectController {
  static async getSubjects(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const subjects = await SubjectService.getSubjects(userId);
      res.status(200).json({ subjects });
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({
        error: "Internal Server Error",
        message: error.message || "Failed to fetch subjects.",
      });
    }
  }

  static async getSubjectById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const subjectId = req.params.id as string;
      const subject = await SubjectService.getSubjectById(userId, subjectId);
      res.status(200).json({ subject });
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({
        error: status === 404 ? "Not Found" : status === 403 ? "Forbidden" : "Internal Server Error",
        message: error.message || "Failed to fetch subject.",
      });
    }
  }

  static async createSubject(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { name, description, color, icon, targetDate, status } = req.body;
      const subject = await SubjectService.createSubject(userId, {
        name,
        description,
        color,
        icon,
        targetDate,
        status,
      });
      res.status(201).json({ subject });
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({
        error: status === 400 ? "Bad Request" : status === 409 ? "Conflict" : "Internal Server Error",
        message: error.message || "Failed to create subject.",
      });
    }
  }

  static async updateSubject(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const subjectId = req.params.id as string;
      const { name, description, color, icon, targetDate, status } = req.body;

      const subject = await SubjectService.updateSubject(userId, subjectId, {
        name,
        description,
        color,
        icon,
        targetDate,
        status,
      });
      res.status(200).json({ subject });
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({
        error: status === 404 ? "Not Found" : status === 403 ? "Forbidden" : status === 400 ? "Bad Request" : status === 409 ? "Conflict" : "Internal Server Error",
        message: error.message || "Failed to update subject.",
      });
    }
  }

  static async deleteSubject(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const subjectId = req.params.id as string;
      await SubjectService.deleteSubject(userId, subjectId);
      res.status(200).json({ message: "Subject deleted successfully." });
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({
        error: status === 404 ? "Not Found" : status === 403 ? "Forbidden" : "Internal Server Error",
        message: error.message || "Failed to delete subject.",
      });
    }
  }
}

export default SubjectController;
