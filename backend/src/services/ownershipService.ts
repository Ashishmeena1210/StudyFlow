import prisma from "../db/prisma.js";

/**
 * Service to enforce User Data Isolation and Cross-User Relationship Validation.
 * Ensures that all entity references (subjectId, goalId, taskId) belong strictly to the authenticated user.
 */
export class OwnershipService {
  /**
   * Verify that a Subject exists and belongs to the authenticated user.
   */
  static async validateSubject(userId: string, subjectId: string): Promise<boolean> {
    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, userId },
      select: { id: true },
    });

    if (!subject) {
      throw new Error(`Unauthorized or invalid subjectId "${subjectId}" for current user.`);
    }

    return true;
  }

  /**
   * Verify that a Goal belongs to the authenticated user and matches the subjectId if provided.
   */
  static async validateGoal(userId: string, goalId: string, subjectId?: string): Promise<boolean> {
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId },
      select: { id: true, subjectId: true },
    });

    if (!goal) {
      throw new Error(`Unauthorized or invalid goalId "${goalId}" for current user.`);
    }

    if (subjectId && goal.subjectId !== subjectId) {
      throw new Error(`Cross-entity mismatch: Goal "${goalId}" belongs to subject "${goal.subjectId}", not "${subjectId}".`);
    }

    return true;
  }

  /**
   * Verify that a Task belongs to the authenticated user and matches subjectId/goalId if provided.
   */
  static async validateTask(
    userId: string,
    taskId: string,
    subjectId?: string,
    goalId?: string
  ): Promise<boolean> {
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId },
      select: { id: true, subjectId: true, goalId: true },
    });

    if (!task) {
      throw new Error(`Unauthorized or invalid taskId "${taskId}" for current user.`);
    }

    if (subjectId && task.subjectId !== subjectId) {
      throw new Error(`Cross-entity mismatch: Task "${taskId}" belongs to subject "${task.subjectId}", not "${subjectId}".`);
    }

    if (goalId && task.goalId && task.goalId !== goalId) {
      throw new Error(`Cross-entity mismatch: Task "${taskId}" belongs to goal "${task.goalId}", not "${goalId}".`);
    }

    return true;
  }
}

export default OwnershipService;
