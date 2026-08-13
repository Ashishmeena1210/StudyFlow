import { Request, Response } from "express";
import TaskService from "../services/taskService.js";
import { TaskPriority, TaskStatus } from "@prisma/client";

export class TaskController {
  static async getTasks(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { subjectId, goalId, status, priority } = req.query;

      const tasks = await TaskService.getTasks(userId, {
        subjectId: typeof subjectId === "string" ? subjectId : undefined,
        goalId: typeof goalId === "string" ? goalId : undefined,
        status: typeof status === "string" ? (status.toUpperCase() as TaskStatus) : undefined,
        priority: typeof priority === "string" ? (priority.toUpperCase() as TaskPriority) : undefined,
      });

      res.status(200).json({ tasks });
    } catch (error: any) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        error: "Internal Server Error",
        message: error.message || "Failed to fetch tasks.",
      });
    }
  }

  static async getTaskById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const taskId = req.params.id as string;
      const task = await TaskService.getTaskById(userId, taskId);
      res.status(200).json({ task });
    } catch (error: any) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        error: statusCode === 404 ? "Not Found" : statusCode === 403 ? "Forbidden" : "Internal Server Error",
        message: error.message || "Failed to fetch task.",
      });
    }
  }

  static async createTask(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { subjectId, goalId, title, description, dueDate, priority, status } = req.body;

      const task = await TaskService.createTask(userId, {
        subjectId,
        goalId,
        title,
        description,
        dueDate,
        priority: priority ? (priority.toUpperCase() as TaskPriority) : undefined,
        status: status ? (status.toUpperCase() as TaskStatus) : undefined,
      });

      res.status(201).json({ task });
    } catch (error: any) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        error: statusCode === 400 ? "Bad Request" : statusCode === 403 ? "Forbidden" : "Internal Server Error",
        message: error.message || "Failed to create task.",
      });
    }
  }

  static async updateTask(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const taskId = req.params.id as string;
      const { subjectId, goalId, title, description, dueDate, priority, status } = req.body;

      const task = await TaskService.updateTask(userId, taskId, {
        subjectId,
        goalId,
        title,
        description,
        dueDate,
        priority: priority ? (priority.toUpperCase() as TaskPriority) : undefined,
        status: status ? (status.toUpperCase() as TaskStatus) : undefined,
      });

      res.status(200).json({ task });
    } catch (error: any) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        error: statusCode === 404 ? "Not Found" : statusCode === 403 ? "Forbidden" : statusCode === 400 ? "Bad Request" : "Internal Server Error",
        message: error.message || "Failed to update task.",
      });
    }
  }

  static async deleteTask(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const taskId = req.params.id as string;
      await TaskService.deleteTask(userId, taskId);
      res.status(200).json({ message: "Task deleted successfully." });
    } catch (error: any) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        error: statusCode === 404 ? "Not Found" : statusCode === 403 ? "Forbidden" : "Internal Server Error",
        message: error.message || "Failed to delete task.",
      });
    }
  }
}

export default TaskController;
