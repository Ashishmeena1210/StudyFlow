/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Play,
  Pause,
  Clock,
  CheckCircle2,
  BookOpen,
  Target,
  ListTodo,
  Sparkles,
  X,
  Trash2,
  Check,
} from "lucide-react";

import AppShell from "../../components/appshell";

import {
  useSessions,
  type SessionType,
  type CompletionResult,
} from "../../context/sessioncontext";
import { useSubjects } from "../../context/subjectcontext";
import { useGoals } from "../../context/goalcontext";
import { useTasks } from "../../context/taskcontext";

const sessionTypes: SessionType[] = [
  "Focus",
  "Revision",
  "Practice",
  "Reading",
  "Review",
  "Other",
];

const presetDurations = [
  { label: "25 min", value: 25 },
  { label: "50 min", value: 50 },
  { label: "90 min", value: 90 },
];

export default function StudySessionsPage() {
  const [searchParams] = useSearchParams();

  const {
    sessions,
    activeSession,
    startActiveSession,
    pauseActiveSession,
    resumeActiveSession,
    tickActiveSession,
    finishActiveSession,
    cancelActiveSession,
    deleteSession,
  } = useSessions();

  const { subjects } = useSubjects();
  const { goals } = useGoals();
  const { tasks, toggleTask } = useTasks();

  // Parse URL pre-selection parameters
  const paramSubId = searchParams.get("subjectId") || "";
  const paramGoalId = searchParams.get("goalId") || "";
  const paramTaskId = searchParams.get("taskId") || "";

  // Session Planning Setup State
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    paramSubId || subjects[0]?.id || ""
  );
  const [selectedGoalId, setSelectedGoalId] = useState<string>(paramGoalId);
  const [selectedTaskId, setSelectedTaskId] = useState<string>(paramTaskId);
  const [sessionType, setSessionType] = useState<SessionType>("Focus");
  const [targetMinutes, setTargetMinutes] = useState<number>(25);
  const [customDurationInput, setCustomDurationInput] = useState<string>("");
  const [isCustomDuration, setIsCustomDuration] = useState<boolean>(false);
  const [sessionIntention, setSessionIntention] = useState<string>("");

  // Modals / Dialogs State
  const [reflectionModalOpen, setReflectionModalOpen] = useState(false);
  const [completionResult, setCompletionResult] = useState<CompletionResult>("Yes");
  const [reflectionNotes, setReflectionNotes] = useState("");
  const [markTaskCompletedChecked, setMarkTaskCompletedChecked] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync default subject if empty
  useEffect(() => {
    if (!selectedSubjectId && subjects.length > 0) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

  // Active Session Interval Timer Tick
  useEffect(() => {
    if (!activeSession || activeSession.isPaused) return;

    const interval = setInterval(() => {
      tickActiveSession();
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession, tickActiveSession]);

  // Derived Goals & Tasks for selected Subject
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

  // Filter today's tasks for Today's Study Plan section
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const todaysTasks = useMemo(() => {
    return tasks.filter((t) => !t.completed && (t.dueDate === todayStr || !t.dueDate));
  }, [tasks, todayStr]);

  /*
   * START SESSION HANDLER
   */
  const handleStartSession = async (
    overrideDuration?: number,
    overrideType?: SessionType
  ) => {
    if (!selectedSubjectId || !currentSubject) {
      showToast("Please select a subject to start studying.");
      return;
    }

    const dur = overrideDuration || targetMinutes;
    const stType = overrideType || sessionType;

    const linkedGoal = goals.find((g) => g.id === selectedGoalId);
    const linkedTask = tasks.find((t) => t.id === selectedTaskId);

    try {
      await startActiveSession({
        subjectId: currentSubject.id,
        subjectName: currentSubject.name,
        goalId: linkedGoal?.id,
        goalTitle: linkedGoal?.title,
        taskId: linkedTask?.id,
        taskTitle: linkedTask?.title,
        sessionType: stType,
        targetDurationMinutes: dur,
        sessionIntention: sessionIntention.trim() || undefined,
      });

      showToast(`Session started: ${currentSubject.name} (${dur}m)`);
    } catch (err: any) {
      showToast(err.message || "Could not start session.");
    }
  };

  /*
   * QUICK START HANDLER
   */
  const handleQuickStart = (mins: number) => {
    setTargetMinutes(mins);
    setIsCustomDuration(false);
    if (selectedSubjectId && currentSubject) {
      handleStartSession(mins);
    } else if (subjects.length > 0) {
      setSelectedSubjectId(subjects[0].id);
      handleStartSession(mins);
    }
  };

  /*
   * FINISH & REFLECTION
   */
  const handleTriggerFinish = () => {
    if (!activeSession) return;
    pauseActiveSession();
    setReflectionNotes("");
    setCompletionResult("Yes");
    setMarkTaskCompletedChecked(false);
    setReflectionModalOpen(true);
  };

  const handleSaveReflection = async () => {
    if (!activeSession) return;

    const associatedTaskId = activeSession.taskId;

    try {
      await finishActiveSession({
        notes: reflectionNotes,
        completionResult,
      });

      if (markTaskCompletedChecked && associatedTaskId) {
        toggleTask(associatedTaskId);
      }

      setReflectionModalOpen(false);
      showToast("Study session saved successfully!");
    } catch (err: any) {
      showToast(err.message || "Failed to save reflection.");
    }
  };

  /*
   * CANCEL ACTIVE SESSION
   */
  const handleConfirmCancelSession = async () => {
    try {
      await cancelActiveSession();
      setCancelConfirmOpen(false);
      showToast("Session cancelled.");
    } catch (err: any) {
      showToast(err.message || "Failed to cancel session.");
    }
  };

  /*
   * FORMAT TIMER DISPLAY
   */
  const formatTimerDigits = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <AppShell>
      <div className="min-h-full w-full relative pb-12 max-w-4xl mx-auto">
        {/* TOAST */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-[110] flex items-center gap-2 rounded-xl border border-[#06B6D4]/30 bg-[#0B1120] px-4 py-3 text-xs font-medium text-[#E5E7EB] shadow-2xl backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-[#06B6D4]" />
            {toastMessage}
          </div>
        )}

        {/* ====================================================
            ACTIVE FOCUS SESSION INTERFACE (MINIMAL DISTRACTION)
        ==================================================== */}
        {activeSession ? (
          <div className="rounded-3xl border border-[#06B6D4]/30 bg-[#0B1120] p-8 shadow-2xl space-y-8 text-center my-6">
            {/* SUBJECT & METADATA BADGES */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#06B6D4]/15 px-3.5 py-1 text-xs font-bold text-[#06B6D4]">
                <BookOpen size={13} />
                {activeSession.subjectName}
              </span>

              {activeSession.goalTitle && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#111827] px-3.5 py-1 text-xs font-semibold text-[#CBD5E1]">
                  <Target size={13} className="text-[#06B6D4]" />
                  {activeSession.goalTitle}
                </span>
              )}

              {activeSession.taskTitle && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#111827] px-3.5 py-1 text-xs font-semibold text-emerald-400">
                  <ListTodo size={13} />
                  {activeSession.taskTitle}
                </span>
              )}

              <span className="rounded-full bg-violet-400/10 px-3 py-1 text-xs font-semibold text-violet-400">
                {activeSession.sessionType}
              </span>
            </div>

            {/* SESSION INTENTION */}
            {activeSession.sessionIntention && (
              <div className="max-w-md mx-auto rounded-xl border border-[#1F2937] bg-[#020617] p-3 text-xs text-[#94A3B8]">
                <span className="font-semibold text-[#CBD5E1] block mb-0.5">Session Goal:</span>
                "{activeSession.sessionIntention}"
              </div>
            )}

            {/* TIMER DISPLAY */}
            <div className="py-4">
              <div className="font-mono text-6xl sm:text-7xl font-bold tracking-tight text-[#E5E7EB]">
                {formatTimerDigits(activeSession.elapsedSeconds)}
              </div>
              <p className="mt-2 text-xs font-medium text-[#64748B]">
                Target: {activeSession.targetDurationMinutes} minutes
              </p>
            </div>

            {/* CONTROLS */}
            <div className="flex items-center justify-center gap-3 pt-2">
              {activeSession.isPaused ? (
                <button
                  type="button"
                  onClick={resumeActiveSession}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#06B6D4] px-6 py-3 text-xs font-bold text-[#020617] hover:bg-[#22D3EE] transition"
                >
                  <Play size={16} fill="currentColor" /> Resume
                </button>
              ) : (
                <button
                  type="button"
                  onClick={pauseActiveSession}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#1F2937] bg-[#111827] px-6 py-3 text-xs font-bold text-[#E5E7EB] hover:bg-[#1F2937] transition"
                >
                  <Pause size={16} fill="currentColor" /> Pause
                </button>
              )}

              <button
                type="button"
                onClick={handleTriggerFinish}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-xs font-bold text-white hover:bg-emerald-600 transition"
              >
                <CheckCircle2 size={16} /> Finish Session
              </button>

              <button
                type="button"
                onClick={() => setCancelConfirmOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* ====================================================
              STUDY SESSION LANDING & PLANNING EXPERIENCE
          ==================================================== */
          <div className="space-y-8">
            {/* HEADER */}
            <div>
              <div className="flex items-center gap-2">
                <Clock size={24} className="text-[#06B6D4]" />
                <h1 className="text-2xl font-bold tracking-tight text-[#E5E7EB]">
                  Study Session
                </h1>
              </div>
              <p className="mt-1 text-sm text-[#64748B]">
                Focus on one thing at a time and make your study time count.
              </p>
            </div>

            {/* QUICK START PRESETS */}
            <div className="rounded-2xl border border-[#1F2937] bg-[#0B1120] p-5 shadow-lg space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[#06B6D4]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                  Quick Start
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => handleQuickStart(25)}
                  className="flex items-center justify-between rounded-xl border border-[#1F2937] bg-[#020617] p-3.5 hover:border-[#06B6D4] hover:bg-[#06B6D4]/5 transition text-left group"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#E5E7EB] group-hover:text-[#06B6D4]">
                      25 min Focus
                    </p>
                    <p className="text-[11px] text-[#64748B]">Short focus block</p>
                  </div>
                  <Play size={16} className="text-[#64748B] group-hover:text-[#06B6D4]" />
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickStart(50)}
                  className="flex items-center justify-between rounded-xl border border-[#1F2937] bg-[#020617] p-3.5 hover:border-[#06B6D4] hover:bg-[#06B6D4]/5 transition text-left group"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#E5E7EB] group-hover:text-[#06B6D4]">
                      50 min Focus
                    </p>
                    <p className="text-[11px] text-[#64748B]">Standard study session</p>
                  </div>
                  <Play size={16} className="text-[#64748B] group-hover:text-[#06B6D4]" />
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickStart(90)}
                  className="flex items-center justify-between rounded-xl border border-[#1F2937] bg-[#020617] p-3.5 hover:border-[#06B6D4] hover:bg-[#06B6D4]/5 transition text-left group"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#E5E7EB] group-hover:text-[#06B6D4]">
                      90 min Deep Study
                    </p>
                    <p className="text-[11px] text-[#64748B]">Extended deep work</p>
                  </div>
                  <Play size={16} className="text-[#64748B] group-hover:text-[#06B6D4]" />
                </button>
              </div>
            </div>

            {/* PLAN YOUR SESSION FORM */}
            <div className="rounded-2xl border border-[#1F2937] bg-[#0B1120] p-6 shadow-xl space-y-5">
              <h2 className="text-base font-bold text-[#E5E7EB] border-b border-[#1F2937] pb-3">
                Plan Your Session
              </h2>

              <div className="space-y-4">
                {/* SUBJECT (REQUIRED) */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#CBD5E1] flex items-center gap-1">
                    <BookOpen size={12} className="text-[#06B6D4]" /> What do you want to study? <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => {
                      setSelectedSubjectId(e.target.value);
                      setSelectedGoalId("");
                      setSelectedTaskId("");
                    }}
                    className="w-full rounded-xl border border-[#1F2937] bg-[#020617] p-3 text-xs text-[#E5E7EB] outline-none focus:border-[#06B6D4]"
                    required
                  >
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* GOAL & TASK (OPTIONAL) */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#CBD5E1] flex items-center gap-1">
                      <Target size={12} className="text-[#64748B]" /> Optional Linked Goal
                    </label>
                    <select
                      value={selectedGoalId}
                      onChange={(e) => setSelectedGoalId(e.target.value)}
                      className="w-full rounded-xl border border-[#1F2937] bg-[#020617] p-2.5 text-xs text-[#E5E7EB] outline-none"
                    >
                      <option value="">No goal selected</option>
                      {filteredGoals.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#CBD5E1] flex items-center gap-1">
                      <ListTodo size={12} className="text-[#64748B]" /> Optional Linked Task
                    </label>
                    <select
                      value={selectedTaskId}
                      onChange={(e) => setSelectedTaskId(e.target.value)}
                      className="w-full rounded-xl border border-[#1F2937] bg-[#020617] p-2.5 text-xs text-[#E5E7EB] outline-none"
                    >
                      <option value="">No task selected</option>
                      {filteredTasks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* SESSION TYPE & DURATION PRESETS */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#CBD5E1]">
                      Session Type
                    </label>
                    <select
                      value={sessionType}
                      onChange={(e) => setSessionType(e.target.value as SessionType)}
                      className="w-full rounded-xl border border-[#1F2937] bg-[#020617] p-2.5 text-xs text-[#E5E7EB] outline-none"
                    >
                      {sessionTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#CBD5E1]">
                      Duration
                    </label>
                    <div className="flex items-center gap-2">
                      {presetDurations.map((d) => (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => {
                            setTargetMinutes(d.value);
                            setIsCustomDuration(false);
                          }}
                          className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition ${
                            !isCustomDuration && targetMinutes === d.value
                              ? "border-[#06B6D4] bg-[#06B6D4]/15 text-[#06B6D4]"
                              : "border-[#1F2937] bg-[#020617] text-[#64748B] hover:text-[#E5E7EB]"
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() => setIsCustomDuration(true)}
                        className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                          isCustomDuration
                            ? "border-[#06B6D4] bg-[#06B6D4]/15 text-[#06B6D4]"
                            : "border-[#1F2937] bg-[#020617] text-[#64748B] hover:text-[#E5E7EB]"
                        }`}
                      >
                        Custom
                      </button>
                    </div>

                    {isCustomDuration && (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="300"
                          value={customDurationInput}
                          onChange={(e) => {
                            setCustomDurationInput(e.target.value);
                            const val = Number(e.target.value);
                            if (val > 0) setTargetMinutes(val);
                          }}
                          placeholder="Minutes (e.g. 40)"
                          className="w-full rounded-lg border border-[#1F2937] bg-[#020617] p-2 text-xs text-[#E5E7EB] outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* SESSION INTENTION (OPTIONAL) */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#CBD5E1]">
                    Session Goal / Intention <span className="text-[#64748B]">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={sessionIntention}
                    onChange={(e) => setSessionIntention(e.target.value)}
                    placeholder="e.g. Complete 20 subnetting questions, revise BCNF normalization"
                    className="w-full rounded-xl border border-[#1F2937] bg-[#020617] p-3 text-xs text-[#E5E7EB] outline-none focus:border-[#06B6D4]"
                  />
                </div>

                {/* START BUTTON */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleStartSession()}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#06B6D4] py-3 text-sm font-bold text-[#020617] shadow-lg shadow-[#06B6D4]/10 hover:bg-[#22D3EE] transition"
                  >
                    <Play size={16} fill="currentColor" />
                    Start Session ({targetMinutes} min)
                  </button>
                </div>
              </div>
            </div>

            {/* TODAY'S STUDY PLAN */}
            {todaysTasks.length > 0 && (
              <div className="rounded-2xl border border-[#1F2937] bg-[#0B1120] p-5 shadow-lg space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                  Today's Study Plan
                </h3>

                <div className="space-y-2">
                  {todaysTasks.slice(0, 3).map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between rounded-xl border border-[#1F2937] bg-[#020617] p-3"
                    >
                      <div>
                        <span className="text-[10px] font-semibold text-[#06B6D4]">
                          {t.subject}
                        </span>
                        <h4 className="text-xs font-semibold text-[#E5E7EB]">{t.title}</h4>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const subObj = subjects.find((s) => s.name.toLowerCase() === t.subject.toLowerCase());
                          if (subObj) setSelectedSubjectId(subObj.id);
                          if (t.goalId) setSelectedGoalId(t.goalId);
                          setSelectedTaskId(t.id);
                          handleStartSession(25);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#06B6D4]/10 px-3 py-1.5 text-xs font-bold text-[#06B6D4] hover:bg-[#06B6D4] hover:text-[#020617] transition"
                      >
                        <Play size={12} fill="currentColor" />
                        Start
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* RECENT SESSIONS HISTORY */}
            <div className="rounded-2xl border border-[#1F2937] bg-[#0B1120] p-5 shadow-lg space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                Recent Sessions
              </h3>

              {sessions.length > 0 ? (
                <div className="space-y-2">
                  {sessions.slice(0, 5).map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-xl border border-[#1F2937] bg-[#020617] p-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#E5E7EB]">{s.subjectName}</span>
                          <span className="rounded-md bg-violet-400/10 px-2 py-0.5 text-[10px] font-semibold text-violet-400">
                            {s.sessionType}
                          </span>
                        </div>
                        {s.notes && (
                          <p className="mt-0.5 text-[11px] text-[#64748B] line-clamp-1">
                            {s.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-bold text-[#06B6D4]">
                          {s.durationMinutes} mins
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteSession(s.id)}
                          className="text-[#64748B] hover:text-red-400 transition"
                          title="Delete session record"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#64748B] py-3 text-center">
                  No session history recorded yet.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ====================================================
            QUICK REFLECTION & SESSION COMPLETION MODAL
        ==================================================== */}
        {reflectionModalOpen && (
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm"
            onClick={() => setReflectionModalOpen(false)}
          >
            <div
              className="w-full max-w-md rounded-2xl border border-[#1F2937] bg-[#0B1120] p-6 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-emerald-400" />
                  <h3 className="text-base font-bold text-[#E5E7EB]">Session Complete</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setReflectionModalOpen(false)}
                  className="text-[#64748B] hover:text-[#E5E7EB]"
                >
                  <X size={18} />
                </button>
              </div>

              {/* SUMMARY INFO */}
              <div className="rounded-xl border border-[#1F2937] bg-[#020617] p-3 text-xs space-y-1">
                <p className="font-bold text-[#06B6D4]">{activeSession?.subjectName}</p>
                {activeSession?.taskTitle && (
                  <p className="text-[#CBD5E1]">Task: {activeSession.taskTitle}</p>
                )}
                <p className="text-[#64748B]">
                  Studied: {activeSession ? Math.max(1, Math.round(activeSession.elapsedSeconds / 60)) : 0} minutes
                </p>
              </div>

              {/* GOAL ACCOMPLISHMENT QUESTION */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-[#CBD5E1]">
                  Did you accomplish your session goal?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Yes", "Partially", "No"] as CompletionResult[]).map((res) => (
                    <button
                      key={res}
                      type="button"
                      onClick={() => setCompletionResult(res)}
                      className={`rounded-xl border py-2 text-xs font-bold transition ${
                        completionResult === res
                          ? "border-[#06B6D4] bg-[#06B6D4]/15 text-[#06B6D4]"
                          : "border-[#1F2937] bg-[#020617] text-[#64748B] hover:text-[#E5E7EB]"
                      }`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>

              {/* REFLECTION NOTES */}
              <div>
                <label className="mb-1 block text-xs font-medium text-[#CBD5E1]">
                  What did you learn or accomplish? <span className="text-[#64748B]">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={reflectionNotes}
                  onChange={(e) => setReflectionNotes(e.target.value)}
                  placeholder="Key takeaways, formulas, or solved problems..."
                  className="w-full rounded-xl border border-[#1F2937] bg-[#020617] p-3 text-xs text-[#E5E7EB] outline-none resize-none"
                />
              </div>

              {/* MARK TASK COMPLETED CHECKBOX */}
              {activeSession?.taskId && (
                <label className="flex items-center gap-2 text-xs text-[#CBD5E1] cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={markTaskCompletedChecked}
                    onChange={(e) => setMarkTaskCompletedChecked(e.target.checked)}
                    className="rounded border-[#1F2937] bg-[#020617] text-[#06B6D4] focus:ring-0"
                  />
                  <span>Mark task "{activeSession.taskTitle}" as completed</span>
                </label>
              )}

              {/* SAVE BUTTON */}
              <div className="pt-2 border-t border-[#1F2937] flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveReflection}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#06B6D4] py-2.5 text-xs font-bold text-[#020617] hover:bg-[#22D3EE] transition"
                >
                  <Check size={14} /> Save Session
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CANCEL CONFIRMATION DIALOG */}
        {cancelConfirmOpen && (
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
            onClick={() => setCancelConfirmOpen(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl border border-[#1F2937] bg-[#0B1120] p-5 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-bold text-[#E5E7EB]">Cancel Study Session?</h3>
              <p className="text-xs text-[#94A3B8]">
                Are you sure you want to cancel this session? Elapsed time will be discarded and not recorded in your history.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelConfirmOpen(false)}
                  className="rounded-lg border border-[#1F2937] px-4 py-2 text-xs text-[#94A3B8]"
                >
                  Keep Studying
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancelSession}
                  className="rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600"
                >
                  Discard Session
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
