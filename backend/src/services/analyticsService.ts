import prisma from "../db/prisma.js";
import { SessionStatus, TaskStatus, GoalStatus } from "@prisma/client";

export interface AnalyticsQueryFilters {
  range?: string; // "today" | "7d" | "30d" | "90d" | "all"
  subjectId?: string;
}

export class AnalyticsService {
  /**
   * Generates full analytics overview derived strictly from PostgreSQL.
   */
  static async getAnalyticsOverview(userId: string, filters?: AnalyticsQueryFilters) {
    const range = filters?.range || "30d";
    const subjectId = filters?.subjectId && filters.subjectId !== "all" ? filters.subjectId : undefined;

    // 1. Calculate Date Range Bounds
    const now = new Date();
    let startDate: Date;
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (range === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    } else if (range === "7d") {
      startDate = new Date(now.getTime() - 7 * 86400000);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "90d") {
      startDate = new Date(now.getTime() - 90 * 86400000);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "all") {
      startDate = new Date(0);
    } else {
      // Default: "30d"
      startDate = new Date(now.getTime() - 30 * 86400000);
      startDate.setHours(0, 0, 0, 0);
    }

    // 2. Fetch User Subjects
    const userSubjects = await prisma.subject.findMany({
      where: { userId, ...(subjectId ? { id: subjectId } : {}) },
      select: { id: true, name: true, color: true },
    });

    // 3. Fetch Completed Study Sessions in Date Range
    const sessionWhere: any = {
      userId,
      status: SessionStatus.COMPLETED,
      startedAt: { gte: startDate, lte: endDate },
    };
    if (subjectId) sessionWhere.subjectId = subjectId;

    const completedSessions = await prisma.studySession.findMany({
      where: sessionWhere,
      select: {
        id: true,
        subjectId: true,
        actualDuration: true,
        startedAt: true,
      },
      orderBy: { startedAt: "asc" },
    });

    // Compute Study Time Totals
    const totalStudyTimeSeconds = completedSessions.reduce((acc, s) => acc + (s.actualDuration || 0), 0);
    const completedSessionsCount = completedSessions.length;

    // Distinct Study Days
    const studyDaySet = new Set<string>();
    const dailyStudyTimeMap = new Map<string, number>();

    completedSessions.forEach((s) => {
      const dateStr = s.startedAt.toISOString().split("T")[0];
      studyDaySet.add(dateStr);
      const current = dailyStudyTimeMap.get(dateStr) || 0;
      dailyStudyTimeMap.set(dateStr, current + (s.actualDuration || 0));
    });

    const studyDaysCount = studyDaySet.size;

    // Calculate Current Streak (consecutive days leading up to today with completed sessions)
    const allUserCompletedSessions = await prisma.studySession.findMany({
      where: { userId, status: SessionStatus.COMPLETED },
      select: { startedAt: true },
      orderBy: { startedAt: "desc" },
    });
    const allStudyDates = new Set(allUserCompletedSessions.map(s => s.startedAt.toISOString().split("T")[0]));

    let currentStreak = 0;
    const checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    // If no study today, check if study occurred yesterday to keep streak active
    const todayStr = checkDate.toISOString().split("T")[0];
    if (!allStudyDates.has(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dateKey = checkDate.toISOString().split("T")[0];
      if (allStudyDates.has(dateKey)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // 4. Daily Study Activity Chart Data
    const dailyActivityChart: { date: string; seconds: number; formattedDuration: string }[] = [];
    const dateCursor = new Date(startDate);
    const endCursor = new Date(endDate);

    while (dateCursor <= endCursor) {
      const dateKey = dateCursor.toISOString().split("T")[0];
      const seconds = dailyStudyTimeMap.get(dateKey) || 0;
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);

      dailyActivityChart.push({
        date: dateKey,
        seconds,
        formattedDuration: hours > 0 ? `${hours}h ${mins}m` : `${mins}m`,
      });
      dateCursor.setDate(dateCursor.getDate() + 1);
    }

    // 5. Subject Study-Time & Task Breakdown
    const subjectBreakdown = await Promise.all(
      userSubjects.map(async (sub) => {
        const subSessions = completedSessions.filter((s) => s.subjectId === sub.id);
        const studyTimeSeconds = subSessions.reduce((acc, s) => acc + (s.actualDuration || 0), 0);

        const subTasksTotal = await prisma.task.count({
          where: { userId, subjectId: sub.id },
        });
        const subTasksCompleted = await prisma.task.count({
          where: { userId, subjectId: sub.id, status: TaskStatus.COMPLETED },
        });

        const subGoals = await prisma.goal.findMany({
          where: { userId, subjectId: sub.id, status: { not: GoalStatus.COMPLETED } },
          select: { progress: true },
        });
        const goalProgAvg = subGoals.length > 0
          ? Math.round(subGoals.reduce((acc, g) => acc + g.progress, 0) / subGoals.length)
          : 0;

        return {
          subjectId: sub.id,
          subjectName: sub.name,
          color: sub.color || "#06B6D4",
          studyTimeSeconds,
          completedTasks: subTasksCompleted,
          totalTasks: subTasksTotal,
          goalProgressPercentage: goalProgAvg,
        };
      })
    );
    subjectBreakdown.sort((a, b) => b.studyTimeSeconds - a.studyTimeSeconds);

    // 6. Task Metrics & Overdue Calculation
    const taskWhere: any = { userId };
    if (subjectId) taskWhere.subjectId = subjectId;

    const totalTasks = await prisma.task.count({ where: taskWhere });
    const tasksCompletedInPeriod = await prisma.task.count({
      where: {
        ...taskWhere,
        status: TaskStatus.COMPLETED,
        completedAt: { gte: startDate, lte: endDate },
      },
    });
    const tasksRemaining = await prisma.task.count({
      where: {
        ...taskWhere,
        status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
      },
    });

    const currentDateStr = new Date().toISOString().split("T")[0];
    const tasksOverdue = await prisma.task.count({
      where: {
        ...taskWhere,
        dueDate: { lt: currentDateStr },
        status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
      },
    });

    const taskCompletionRate = totalTasks > 0 ? Math.round((tasksCompletedInPeriod / totalTasks) * 100) : 0;

    // 7. Goals Progress Metrics
    const goalWhere: any = { userId };
    if (subjectId) goalWhere.subjectId = subjectId;

    const activeGoalsCount = await prisma.goal.count({
      where: { ...goalWhere, status: { not: GoalStatus.COMPLETED } },
    });
    const completedGoalsCount = await prisma.goal.count({
      where: { ...goalWhere, status: GoalStatus.COMPLETED },
    });

    const activeGoalsList = await prisma.goal.findMany({
      where: { ...goalWhere, status: { not: GoalStatus.COMPLETED } },
      select: {
        id: true,
        title: true,
        progress: true,
        subject: { select: { name: true, color: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    });

    // 8. Resource Statistics
    const resourceWhere: any = { userId };
    if (subjectId) resourceWhere.subjectId = subjectId;

    const savedResourcesCount = await prisma.resource.count({
      where: { ...resourceWhere, isSaved: true },
    });
    const aiSuggestedResourcesCount = await prisma.resource.count({
      where: { ...resourceWhere, isSaved: true, isAISuggested: true },
    });
    const openedResourcesCount = await prisma.resource.count({
      where: { ...resourceWhere, lastOpenedAt: { not: null } },
    });

    return {
      range,
      subjectId: subjectId || "all",
      overview: {
        totalStudyTimeSeconds,
        completedSessions: completedSessionsCount,
        studyDays: studyDaysCount,
        currentStreak,
        tasksCompleted: tasksCompletedInPeriod,
        tasksRemaining,
        tasksOverdue,
        taskCompletionRate,
        activeGoals: activeGoalsCount,
        completedGoals: completedGoalsCount,
        averageDailyStudySeconds: studyDaysCount > 0 ? Math.round(totalStudyTimeSeconds / studyDaysCount) : 0,
        averageSessionSeconds: completedSessionsCount > 0 ? Math.round(totalStudyTimeSeconds / completedSessionsCount) : 0,
      },
      dailyActivityChart,
      subjectBreakdown,
      goals: {
        activeCount: activeGoalsCount,
        completedCount: completedGoalsCount,
        activeGoalsList,
      },
      resources: {
        savedCount: savedResourcesCount,
        aiSuggestedCount: aiSuggestedResourcesCount,
        openedCount: openedResourcesCount,
      },
    };
  }
}

export default AnalyticsService;
