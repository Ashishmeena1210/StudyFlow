import { apiClient } from "./client";

export interface AnalyticsOverviewData {
  range: string;
  subjectId: string;
  overview: {
    totalStudyTimeSeconds: number;
    completedSessions: number;
    studyDays: number;
    currentStreak: number;
    tasksCompleted: number;
    tasksRemaining: number;
    tasksOverdue: number;
    taskCompletionRate: number;
    activeGoals: number;
    completedGoals: number;
    averageDailyStudySeconds: number;
    averageSessionSeconds: number;
  };
  dailyActivityChart: {
    date: string;
    seconds: number;
    formattedDuration: string;
  }[];
  subjectBreakdown: {
    subjectId: string;
    subjectName: string;
    color: string;
    studyTimeSeconds: number;
    completedTasks: number;
    totalTasks: number;
    goalProgressPercentage: number;
  }[];
  goals: {
    activeCount: number;
    completedCount: number;
    activeGoalsList: {
      id: string;
      title: string;
      progress: number;
      subject: { name: string; color?: string };
    }[];
  };
  resources: {
    savedCount: number;
    aiSuggestedCount: number;
    openedCount: number;
  };
}

export async function fetchAnalyticsOverviewApi(filters?: {
  range?: string;
  subjectId?: string;
}): Promise<AnalyticsOverviewData> {
  const queryParams = new URLSearchParams();
  if (filters?.range) queryParams.append("range", filters.range);
  if (filters?.subjectId) queryParams.append("subjectId", filters.subjectId);

  const queryString = queryParams.toString();
  const endpoint = `/analytics/overview${queryString ? `?${queryString}` : ""}`;

  return apiClient<AnalyticsOverviewData>(endpoint, {
    method: "GET",
  });
}
