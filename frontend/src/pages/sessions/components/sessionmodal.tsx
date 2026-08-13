/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { X, BookOpen, Clock, CalendarDays, FileText } from "lucide-react";
import { useSubjects } from "../../../context/subjectcontext";
import { useGoals } from "../../../context/goalcontext";
import { useTasks } from "../../../context/taskcontext";
import type { StudySession, SessionType, CreateSessionData } from "../../../context/sessioncontext";

interface SessionModalProps {
  open: boolean;
  session: StudySession | null;
  onClose: () => void;
  onSave: (data: CreateSessionData) => void;
}

const sessionTypes: SessionType[] = [
  "Focus",
  "Review",
  "Practice",
  "Reading",
  "Revision",
  "Other",
];

export default function SessionModal({
  open,
  session,
  onClose,
  onSave,
}: SessionModalProps) {
  const { subjects } = useSubjects();
  const { goals } = useGoals();
  const { tasks } = useTasks();

  const [subjectId, setSubjectId] = useState("");
  const [goalId, setGoalId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [sessionType, setSessionType] = useState<SessionType>("Focus");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    if (session) {
      setSubjectId(session.subjectId);
      setGoalId(session.goalId || "");
      setTaskId(session.taskId || "");
      setSessionType(session.sessionType || "Focus");
      setDurationMinutes(session.durationMinutes);
      setDate(session.date || new Date().toISOString().split("T")[0]);
      setNotes(session.notes || "");
    } else {
      setSubjectId(subjects[0]?.id || "");
      setGoalId("");
      setTaskId("");
      setSessionType("Focus");
      setDurationMinutes(45);
      setDate(new Date().toISOString().split("T")[0]);
      setNotes("");
    }
    setError("");
  }, [open, session, subjects]);

  if (!open) return null;

  const currentSubject = subjects.find((s) => s.id === subjectId);
  const filteredGoals = goals.filter(
    (g) =>
      g.subjectId === subjectId ||
      (currentSubject && g.subject.toLowerCase() === currentSubject.name.toLowerCase())
  );
  const filteredTasks = tasks.filter(
    (t) =>
      t.subjectId === subjectId ||
      (currentSubject && t.subject.toLowerCase() === currentSubject.name.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!subjectId || !currentSubject) {
      setError("Please select a subject.");
      return;
    }

    if (durationMinutes <= 0) {
      setError("Duration must be greater than 0 minutes.");
      return;
    }

    const linkedGoal = goals.find((g) => g.id === goalId);
    const linkedTask = tasks.find((t) => t.id === taskId);

    onSave({
      subjectId: currentSubject.id,
      subjectName: currentSubject.name,
      goalId: linkedGoal?.id,
      goalTitle: linkedGoal?.title,
      taskId: linkedTask?.id,
      taskTitle: linkedTask?.title,
      sessionType,
      durationMinutes: Number(durationMinutes),
      date,
      notes: notes.trim() || undefined,
      status: "completed",
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-[#1F2937] bg-[#0B1120] p-6 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
          <div>
            <h3 className="text-base font-bold text-[#E5E7EB]">
              {session ? "Edit Study Session" : "Log Study Session"}
            </h3>
            <p className="text-xs text-[#64748B]">
              Record offline or completed study time manually.
            </p>
          </div>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#E5E7EB]">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-2.5 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* SUBJECT */}
          <div>
            <label className="mb-1 block text-xs font-medium text-[#CBD5E1] flex items-center gap-1.5">
              <BookOpen size={13} className="text-[#06B6D4]" /> Subject *
            </label>
            <select
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value);
                setGoalId("");
                setTaskId("");
              }}
              className="w-full rounded-lg border border-[#1F2937] bg-[#020617] p-2.5 text-xs text-[#E5E7EB] outline-none"
              required
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} {sub.courseCode ? `(${sub.courseCode})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* GOAL & TASK */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-[#CBD5E1]">
                Optional Goal
              </label>
              <select
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                className="w-full rounded-lg border border-[#1F2937] bg-[#020617] p-2.5 text-xs text-[#E5E7EB] outline-none"
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
              <label className="mb-1 block text-xs font-medium text-[#CBD5E1]">
                Optional Task
              </label>
              <select
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                className="w-full rounded-lg border border-[#1F2937] bg-[#020617] p-2.5 text-xs text-[#E5E7EB] outline-none"
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

          {/* DURATION, DATE & SESSION TYPE */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[#CBD5E1] flex items-center gap-1">
                <Clock size={12} /> Duration (mins) *
              </label>
              <input
                type="number"
                min="1"
                max="720"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full rounded-lg border border-[#1F2937] bg-[#020617] p-2.5 text-xs text-[#E5E7EB] outline-none"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[#CBD5E1] flex items-center gap-1">
                <CalendarDays size={12} /> Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-[#1F2937] bg-[#020617] p-2.5 text-xs text-[#E5E7EB] outline-none"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[#CBD5E1]">
                Session Type
              </label>
              <select
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value as SessionType)}
                className="w-full rounded-lg border border-[#1F2937] bg-[#020617] p-2.5 text-xs text-[#E5E7EB] outline-none"
              >
                {sessionTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* NOTES */}
          <div>
            <label className="mb-1 block text-xs font-medium text-[#CBD5E1] flex items-center gap-1">
              <FileText size={12} /> Session Notes <span className="text-[#475569]">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you study or accomplish?"
              className="w-full rounded-lg border border-[#1F2937] bg-[#020617] p-2.5 text-xs text-[#E5E7EB] outline-none resize-none"
            />
          </div>

          {/* BUTTONS */}
          <div className="flex items-center justify-end gap-2 border-t border-[#1F2937] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#1F2937] px-4 py-2 text-xs font-medium text-[#94A3B8]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#06B6D4] px-4 py-2 text-xs font-semibold text-[#020617] hover:bg-[#22D3EE]"
            >
              {session ? "Save Changes" : "Log Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
