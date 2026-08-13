import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Brain,
  Flame,
  Clock3,
  CheckCircle2,
  TrendingUp,
  Target,
  Plus,
  Sparkles,
} from "lucide-react";

import AppShell from "../components/appshell";
import TaskCard from "./tasks/components/taskcard";
import { useTasks } from "../context/taskcontext";
import { useSubjects } from "../context/subjectcontext";
import { useSessions } from "../context/sessioncontext";

export default function Dashboard() {
  const navigate = useNavigate();

  const { tasks, toggleTask } = useTasks();
  const { subjects } = useSubjects();
  const { sessions } = useSessions();

  const [aiSuggestionIndex, setAiSuggestionIndex] = useState(0);

  const getLocalDateString = (d: Date = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayStr = useMemo(() => getLocalDateString(), []);

  const formattedHeaderDate = useMemo(() => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    };
    return new Date().toLocaleDateString("en-US", options);
  }, []);

  // TODAY'S / PENDING TASKS
  const todaysTasks = useMemo(() => {
    const dueOrToday = tasks.filter(
      (t) => t.dueDate === todayStr || (!t.completed && t.dueDate <= todayStr)
    );
    if (dueOrToday.length > 0) return dueOrToday.slice(0, 5);
    return tasks.filter((t) => !t.completed).slice(0, 5);
  }, [tasks, todayStr]);

  const completedTasks = useMemo(() => tasks.filter((t) => t.completed).length, [tasks]);

  const overallTasksProgress = useMemo(() => {
    return tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  }, [tasks, completedTasks]);

  // CALCULATE TODAY'S STUDY MINUTES
  const todaysStudyMinutes = useMemo(() => {
    return sessions
      .filter((s) => s.status === "completed" && s.createdAt.startsWith(todayStr))
      .reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  }, [sessions, todayStr]);

  const studyHoursText = useMemo(() => {
    const hrs = Math.floor(todaysStudyMinutes / 60);
    const mins = todaysStudyMinutes % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  }, [todaysStudyMinutes]);

  // DYNAMIC AI SUGGESTIONS ENGINE
  const aiSuggestions = useMemo(() => {
    const list: {
      text: string;
      subjectName: string;
      taskTitle: string;
      taskId?: string;
      subjectId?: string;
    }[] = [];

    const activeHighPriorityTask = tasks.find((t) => !t.completed && t.priority === "high");
    if (activeHighPriorityTask) {
      list.push({
        text: `High priority task "${activeHighPriorityTask.title}" is pending in ${activeHighPriorityTask.subject}. Focus on completing this today to stay on track.`,
        subjectName: activeHighPriorityTask.subject,
        taskTitle: activeHighPriorityTask.title,
        taskId: activeHighPriorityTask.id,
        subjectId: activeHighPriorityTask.subjectId,
      });
    }

    subjects.forEach((sub) => {
      const subTasks = tasks.filter((t) => t.subject.toLowerCase() === sub.name.toLowerCase() && !t.completed);
      if (subTasks.length > 0) {
        list.push({
          text: `You have ${subTasks.length} uncompleted tasks in ${sub.name}. We recommend spending your next study session revising ${subTasks[0].title}.`,
          subjectName: sub.name,
          taskTitle: subTasks[0].title,
          taskId: subTasks[0].id,
          subjectId: sub.id,
        });
      }
    });

    if (list.length === 0) {
      list.push({
        text: "Great job! You have completed all active tasks. Consider starting a revision focus session on Computer Networks or DBMS.",
        subjectName: "Networks",
        taskTitle: "Network Layer Protocols",
      });
    }

    return list;
  }, [tasks, subjects]);

  const currentAiSuggestion = aiSuggestions[aiSuggestionIndex % aiSuggestions.length];

  const handleRefreshAi = () => {
    setAiSuggestionIndex((prev) => (prev + 1) % aiSuggestions.length);
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto pb-10">

        {/* ================= HEADER ================= */}
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium text-[#64748B]">{formattedHeaderDate}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#E5E7EB]">
              Good morning 👋
            </h1>
            <p className="mt-1 text-xs text-[#94A3B8]">
              Stay focused and make steady progress today.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/sessions")}
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-[#06B6D4]
              px-4
              py-2.5
              text-xs
              font-bold
              text-[#020617]
              shadow-lg
              shadow-[#06B6D4]/10
              transition-all
              hover:bg-[#22D3EE]
              active:scale-[0.98]
            "
          >
            <Clock3 size={15} />
            Start studying
          </button>
        </section>

        {/* ================= SUMMARY CARDS ================= */}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {/* STUDY TIME */}
          <div className="rounded-xl border border-[#1F2937] bg-[#0B1120] p-4 transition-all hover:border-[#374151]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-[#64748B]">Today's study time</p>
                <p className="mt-2 text-2xl font-bold text-[#E5E7EB]">{studyHoursText}</p>
                <p className="mt-1 text-xs text-[#64748B]">Target: 3 hours</p>
              </div>
              <div className="rounded-lg bg-cyan-400/10 p-2 text-cyan-400">
                <Clock3 size={18} />
              </div>
            </div>
          </div>

          {/* STREAK */}
          <div className="rounded-xl border border-[#1F2937] bg-[#0B1120] p-4 transition-all hover:border-[#374151]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-[#64748B]">Current streak</p>
                <p className="mt-2 text-2xl font-bold text-[#E5E7EB]">7 days</p>
                <p className="mt-1 text-xs text-[#64748B]">Consistency streak</p>
              </div>
              <div className="rounded-lg bg-orange-400/10 p-2 text-orange-400">
                <Flame size={18} />
              </div>
            </div>
          </div>

          {/* TASKS */}
          <div className="rounded-xl border border-[#1F2937] bg-[#0B1120] p-4 transition-all hover:border-[#374151]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-[#64748B]">Tasks today</p>
                <p className="mt-2 text-2xl font-bold text-[#E5E7EB]">{todaysTasks.length}</p>
                <p className="mt-1 text-xs text-[#64748B]">{completedTasks} completed total</p>
              </div>
              <div className="rounded-lg bg-emerald-400/10 p-2 text-emerald-400">
                <CheckCircle2 size={18} />
              </div>
            </div>
          </div>

          {/* WEEKLY PROGRESS */}
          <div className="rounded-xl border border-[#1F2937] bg-[#0B1120] p-4 transition-all hover:border-[#374151]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-[#64748B]">Overall task progress</p>
                <p className="mt-2 text-2xl font-bold text-[#E5E7EB]">{overallTasksProgress}%</p>
                <p className="mt-1 text-xs text-[#64748B]">Completion rate</p>
              </div>
              <div className="rounded-lg bg-violet-400/10 p-2 text-violet-400">
                <TrendingUp size={18} />
              </div>
            </div>
          </div>
        </section>

        {/* ================= MAIN CONTENT ================= */}
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">

          {/* ================= TODAY'S TASKS ================= */}
          <div className="rounded-2xl border border-[#1F2937] bg-[#0B1120] p-5 shadow-lg">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#E5E7EB]">Today's tasks</h2>
                <p className="mt-0.5 text-xs text-[#64748B]">
                  What you need to focus on today
                </p>
              </div>

              <Link
                to="/planner"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#06B6D4] hover:text-[#22D3EE]"
              >
                View all <ArrowRight size={13} />
              </Link>
            </div>

            {/* TASK CARDS OR EMPTY STATE */}
            {todaysTasks.length > 0 ? (
              <div className="space-y-3">
                {todaysTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    title={task.title}
                    description={task.description}
                    subject={task.subject}
                    priority={task.priority}
                    dueDate={task.dueDate}
                    completed={task.completed}
                    onToggleComplete={() => toggleTask(task.id)}
                    onStartSession={() =>
                      navigate(`/sessions?taskId=${task.id}&subjectId=${task.subjectId || ""}`)
                    }
                    onSelect={() => navigate("/planner")}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#1F2937] bg-[#020617] p-8 text-center space-y-3">
                <CheckCircle2 size={32} className="mx-auto text-emerald-400" />
                <h3 className="text-xs font-bold text-[#E5E7EB]">No tasks due today!</h3>
                <p className="text-[11px] text-[#64748B]">
                  Add study tasks in your Study Planner to stay organized.
                </p>
                <Link
                  to="/planner"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#06B6D4] px-3.5 py-2 text-xs font-bold text-[#020617]"
                >
                  <Plus size={14} /> Add Task in Planner
                </Link>
              </div>
            )}
          </div>

          {/* ================= AI STUDY SUGGESTION ================= */}
          <div className="rounded-2xl border border-[#1F2937] bg-[#0B1120] p-5 shadow-lg space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-violet-400/10 p-2 text-violet-400">
                  <Brain size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#E5E7EB]">AI study suggestion</h2>
                  <p className="text-[11px] text-[#64748B]">Based on your current plan</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRefreshAi}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#06B6D4] hover:underline"
              >
                <Sparkles size={12} /> Refresh
              </button>
            </div>

            <div className="rounded-xl border border-violet-400/20 bg-violet-400/5 p-4 text-xs leading-relaxed text-[#CBD5E1]">
              "{currentAiSuggestion.text}"
            </div>

            <div>
              <p className="text-xs font-medium text-[#64748B]">Recommended focus</p>
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/sessions?${
                      currentAiSuggestion.taskId
                        ? `taskId=${currentAiSuggestion.taskId}`
                        : `subjectId=${currentAiSuggestion.subjectId || ""}`
                    }`
                  )
                }
                className="
                  mt-2
                  flex
                  w-full
                  items-center
                  justify-between
                  rounded-xl
                  border
                  border-[#1F2937]
                  bg-[#020617]
                  p-3.5
                  text-left
                  transition-all
                  hover:border-[#06B6D4]/50
                  hover:bg-[#0F172A]
                "
              >
                <div>
                  <span className="rounded bg-[#06B6D4]/10 px-2 py-0.5 text-[10px] font-bold text-[#06B6D4]">
                    {currentAiSuggestion.subjectName}
                  </span>
                  <p className="mt-1 text-xs font-semibold text-[#E5E7EB]">
                    {currentAiSuggestion.taskTitle}
                  </p>
                </div>
                <ArrowRight size={15} className="text-[#06B6D4]" />
              </button>
            </div>

            <div className="border-t border-[#1F2937] pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target size={16} className="text-[#06B6D4]" />
                  <span className="text-xs font-bold text-[#E5E7EB]">
                    Study Planner ({tasks.length})
                  </span>
                </div>
                <Link
                  to="/planner"
                  className="flex items-center gap-1 text-xs font-bold text-[#06B6D4] hover:underline"
                >
                  Planner <ArrowRight size={12} />
                </Link>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] text-[#94A3B8] mb-1.5">
                  <span>Task Completion</span>
                  <span className="font-bold text-[#E5E7EB]">{overallTasksProgress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#020617]">
                  <div
                    className="h-full rounded-full bg-[#06B6D4] transition-all duration-300"
                    style={{ width: `${overallTasksProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= STUDY ACTIVITY ================= */}
        <section className="rounded-2xl border border-[#1F2937] bg-[#0B1120] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#E5E7EB]">Study activity</h2>
              <p className="mt-0.5 text-xs text-[#64748B]">
                Your study hours over the last 7 days
              </p>
            </div>

            <Link
              to="/analytics"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#06B6D4] hover:text-[#22D3EE]"
            >
              Analytics <ArrowRight size={13} />
            </Link>
          </div>

          <div className="mt-6 flex h-36 items-end gap-3">
            {[
              { day: "Mon", hours: 2.2 },
              { day: "Tue", hours: 3.1 },
              { day: "Wed", hours: 1.8 },
              { day: "Thu", hours: 3.7 },
              { day: "Fri", hours: 2.6 },
              { day: "Sat", hours: 4.1 },
              { day: "Sun", hours: 2.5 },
            ].map((item) => (
              <div
                key={item.day}
                className="flex h-full flex-1 flex-col items-center justify-end gap-2"
              >
                <div
                  className="w-full max-w-10 rounded-t-md bg-[#06B6D4]/70 transition-all hover:bg-[#06B6D4]"
                  style={{ height: `${(item.hours / 5) * 100}%` }}
                  title={`${item.hours} hours`}
                />
                <span className="text-[10px] font-medium text-[#64748B]">{item.day}</span>
              </div>
            ))}
          </div>
        </section>

      </div>
    </AppShell>
  );
}