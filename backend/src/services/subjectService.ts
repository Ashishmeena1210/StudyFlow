import prisma from "../db/prisma.js";
import { SubjectStatus } from "@prisma/client";

export interface CreateSubjectInput {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  targetDate?: string;
  status?: SubjectStatus;
}

export interface UpdateSubjectInput {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  targetDate?: string;
  status?: SubjectStatus;
}

export class SubjectService {
  /**
   * Get all subjects belonging to the authenticated user.
   */
  static async getSubjects(userId: string) {
    return prisma.subject.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get a single subject by ID, verifying user ownership.
   */
  static async getSubjectById(userId: string, subjectId: string) {
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      throw { status: 404, message: "Subject not found." };
    }

    if (subject.userId !== userId) {
      throw { status: 403, message: "Access forbidden: You do not own this subject." };
    }

    return subject;
  }

  /**
   * Create a new subject for the authenticated user.
   */
  static async createSubject(userId: string, input: CreateSubjectInput) {
    const cleanName = input.name ? input.name.trim() : "";

    if (!cleanName) {
      throw { status: 400, message: "Subject name is required." };
    }

    if (cleanName.length > 100) {
      throw { status: 400, message: "Subject name must not exceed 100 characters." };
    }

    // Check for duplicate name for this user
    const existing = await prisma.subject.findUnique({
      where: {
        userId_name: {
          userId,
          name: cleanName,
        },
      },
    });

    if (existing) {
      throw { status: 409, message: `A subject named "${cleanName}" already exists in your library.` };
    }

    return prisma.subject.create({
      data: {
        userId,
        name: cleanName,
        description: input.description?.trim() || null,
        color: input.color || "#06B6D4",
        icon: input.icon || null,
        targetDate: input.targetDate || null,
        status: input.status || SubjectStatus.ACTIVE,
      },
    });
  }

  /**
   * Update an existing subject after ownership authorization check.
   */
  static async updateSubject(userId: string, subjectId: string, input: UpdateSubjectInput) {
    // 1. Verify existence & ownership
    const existingSubject = await this.getSubjectById(userId, subjectId);

    const updateData: any = {};

    if (input.name !== undefined) {
      const cleanName = input.name.trim();
      if (!cleanName) {
        throw { status: 400, message: "Subject name cannot be empty." };
      }
      if (cleanName.length > 100) {
        throw { status: 400, message: "Subject name must not exceed 100 characters." };
      }

      if (cleanName !== existingSubject.name) {
        // Check for duplicate name collision
        const duplicate = await prisma.subject.findUnique({
          where: {
            userId_name: {
              userId,
              name: cleanName,
            },
          },
        });
        if (duplicate) {
          throw { status: 409, message: `A subject named "${cleanName}" already exists in your library.` };
        }
      }
      updateData.name = cleanName;
    }

    if (input.description !== undefined) {
      updateData.description = input.description ? input.description.trim() : null;
    }

    if (input.color !== undefined) {
      updateData.color = input.color;
    }

    if (input.icon !== undefined) {
      updateData.icon = input.icon;
    }

    if (input.targetDate !== undefined) {
      updateData.targetDate = input.targetDate;
    }

    if (input.status !== undefined) {
      updateData.status = input.status;
    }

    return prisma.subject.update({
      where: { id: subjectId },
      data: updateData,
    });
  }

  /**
   * Delete a subject after ownership authorization check.
   */
  static async deleteSubject(userId: string, subjectId: string) {
    // 1. Verify existence & ownership
    await this.getSubjectById(userId, subjectId);

    // 2. Perform deletion (Cascades dependent entities based on schema)
    return prisma.subject.delete({
      where: { id: subjectId },
    });
  }
}

export default SubjectService;
