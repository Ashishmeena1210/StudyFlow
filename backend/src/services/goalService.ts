import prisma from "../db/prisma.js";
import OwnershipService from "./ownershipService.js";
import { GoalStatus } from "@prisma/client";

export interface CreateGoalInput {
  subjectId: string;
  title: string;
  description?: string;
  targetDate?: string;
  status?: GoalStatus;
  progress?: number;
}

export interface UpdateGoalInput {
  subjectId?: string;
  title?: string;
  description?: string;
  targetDate?: string;
  status?: GoalStatus;
  progress?: number;
}

export class GoalService {
  /**
   * Get goals belonging to the authenticated user with optional subjectId and status filtering.
   */
  static async getGoals(
    userId: string,
    filters?: { subjectId?: string; status?: GoalStatus }
  ) {
    const where: any = { userId };

    if (filters?.subjectId) {
      where.subjectId = filters.subjectId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    return prisma.goal.findMany({
      where,
      include: {
        subject: {
          select: { id: true, name: true, color: true },
        },
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get single goal by ID with ownership verification.
   */
  static async getGoalById(userId: string, goalId: string) {
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        subject: {
          select: { id: true, name: true, color: true },
        },
        tasks: true,
      },
    });

    if (!goal) {
      throw { status: 404, message: "Goal not found." };
    }

    if (goal.userId !== userId) {
      throw { status: 403, message: "Access forbidden: You do not own this goal." };
    }

    return goal;
  }

  /**
   * Create a new goal for the authenticated user after subject ownership validation.
   */
  static async createGoal(userId: string, input: CreateGoalInput) {
    const cleanTitle = input.title ? input.title.trim() : "";

    if (!cleanTitle) {
      throw { status: 400, message: "Goal title is required." };
    }

    if (!input.subjectId) {
      throw { status: 400, message: "Subject ID is required." };
    }

    // Verify subject ownership
    await OwnershipService.validateSubject(userId, input.subjectId);

    const initialProgress =
      typeof input.progress === "number" && input.progress >= 0 && input.progress <= 100
        ? input.progress
        : 0;

    return prisma.goal.create({
      data: {
        userId,
        subjectId: input.subjectId,
        title: cleanTitle,
        description: input.description?.trim() || null,
        targetDate: input.targetDate || null,
        status: input.status || (initialProgress === 100 ? GoalStatus.COMPLETED : GoalStatus.ACTIVE),
        progress: initialProgress,
      },
      include: {
        subject: {
          select: { id: true, name: true, color: true },
        },
      },
    });
  }

  /**
   * Update an existing goal after ownership and subject validation.
   */
  static async updateGoal(userId: string, goalId: string, input: UpdateGoalInput) {
    const existingGoal = await this.getGoalById(userId, goalId);

    const updateData: any = {};

    if (input.subjectId !== undefined && input.subjectId !== existingGoal.subjectId) {
      await OwnershipService.validateSubject(userId, input.subjectId);
      updateData.subjectId = input.subjectId;
    }

    if (input.title !== undefined) {
      const cleanTitle = input.title.trim();
      if (!cleanTitle) {
        throw { status: 400, message: "Goal title cannot be empty." };
      }
      updateData.title = cleanTitle;
    }

    if (input.description !== undefined) {
      updateData.description = input.description ? input.description.trim() : null;
    }

    if (input.targetDate !== undefined) {
      updateData.targetDate = input.targetDate;
    }

    if (input.progress !== undefined) {
      if (typeof input.progress !== "number" || input.progress < 0 || input.progress > 100) {
        throw { status: 400, message: "Goal progress must be a number between 0 and 100." };
      }
      updateData.progress = Math.round(input.progress);

      if (updateData.progress === 100) {
        updateData.status = GoalStatus.COMPLETED;
      }
    }

    if (input.status !== undefined) {
      updateData.status = input.status;
    }

    return prisma.goal.update({
      where: { id: goalId },
      data: updateData,
      include: {
        subject: {
          select: { id: true, name: true, color: true },
        },
      },
    });
  }

  /**
   * Delete goal cleanly (Tasks disassociate via goalId = null in database cascade rules).
   */
  static async deleteGoal(userId: string, goalId: string) {
    await this.getGoalById(userId, goalId);

    return prisma.goal.delete({
      where: { id: goalId },
    });
  }

  /**
   * Recalculate goal progress automatically based on linked tasks completion ratio.
   */
  static async recalculateGoalProgress(goalId: string, dbClient: any = prisma) {
    if (!goalId) return;

    const tasks = await dbClient.task.findMany({
      where: { goalId },
      select: { status: true },
    });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t: any) => t.status === "COMPLETED").length;

    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const status = progress === 100 ? GoalStatus.COMPLETED : GoalStatus.ACTIVE;

    await dbClient.goal.update({
      where: { id: goalId },
      data: {
        progress,
        status,
      },
    });
  }
}

export default GoalService;
