import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  CheckCircle2,
  Flame,
  TrendingUp,
  BookOpen,
  Sparkles,
  Play,
  ArrowRight,
  AlertCircle,
  Filter,
} from "lucide-react";

import AppShell from "../../components/appshell";
import { useSubjects } from "../../context/subjectcontext";
import { fetchAnalyticsOverviewApi, type AnalyticsOverviewData } from "../../api/analyticsApi";

type DateRange = "today" | "7d" | "30d" | "90d" | "all";

const dateRangeOptions: { value: DateRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "all", label: "All Time" },
];

export default function AnalyticsPage() {
  const { subjects } = useSubjects();

  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");

  const [analyticsData, setAnalyticsData] = useState<AnalyticsOverviewData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAnalyticsOverviewApi({
        range: dateRange,
        subjectId: selectedSubjectId,
      });
      setAnalyticsData(data);
    } catch (err: any) {
      console.warn("Failed to load analytics overview:", err);
      setError("Unable to load analytics from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [dateRange, selectedSubjectId]);

  const formatSeconds = (totalSecs: number) => {
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  const overview = analyticsData?.overview;

  return (
    <AppShell>
      <div className="min-h-full w-full relative pb-12">
        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 size={24} className="text-[#06B6D4]" />
              <h1 className="text-2xl font-bold tracking-tight text-[#E5E7EB]">
                Analytics
              </h1>
            </div>
            <p className="mt-1 text-sm text-[#64748B]">
              Understand your study habits, track your progress, and improve your consistency.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* SUBJECT FILTER */}
            <div className="flex items-center gap-2 rounded-xl border border-[#1F2937] bg-[#0B1120] px-3 py-1.5 text-xs text-[#94A3B8]">
              <Filter size={14} className="text-[#06B6D4]" />
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="bg-transparent text-[#E5E7EB] focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-[#0B1120] text-[#E5E7EB]">All Subjects</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id} className="bg-[#0B1120] text-[#E5E7EB]">
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            {/* DATE RANGE SELECTOR */}
            <div className="flex items-center gap-1.5 rounded-xl border border-[#1F2937] bg-[#0B1120] p-1">
              {dateRangeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDateRange(opt.value)}
                  className={`
                    rounded-lg
                    px-3
                    py-1.5
                    text-xs
                    font-medium
                    transition-all
                    ${
                      dateRange === opt.value
                        ? "bg-[#06B6D4]/15 text-[#06B6D4]"
                        : "text-[#64748B] hover:text-[#E5E7EB]"
                    }
                  `}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          /* LOADING STATE */
          <div className="rounded-2xl border border-[#1F2937] bg-[#0B1120] py-24 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#06B6D4] border-t-transparent mb-3" />
            <h3 className="text-sm font-semibold text-[#94A3B8]">Calculating study analytics...</h3>
          </div>
        ) : error ? (
          /* ERROR STATE */
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
            <AlertCircle size={32} className="mx-auto mb-2 text-red-400" />
            <h3 className="text-sm font-semibold text-red-400">{error}</h3>
            <button
              onClick={loadAnalytics}
              className="mt-4 rounded-xl bg-[#06B6D4] px-4 py-2 text-xs font-semibold text-[#020617] hover:bg-[#22D3EE]"
            >
              Retry
            </button>
          </div>
        ) : !analyticsData || overview?.completedSessions === 0 ? (
          /* EMPTY STATE */
          <div className="rounded-2xl border border-dashed border-[#1F2937] bg-[#0B1120] py-20 text-center">
            <BarChart3 size={40} className="mx-auto mb-3 text-[#334155]" />
            <h3 className="text-base font-semibold text-[#94A3B8]">No study activity yet</h3>
            <p className="mt-1 text-xs text-[#64748B] max-w-sm mx-auto">
              Complete your first study session to start unlocking rich analytics and study insights.
            </p>
            <Link
              to="/timer"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#06B6D4] px-5 py-2.5 text-xs font-semibold text-[#020617] hover:bg-[#22D3EE]"
            >
              <Play size={15} fill="currentColor" />
              Start Studying
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* OVERVIEW METRICS GRID */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <div className="rounded-xl border border-[#1F2937] bg-[#0B1120] p-4 transition-all hover:border-[#374151]">
                <span className="text-[11px] font-medium text-[#64748B]">Total Study Time</span>
                <p className="mt-1.5 text-xl font-bold text-[#E5E7EB]">
                  {formatSeconds(overview?.totalStudyTimeSeconds || 0)}
                </p>
              </div>

              <div className="rounded-xl border border-[#1F2937] bg-[#0B1120] p-4 transition-all hover:border-[#374151]">
                <span className="text-[11px] font-medium text-[#64748B]">Study Sessions</span>
                <p className="mt-1.5 text-xl font-bold text-[#06B6D4]">{overview?.completedSessions || 0}</p>
              </div>

              <div className="rounded-xl border border-[#1F2937] bg-[#0B1120] p-4 transition-all hover:border-[#374151]">
                <span className="text-[11px] font-medium text-[#64748B]">Tasks Completed</span>
                <p className="mt-1.5 text-xl font-bold text-emerald-400">{overview?.tasksCompleted || 0}</p>
              </div>

              <div className="rounded-xl border border-[#1F2937] bg-[#0B1120] p-4 transition-all hover:border-[#374151]">
                <span className="text-[11px] font-medium text-[#64748B]">Active Goals</span>
                <p className="mt-1.5 text-xl font-bold text-amber-400">{overview?.activeGoals || 0}</p>
              </div>

              <div className="rounded-xl border border-[#1F2937] bg-[#0B1120] p-4 transition-all hover:border-[#374151]">
                <span className="text-[11px] font-medium text-[#64748B]">Current Streak</span>
                <p className="mt-1.5 text-xl font-bold text-orange-400">{overview?.currentStreak || 0} days</p>
              </div>

              <div className="rounded-xl border border-[#1F2937] bg-[#0B1120] p-4 transition-all hover:border-[#374151]">
                <span className="text-[11px] font-medium text-[#64748B]">Avg / Day</span>
                <p className="mt-1.5 text-xl font-bold text-violet-400">
                  {formatSeconds(overview?.averageDailyStudySeconds || 0)}
                </p>
              </div>
            </div>

            {/* CHARTS ROW: STUDY TIME CHART & SUBJECT BREAKDOWN */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* STUDY TIME CHART */}
              <div className="lg:col-span-2 rounded-2xl border border-[#1F2937] bg-[#0B1120] p-5 shadow-lg">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-[#06B6D4]" />
                    <h3 className="text-base font-bold text-[#E5E7EB]">Study Time Activity</h3>
                  </div>
                  <span className="text-xs text-[#64748B] capitalize">{dateRange} view</span>
                </div>

                <div className="grid grid-cols-7 gap-2 items-end h-48 pt-6">
                  {(analyticsData?.dailyActivityChart || []).slice(-7).map((item) => {
                    const maxSecs = Math.max(...(analyticsData?.dailyActivityChart || []).map(d => d.seconds), 3600);
                    const heightPercent = Math.round((item.seconds / maxSecs) * 100);

                    return (
                      <div key={item.date} className="flex flex-col items-center h-full justify-end group">
                        <span className="mb-1 text-xs font-semibold text-[#64748B] opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.formattedDuration}
                        </span>
                        <div className="w-full bg-[#111827] rounded-t-xl h-36 relative flex items-end">
                          <div
                            className="w-full rounded-t-xl transition-all duration-300 bg-[#06B6D4]/40 hover:bg-[#06B6D4]"
                            style={{ height: `${Math.max(item.seconds > 0 ? 10 : 0, heightPercent)}%` }}
                          />
                        </div>
                        <span className="mt-2 text-[10px] font-medium text-[#64748B] truncate max-w-full">
                          {item.date.slice(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* TIME BY SUBJECT */}
              <div className="rounded-2xl border border-[#1F2937] bg-[#0B1120] p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-base font-bold text-[#E5E7EB]">Time by Subject</h3>
                    <BookOpen size={16} className="text-[#06B6D4]" />
                  </div>

                  {(analyticsData?.subjectBreakdown || []).length > 0 ? (
                    <div className="space-y-4">
                      {analyticsData?.subjectBreakdown.map((item) => {
                        const totalSecs = overview?.totalStudyTimeSeconds || 1;
                        const pct = Math.round((item.studyTimeSeconds / totalSecs) * 100);

                        return (
                          <Link
                            key={item.subjectId}
                            to={`/subjects/${item.subjectId}`}
                            className="block group"
                          >
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="font-semibold text-[#E5E7EB] group-hover:text-[#06B6D4] transition-colors">
                                {item.subjectName}
                              </span>
                              <span className="font-bold text-[#94A3B8]">
                                {formatSeconds(item.studyTimeSeconds)} ({pct}%)
                              </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-[#111827]">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${Math.max(pct, 5)}%`,
                                  backgroundColor: item.color,
                                }}
                              />
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs text-[#64748B]">
                      No study time recorded for subjects in this period.
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[#1F2937] text-right">
                  <Link
                    to="/subjects"
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#06B6D4] hover:underline"
                  >
                    View All Subjects <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>

            {/* PERFORMANCE ROW: TASKS & GOALS */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* TASK PERFORMANCE */}
              <div className="rounded-2xl border border-[#1F2937] bg-[#0B1120] p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#E5E7EB]">Task Performance</h3>
                  <CheckCircle2 size={16} className="text-emerald-400" />
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl border border-[#1F2937] bg-[#020617] p-3">
                    <span className="text-[10px] text-[#64748B]">Completed</span>
                    <p className="text-lg font-bold text-emerald-400">{overview?.tasksCompleted || 0}</p>
                  </div>
                  <div className="rounded-xl border border-[#1F2937] bg-[#020617] p-3">
                    <span className="text-[10px] text-[#64748B]">Remaining</span>
                    <p className="text-lg font-bold text-amber-400">{overview?.tasksRemaining || 0}</p>
                  </div>
                  <div className="rounded-xl border border-[#1F2937] bg-[#020617] p-3">
                    <span className="text-[10px] text-[#64748B]">Overdue</span>
                    <p className="text-lg font-bold text-red-400">{overview?.tasksOverdue || 0}</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-[#94A3B8]">Task Completion Rate</span>
                    <span className="font-bold text-emerald-400">{overview?.taskCompletionRate || 0}%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#111827]">
                    <div
                      className="h-full rounded-full bg-emerald-400 transition-all duration-300"
                      style={{ width: `${overview?.taskCompletionRate || 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* GOAL PROGRESS */}
              <div className="rounded-2xl border border-[#1F2937] bg-[#0B1120] p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#E5E7EB]">Active Goals Progress</h3>
                  <Link
                    to="/planner"
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#06B6D4] hover:underline"
                  >
                    Planner <ArrowRight size={12} />
                  </Link>
                </div>

                {(analyticsData?.goals.activeGoalsList || []).length > 0 ? (
                  <div className="space-y-3">
                    {analyticsData?.goals.activeGoalsList.slice(0, 3).map((goal) => (
                      <div key={goal.id} className="rounded-xl border border-[#1F2937] bg-[#020617] p-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-[#E5E7EB] truncate max-w-[200px]">
                            {goal.title}
                          </span>
                          <span className="font-bold text-[#06B6D4]">{goal.progress}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-[#111827]">
                          <div
                            className="h-full rounded-full bg-[#06B6D4] transition-all"
                            style={{ width: `${goal.progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-[#64748B]">
                    No active goals set yet.
                  </div>
                )}
              </div>
            </div>

            {/* CONSISTENCY & RESOURCE METRICS */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* STUDY CONSISTENCY */}
              <div className="rounded-2xl border border-[#1F2937] bg-[#0B1120] p-5 shadow-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Flame size={18} className="text-orange-400" />
                  <h3 className="text-base font-bold text-[#E5E7EB]">Study Consistency</h3>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="rounded-xl border border-[#1F2937] bg-[#020617] p-3">
                    <span className="text-[#64748B]">Current Streak</span>
                    <p className="text-base font-bold text-orange-400 mt-1">{overview?.currentStreak || 0} days</p>
                  </div>

                  <div className="rounded-xl border border-[#1F2937] bg-[#020617] p-3">
                    <span className="text-[#64748B]">Active Study Days</span>
                    <p className="text-base font-bold text-[#06B6D4] mt-1">{overview?.studyDays || 0} days</p>
                  </div>

                  <div className="rounded-xl border border-[#1F2937] bg-[#020617] p-3">
                    <span className="text-[#64748B]">Average Session</span>
                    <p className="text-base font-bold text-violet-400 mt-1">{formatSeconds(overview?.averageSessionSeconds || 0)}</p>
                  </div>

                  <div className="rounded-xl border border-[#1F2937] bg-[#020617] p-3">
                    <span className="text-[#64748B]">Daily Average</span>
                    <p className="text-base font-bold text-emerald-400 mt-1">{formatSeconds(overview?.averageDailyStudySeconds || 0)}</p>
                  </div>
                </div>
              </div>

              {/* RESOURCE STATISTICS */}
              <div className="rounded-2xl border border-[#1F2937] bg-[#0B1120] p-5 shadow-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-[#06B6D4]" />
                  <h3 className="text-base font-bold text-[#E5E7EB]">Study Resources Metrics</h3>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2 text-xs text-center">
                  <div className="rounded-xl border border-[#1F2937] bg-[#020617] p-3">
                    <span className="text-[#64748B]">Saved</span>
                    <p className="text-base font-bold text-[#06B6D4] mt-1">{analyticsData?.resources.savedCount || 0}</p>
                  </div>

                  <div className="rounded-xl border border-[#1F2937] bg-[#020617] p-3">
                    <span className="text-[#64748B]">AI Suggested</span>
                    <p className="text-base font-bold text-violet-400 mt-1">{analyticsData?.resources.aiSuggestedCount || 0}</p>
                  </div>

                  <div className="rounded-xl border border-[#1F2937] bg-[#020617] p-3">
                    <span className="text-[#64748B]">Opened</span>
                    <p className="text-base font-bold text-emerald-400 mt-1">{analyticsData?.resources.openedCount || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
