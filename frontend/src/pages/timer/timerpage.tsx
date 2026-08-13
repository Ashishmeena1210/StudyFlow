import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  BookOpen,
  Target,
  ListTodo,
  Clock,
  ArrowLeft,
} from "lucide-react";

import AppShell from "../../components/appshell";
import { useSubjects } from "../../context/subjectcontext";
import { useGoals } from "../../context/goalcontext";
import { useTasks } from "../../context/taskcontext";
import { useSessions, type SessionType } from "../../context/sessioncontext";

const sessionTypes: SessionType[] = [
  "Focus",
  "Review",
  "Practice",
  "Reading",
  "Revision",
  "Other",
];

const presetDurations = [
  { label: "15m", value: 15 },
  { label: "25m (Pomodoro)", value: 25 },
  { label: "45m", value: 45 },
  { label: "60m", value: 60 },
];

export default function TimerPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { subjects } = useSubjects();
  const { goals } = useGoals();
  const { tasks } = useTasks();
  const {
    activeSession,
    startActiveSession,
    pauseActiveSession,
    resumeActiveSession,
    tickActiveSession,
    finishActiveSession,
    cancelActiveSession,
  } = useSessions();

  // Selected setup state
  const paramSubId = searchParams.get("subjectId") || "";
  const paramGoalId = searchParams.get("goalId") || "";
  const paramTaskId = searchParams.get("taskId") || "";

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    paramSubId || (subjects[0]?.id || "")
  );
  const [selectedGoalId, setSelectedGoalId] = useState<string>(paramGoalId);
  const [selectedTaskId, setSelectedTaskId] = useState<string>(paramTaskId);
  const [sessionType, setSessionType] = useState<SessionType>("Focus");
  const [targetMinutes, setTargetMinutes] = useState<number>(25);

  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [sessionNotes, setSessionNotes] = useState("");

  // Sync selected subject if empty
  useEffect(() => {
    if (!selectedSubjectId && subjects.length > 0) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

  // Active Timer Interval Tick
  useEffect(() => {
    if (!activeSession || activeSession.isPaused) return;

    const interval = setInterval(() => {
      tickActiveSession();
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession, tickActiveSession]);

  // Derived options for Goal and Task dropdowns
  const currentSubject = useMemo(
    () => subjects.find((s) => s.id === selectedSubjectId),
    [subjects, selectedSubjectId]
  );

  const filteredGoals = useMemo(() => {
    if (!selectedSubjectId) return goals;
    return goals.filter(
      (g) =>
        g.subjectId === selectedSubjectId ||
        (currentSubject && g.subject.toLowerCase() === currentSubject.name.toLowerCase())
    );
  }, [goals, selectedSubjectId, currentSubject]);

  const filteredTasks = useMemo(() => {
    if (!selectedSubjectId) return tasks;
    return tasks.filter(
      (t) =>
        t.subjectId === selectedSubjectId ||
        (currentSubject && t.subject.toLowerCase() === currentSubject.name.toLowerCase())
    );
  }, [tasks, selectedSubjectId, currentSubject]);

  // Format Elapsed Seconds vs Target Seconds
  const targetSeconds = (activeSession?.targetDurationMinutes || targetMinutes) * 60;
  const elapsedSeconds = activeSession?.elapsedSeconds || 0;
  const remainingSeconds = Math.max(0, targetSeconds - elapsedSeconds);

  const formatTimerDisplay = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleStartTimer = () => {
    if (!currentSubject) return;

    const goal = goals.find((g) => g.id === selectedGoalId);
    const task = tasks.find((t) => t.id === selectedTaskId);

    startActiveSession({
      subjectId: currentSubject.id,
      subjectName: currentSubject.name,
      goalId: goal?.id,
      goalTitle: goal?.title,
      taskId: task?.id,
      taskTitle: task?.title,
      sessionType,
      targetDurationMinutes: targetMinutes,
    });
  };

  const handleFinishTimer = () => {
    setNotesModalOpen(true);
  };

  const handleConfirmFinish = (e: React.FormEvent) => {
    e.preventDefault();
    finishActiveSession({ notes: sessionNotes });
    setNotesModalOpen(false);
    setSessionNotes("");
    navigate("/sessions");
  };

  return (
    <AppShell>
      <div className="min-h-full w-full relative pb-12 flex flex-col items-center">
        {/* HEADER */}
        <div className="w-full mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs font-medium text-[#64748B] hover:text-[#E5E7EB] transition-colors"
          >
            <ArrowLeft size={14} />
            Back
          </button>

          <h1 className="text-xl font-bold text-[#E5E7EB]">Focus Study Timer</h1>
          <div className="w-16" />
        </div>

        {/* TIMER CONTAINER CARD */}
        <div className="w-full max-w-2xl rounded-3xl border border-[#1F2937] bg-[#0B1120] p-6 sm:p-8 shadow-2xl backdrop-blur-md flex flex-col items-center text-center">
          {/* DISPLAY COUNTDOWN */}
          <div className="relative my-6 flex h-60 w-60 items-center justify-center rounded-full border-4 border-[#06B6D4]/30 bg-[#020617] shadow-inner">
            <div
              className="absolute inset-0 rounded-full border-4 border-[#06B6D4] transition-all"
              style={{
                clipPath: `circle(${
                  Math.min(100, Math.round((elapsedSeconds / targetSeconds) * 100))
                }% at 50% 50%)`,
              }}
            />

            <div className="z-10 flex flex-col items-center">
              <span className="text-5xl font-extrabold tracking-tight text-[#E5E7EB] font-mono">
                {formatTimerDisplay(remainingSeconds > 0 ? remainingSeconds : elapsedSeconds)}
              </span>
              <span className="mt-2 text-xs font-medium uppercase tracking-wider text-[#06B6D4]">
                {activeSession
                  ? activeSession.isPaused
                    ? "Paused"
                    : "In Progress"
                  : "Ready to Focus"}
              </span>
            </div>
          </div>

          {/* ACTIVE SESSION METADATA OR SETUP FORM */}
          {activeSession ? (
            <div className="w-full my-4 rounded-xl border border-[#1F2937] bg-[#020617] p-4 text-left space-y-2">
              <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                <span className="font-semibold text-[#06B6D4]">{activeSession.subjectName}</span>
                <span className="rounded bg-[#06B6D4]/10 px-2 py-0.5 font-semibold text-[#06B6D4]">
                  {activeSession.sessionType}
                </span>
              </div>
              {activeSession.goalTitle && (
                <p className="text-xs text-[#CBD5E1] truncate">
                  <span className="text-[#64748B]">Goal:</span> {activeSession.goalTitle}
                </p>
              )}
              {activeSession.taskTitle && (
                <p className="text-xs text-[#CBD5E1] truncate">
                  <span className="text-[#64748B]">Task:</span> {activeSession.taskTitle}
                </p>
              )}
            </div>
          ) : (
            /* TIMER SETUP FORM */
            <div className="w-full my-4 space-y-4 text-left">
              {/* SUBJECT SELECT */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[#CBD5E1]">
                  <BookOpen size={13} className="text-[#06B6D4]" /> Subject *
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => {
                    setSelectedSubjectId(e.target.value);
                    setSelectedGoalId("");
                    setSelectedTaskId("");
                  }}
                  className="w-full rounded-xl border border-[#1F2937] bg-[#020617] p-2.5 text-xs text-[#E5E7EB] outline-none focus:border-[#06B6D4]"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} {sub.courseCode ? `(${sub.courseCode})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* GOAL & TASK SELECT */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[#CBD5E1]">
                    <Target size={13} className="text-[#64748B]" /> Optional Goal
                  </label>
                  <select
                    value={selectedGoalId}
                    onChange={(e) => setSelectedGoalId(e.target.value)}
                    className="w-full rounded-xl border border-[#1F2937] bg-[#020617] p-2.5 text-xs text-[#E5E7EB] outline-none focus:border-[#06B6D4]"
                  >
                    <option value="">No goal linked</option>
                    {filteredGoals.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[#CBD5E1]">
                    <ListTodo size={13} className="text-[#64748B]" /> Optional Task
                  </label>
                  <select
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    className="w-full rounded-xl border border-[#1F2937] bg-[#020617] p-2.5 text-xs text-[#E5E7EB] outline-none focus:border-[#06B6D4]"
                  >
                    <option value="">No task linked</option>
                    {filteredTasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SESSION TYPE & PRESET DURATIONS */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[#CBD5E1]">
                    <Clock size={13} className="text-[#64748B]" /> Session Type
                  </label>
                  <select
                    value={sessionType}
                    onChange={(e) => setSessionType(e.target.value as SessionType)}
                    className="w-full rounded-xl border border-[#1F2937] bg-[#020617] p-2.5 text-xs text-[#E5E7EB] outline-none focus:border-[#06B6D4]"
                  >
                    {sessionTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[#CBD5E1]">
                    Target Duration
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {presetDurations.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => setTargetMinutes(d.value)}
                        className={`rounded-lg py-2 text-[11px] font-semibold transition ${
                          targetMinutes === d.value
                            ? "bg-[#06B6D4] text-[#020617]"
                            : "bg-[#020617] border border-[#1F2937] text-[#94A3B8] hover:text-[#E5E7EB]"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TIMER CONTROLS */}
          <div className="mt-4 flex items-center justify-center gap-3">
            {!activeSession ? (
              <button
                type="button"
                onClick={handleStartTimer}
                disabled={!selectedSubjectId}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#06B6D4] px-8 py-3.5 text-sm font-bold text-[#020617] shadow-xl hover:bg-[#22D3EE] disabled:opacity-50"
              >
                <Play size={18} fill="currentColor" />
                Start Focus Session
              </button>
            ) : (
              <>
                {activeSession.isPaused ? (
                  <button
                    type="button"
                    onClick={resumeActiveSession}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#06B6D4] px-6 py-2.5 text-xs font-bold text-[#020617]"
                  >
                    <Play size={15} fill="currentColor" /> Resume
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={pauseActiveSession}
                    className="inline-flex items-center gap-2 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-6 py-2.5 text-xs font-bold text-yellow-400"
                  >
                    <Pause size={15} /> Pause
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleFinishTimer}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-emerald-600"
                >
                  <CheckCircle2 size={15} /> Finish & Save
                </button>

                <button
                  type="button"
                  onClick={cancelActiveSession}
                  className="rounded-xl border border-red-500/20 bg-red-500/10 p-2.5 text-red-400 hover:bg-red-500/20"
                  title="Cancel Timer"
                >
                  <RotateCcw size={15} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* FINISH NOTES MODAL */}
        {notesModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
            <form
              onSubmit={handleConfirmFinish}
              className="w-full max-w-md rounded-2xl border border-[#1F2937] bg-[#0B1120] p-5 shadow-2xl space-y-4"
            >
              <h3 className="text-base font-bold text-[#E5E7EB]">
                Session Complete! Add Notes
              </h3>
              <p className="text-xs text-[#64748B]">
                Great work! Optionally write down what you covered or key takeaways.
              </p>

              <textarea
                rows={3}
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="e.g. Completed 10 subnetting practice questions..."
                className="w-full rounded-lg border border-[#1F2937] bg-[#020617] p-2.5 text-xs text-[#E5E7EB] outline-none resize-none"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="rounded-lg bg-[#06B6D4] px-4 py-2 text-xs font-semibold text-[#020617]"
                >
                  Save Study Session
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AppShell>
  );
}
