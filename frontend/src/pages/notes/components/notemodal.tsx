/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { X, BookOpen, FileText, Tag, Star } from "lucide-react";
import { useSubjects } from "../../../context/subjectcontext";
import { useGoals } from "../../../context/goalcontext";
import { useTasks } from "../../../context/taskcontext";
import type { Note, CreateNoteData } from "../../../context/notecontext";

interface NoteModalProps {
  open: boolean;
  note: Note | null;
  onClose: () => void;
  onSave: (data: CreateNoteData) => void;
}

export default function NoteModal({
  open,
  note,
  onClose,
  onSave,
}: NoteModalProps) {
  const { subjects } = useSubjects();
  const { goals } = useGoals();
  const { tasks } = useTasks();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [goalId, setGoalId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setSubjectId(note.subjectId);
      setGoalId(note.goalId || "");
      setTaskId(note.taskId || "");
      setTagsInput(note.tags?.join(", ") || "");
      setIsFavorite(note.isFavorite || false);
    } else {
      setTitle("");
      setContent("");
      setSubjectId(subjects[0]?.id || "");
      setGoalId("");
      setTaskId("");
      setTagsInput("");
      setIsFavorite(false);
    }
    setError("");
  }, [open, note, subjects]);

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

    if (!title.trim()) {
      setError("Please enter a note title.");
      return;
    }

    if (!subjectId || !currentSubject) {
      setError("Please select a subject.");
      return;
    }

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const linkedGoal = goals.find((g) => g.id === goalId);
    const linkedTask = tasks.find((t) => t.id === taskId);

    onSave({
      title: title.trim(),
      content: content.trim(),
      subjectId: currentSubject.id,
      subjectName: currentSubject.name,
      goalId: linkedGoal?.id,
      goalTitle: linkedGoal?.title,
      taskId: linkedTask?.id,
      taskTitle: linkedTask?.title,
      tags,
      isFavorite,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[#1F2937] bg-[#0B1120] p-6 shadow-2xl space-y-4 scrollbar-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
          <div>
            <h3 className="text-base font-bold text-[#E5E7EB]">
              {note ? "Edit Note" : "Create Study Note"}
            </h3>
            <p className="text-xs text-[#64748B]">
              Capture key takeaways, formulas, and study concepts.
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
          {/* TITLE */}
          <div>
            <label className="mb-1 block text-xs font-medium text-[#CBD5E1]">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. OSI Model & TCP Protocols"
              className="w-full rounded-lg border border-[#1F2937] bg-[#020617] p-2.5 text-xs text-[#E5E7EB] outline-none focus:border-[#06B6D4]"
              required
            />
          </div>

          {/* SUBJECT */}
          <div>
            <label className="mb-1 block text-xs font-medium text-[#CBD5E1] flex items-center gap-1">
              <BookOpen size={12} className="text-[#06B6D4]" /> Subject *
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
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* CONTENT */}
          <div>
            <label className="mb-1 block text-xs font-medium text-[#CBD5E1] flex items-center gap-1">
              <FileText size={12} className="text-[#64748B]" /> Note Content <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your study notes (supports headings, lists, markdown formatting)..."
              className="w-full rounded-lg border border-[#1F2937] bg-[#020617] p-3 text-xs text-[#E5E7EB] outline-none resize-none font-mono"
              required
            />
          </div>

          {/* GOAL & TASK */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-[#CBD5E1]">
                Optional Goal Link
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
                Optional Task Link
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

          {/* TAGS & FAVORITE */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-[#CBD5E1] flex items-center gap-1">
                <Tag size={12} className="text-[#64748B]" /> Tags (comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. OSI, Layers, ExamPrep"
                className="w-full rounded-lg border border-[#1F2937] bg-[#020617] p-2.5 text-xs text-[#E5E7EB] outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsFavorite(!isFavorite)}
              className={`mt-4 flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                isFavorite
                  ? "border-amber-400/30 bg-amber-400/10 text-amber-400"
                  : "border-[#1F2937] bg-[#020617] text-[#64748B] hover:text-[#E5E7EB]"
              }`}
            >
              <Star size={14} fill={isFavorite ? "currentColor" : "none"} />
              Favorite
            </button>
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
              {note ? "Save Changes" : "Create Note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
