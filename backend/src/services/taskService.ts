import prisma from "../db/prisma.js";
import OwnershipService from "./ownershipService.js";
import GoalService from "./goalService.js";
import { TaskPriority, TaskStatus } from "@prisma/client";

export interface CreateTaskInput {
  subjectId: string;
  goalId?: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
}

export interface UpdateTaskInput {
  subjectId?: string;
  goalId?: string | null;
  title?: string;
  description?: string;
  dueDate?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
}

export class TaskService {
  /**
   * Get tasks belonging to the authenticated user with optional subjectId, goalId, status, and priority filtering.
   */
  static async getTasks(
    userId: string,
    filters?: {
      subjectId?: string;
      goalId?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
    }
  ) {
    const where: any = { userId };

    if (filters?.subjectId) {
      where.subjectId = filters.subjectId;
    }

    if (filters?.goalId) {
      where.goalId = filters.goalId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.priority) {
      where.priority = filters.priority;
    }

    return prisma.task.findMany({
      where,
      include: {
        subject: {
          select: { id: true, name: true, color: true },
        },
        goal: {
          select: { id: true, title: true, progress: true },
        },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    });
  }

  /**
   * Get single task by ID with ownership verification.
   */
  static async getTaskById(userId: string, taskId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        subject: {
          select: { id: true, name: true, color: true },
        },
        goal: {
          select: { id: true, title: true, progress: true },
        },
      },
    });

    if (!task) {
      throw { status: 404, message: "Task not found." };
    }

    if (task.userId !== userId) {
      throw { status: 403, message: "Access forbidden: You do not own this task." };
    }

    return task;
  }

  /**
   * Create a task inside a database transaction and automatically recalculate linked Goal progress.
   */
  static async createTask(userId: string, input: CreateTaskInput) {
    const cleanTitle = input.title ? input.title.trim() : "";

    if (!cleanTitle) {
      throw { status: 400, message: "Task title is required." };
    }

    if (!input.subjectId) {
      throw { status: 400, message: "Subject ID is required." };
    }

    // Validate subject ownership
    await OwnershipService.validateSubject(userId, input.subjectId);

    // Validate goal ownership & cross-entity match if goalId provided
    if (input.goalId) {
      await OwnershipService.validateGoal(userId, input.goalId, input.subjectId);
    }

    const taskStatus = input.status || TaskStatus.TODO;
    const completedAt = taskStatus === TaskStatus.COMPLETED ? new Date() : null;

    return prisma.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          userId,
          subjectId: input.subjectId,
          goalId: input.goalId || null,
          title: cleanTitle,
          description: input.description?.trim() || null,
          dueDate: input.dueDate || null,
          priority: input.priority || TaskPriority.MEDIUM,
          status: taskStatus,
          completedAt,
        },
        include: {
          subject: {
            select: { id: true, name: true, color: true },
          },
          goal: {
            select: { id: true, title: true, progress: true },
          },
        },
      });

      if (input.goalId) {
        await GoalService.recalculateGoalProgress(input.goalId, tx);
      }

      return task;
    });
  }

  /**
   * Update task, managing completedAt timestamp and recalculating Goal progress atomically.
   */
  static async updateTask(userId: string, taskId: string, input: UpdateTaskInput) {
    const existingTask = await this.getTaskById(userId, taskId);

    const updateData: any = {};
    const targetSubjectId = input.subjectId || existingTask.subjectId;

    if (input.subjectId !== undefined && input.subjectId !== existingTask.subjectId) {
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

    if (input.title !== undefined) {
      const cleanTitle = input.title.trim();
      if (!cleanTitle) {
        throw { status: 400, message: "Task title cannot be empty." };
      }
      updateData.title = cleanTitle;
    }

    if (input.description !== undefined) {
      updateData.description = input.description ? input.description.trim() : null;
    }

    if (input.dueDate !== undefined) {
      updateData.dueDate = input.dueDate;
    }

    if (input.priority !== undefined) {
      updateData.priority = input.priority;
    }

    if (input.status !== undefined) {
      updateData.status = input.status;
      if (input.status === TaskStatus.COMPLETED && existingTask.status !== TaskStatus.COMPLETED) {
        updateData.completedAt = new Date();
      } else if (input.status !== TaskStatus.COMPLETED && existingTask.status === TaskStatus.COMPLETED) {
        updateData.completedAt = null;
      }
    }

    const oldGoalId = existingTask.goalId;
    const newGoalId = input.goalId !== undefined ? input.goalId : oldGoalId;

    return prisma.$transaction(async (tx) => {
      const updatedTask = await tx.task.update({
        where: { id: taskId },
        data: updateData,
        include: {
          subject: {
            select: { id: true, name: true, color: true },
          },
          goal: {
            select: { id: true, title: true, progress: true },
          },
        },
      });

      if (oldGoalId) {
        await GoalService.recalculateGoalProgress(oldGoalId, tx);
      }
      if (newGoalId && newGoalId !== oldGoalId) {
        await GoalService.recalculateGoalProgress(newGoalId, tx);
      }

      return updatedTask;
    });
  }

  /**
   * Delete task cleanly and recalculate Goal progress atomically.
   */
  static async deleteTask(userId: string, taskId: string) {
    const existingTask = await this.getTaskById(userId, taskId);
    const goalId = existingTask.goalId;

    return prisma.$transaction(async (tx) => {
      const deleted = await tx.task.delete({
        where: { id: taskId },
      });

      if (goalId) {
        await GoalService.recalculateGoalProgress(goalId, tx);
      }

      return deleted;
    });
  }
}

export default TaskService;
