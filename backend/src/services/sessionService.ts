import prisma from "../db/prisma.js";
import OwnershipService from "./ownershipService.js";
import { SessionStatus, SessionType } from "@prisma/client";

export interface CreateSessionInput {
  subjectId: string;
  goalId?: string;
  taskId?: string;
  sessionType?: SessionType;
  plannedDuration: number; // in seconds
  sessionIntent?: string;
}

export interface CompleteSessionInput {
  completionResult?: string;
  reflection?: string;
  qualityRating?: number;
}

export class SessionService {
  /**
   * Get current active session for the authenticated user (or null).
   */
  static async getActiveSession(userId: string) {
    return prisma.studySession.findFirst({
      where: {
        userId,
        status: SessionStatus.ACTIVE,
      },
      include: {
        subject: { select: { id: true, name: true, color: true } },
        goal: { select: { id: true, title: true } },
        task: { select: { id: true, title: true } },
      },
    });
  }

  /**
   * Get study sessions for the authenticated user with optional filtering.
   */
  static async getStudySessions(
    userId: string,
    filters?: {
      subjectId?: string;
      goalId?: string;
      taskId?: string;
      status?: SessionStatus;
      sessionType?: SessionType;
    }
  ) {
    const where: any = { userId };

    if (filters?.subjectId) where.subjectId = filters.subjectId;
    if (filters?.goalId) where.goalId = filters.goalId;
    if (filters?.taskId) where.taskId = filters.taskId;
    if (filters?.status) where.status = filters.status;
    if (filters?.sessionType) where.sessionType = filters.sessionType;

    return prisma.studySession.findMany({
      where,
      include: {
        subject: { select: { id: true, name: true, color: true } },
        goal: { select: { id: true, title: true } },
        task: { select: { id: true, title: true } },
      },
      orderBy: { startedAt: "desc" },
    });
  }

  /**
   * Get single session by ID with ownership verification.
   */
  static async getStudySessionById(userId: string, sessionId: string) {
    const session = await prisma.studySession.findUnique({
      where: { id: sessionId },
      include: {
        subject: { select: { id: true, name: true, color: true } },
        goal: { select: { id: true, title: true } },
        task: { select: { id: true, title: true } },
      },
    });

    if (!session) {
      throw { status: 404, message: "Study session not found." };
    }

    if (session.userId !== userId) {
      throw { status: 403, message: "Access forbidden: You do not own this study session." };
    }

    return session;
  }

  /**
   * Create a new active study session after validating relationship ownership.
   */
  static async createStudySession(userId: string, input: CreateSessionInput) {
    // 1. Check for an existing active session
    const existingActive = await this.getActiveSession(userId);
    if (existingActive) {
      throw { status: 409, message: "You already have an active study session. Complete or cancel it first." };
    }

    if (!input.subjectId) {
      throw { status: 400, message: "Subject ID is required." };
    }

    if (!input.plannedDuration || typeof input.plannedDuration !== "number" || input.plannedDuration <= 0) {
      throw { status: 400, message: "Planned duration must be a positive number of seconds." };
    }

    // 2. Validate subject ownership
    try {
      await OwnershipService.validateSubject(userId, input.subjectId);
    } catch (err: any) {
      throw { status: 403, message: err.message };
    }

    // 3. Validate Goal ownership & match if provided
    if (input.goalId) {
      try {
        await OwnershipService.validateGoal(userId, input.goalId, input.subjectId);
      } catch (err: any) {
        throw { status: 400, message: err.message };
      }
    }

    // 4. Validate Task ownership & match if provided
    if (input.taskId) {
      try {
        await OwnershipService.validateTask(userId, input.taskId, input.subjectId, input.goalId);
      } catch (err: any) {
        throw { status: 400, message: err.message };
      }
    }

    return prisma.studySession.create({
      data: {
        userId,
        subjectId: input.subjectId,
        goalId: input.goalId || null,
        taskId: input.taskId || null,
        sessionType: input.sessionType || SessionType.FOCUS,
        plannedDuration: input.plannedDuration,
        actualDuration: 0,
        startedAt: new Date(),
        status: SessionStatus.ACTIVE,
        sessionIntent: input.sessionIntent?.trim() || null,
      },
      include: {
        subject: { select: { id: true, name: true, color: true } },
        goal: { select: { id: true, title: true } },
        task: { select: { id: true, title: true } },
      },
    });
  }

  /**
   * Complete an active study session, automatically computing actualDuration.
   */
  static async completeStudySession(
    userId: string,
    sessionId: string,
    input?: CompleteSessionInput
  ) {
    const session = await this.getStudySessionById(userId, sessionId);

    const now = new Date();
    const startTime = new Date(session.startedAt).getTime();
    const calculatedActualDuration = Math.max(1, Math.round((now.getTime() - startTime) / 1000));

    return prisma.studySession.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.COMPLETED,
        endedAt: now,
        actualDuration: session.status === SessionStatus.ACTIVE ? calculatedActualDuration : session.actualDuration,
        completionResult: input?.completionResult?.trim() || session.completionResult || null,
        reflection: input?.reflection?.trim() || session.reflection || null,
        qualityRating: input?.qualityRating || session.qualityRating || null,
      },
      include: {
        subject: { select: { id: true, name: true, color: true } },
        goal: { select: { id: true, title: true } },
        task: { select: { id: true, title: true } },
      },
    });
  }

  /**
   * Cancel an active study session.
   */
  static async cancelStudySession(userId: string, sessionId: string) {
    const session = await this.getStudySessionById(userId, sessionId);

    const now = new Date();

    return prisma.studySession.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.CANCELLED,
        endedAt: now,
      },
      include: {
        subject: { select: { id: true, name: true, color: true } },
        goal: { select: { id: true, title: true } },
        task: { select: { id: true, title: true } },
      },
    });
  }
}

export default SessionService;
