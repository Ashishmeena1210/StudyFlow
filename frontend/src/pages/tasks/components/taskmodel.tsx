/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { X, CalendarDays, Flag } from "lucide-react";
import type { Task, Priority } from "../../../context/taskcontext";

interface TaskModelProps {
  open: boolean;
  task: Task | null;
  subjects: string[];
  onClose: () => void;
  onSave: (data: {
    title: string;
    description: string;
    subject: string;
    priority: Priority;
    dueDate: string;
  }) => void;
}

const priorities: { value: Priority; label: string }[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export default function TaskModel({
  open,
  task,
  subjects,
  onClose,
  onSave,
}: TaskModelProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customSubject, setCustomSubject] = useState("");

  useEffect(() => {
    if (!open) return;

    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      if (subjects.includes(task.subject)) {
        setSubject(task.subject);
        setCustomSubject("");
      } else {
        setSubject("Other");
        setCustomSubject(task.subject);
      }
      setPriority(task.priority);
      setDueDate(task.dueDate);
    } else {
      setTitle("");
      setDescription("");
      setSubject(subjects[0] || "General");
      setCustomSubject("");
      setPriority("medium");
      setDueDate(new Date().toISOString().split("T")[0]);
    }

    setError("");
    setIsSubmitting(false);
  }, [open, task, subjects]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Please enter a task title.");
      return;
    }

    const finalSubject =
      subject === "Other" ? customSubject.trim() : subject.trim();

    if (!finalSubject) {
      setError("Please select or enter a subject.");
      return;
    }

    if (!dueDate) {
      setError("Please select a due date.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      onSave({
        title: title.trim(),
        description: description.trim(),
        subject: finalSubject,
        priority,
        dueDate,
      });
      setIsSubmitting(false);
    }, 150);
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-center
        justify-center
        bg-black/60
        px-4
        py-6
        backdrop-blur-sm
      "
      onMouseDown={handleOverlayClick}
    >
      <div
        className="
          w-full
          max-w-lg
          max-h-[90vh]
          overflow-y-auto
          rounded-2xl
          border
          border-[#1F2937]
          bg-[#0B1120]
          shadow-2xl
          scrollbar-none
        "
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-[#1F2937] px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-[#E5E7EB]">
              {task ? "Edit Task" : "Add Study Task"}
            </h2>
            <p className="mt-0.5 text-xs text-[#64748B]">
              {task
                ? "Update your task details and due date."
                : "Create a task to stay organized and on track."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#64748B] hover:bg-[#111827] hover:text-[#E5E7EB]"
          >
            <X size={18} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-400">
              {error}
            </div>
          )}

          {/* TITLE */}
          <div>
            <label htmlFor="task-title" className="mb-1.5 block text-xs font-medium text-[#CBD5E1]">
              Task Title <span className="text-red-400">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Network Layer Protocols Revision"
              className="
                w-full
                rounded-lg
                border
                border-[#1F2937]
                bg-[#020617]
                px-3
                py-2.5
                text-sm
                text-[#E5E7EB]
                outline-none
                placeholder:text-[#475569]
                focus:border-[#06B6D4]
                focus:ring-1
                focus:ring-[#06B6D4]/20
              "
            />
          </div>

          {/* DESCRIPTION */}
          <div>
            <label htmlFor="task-desc" className="mb-1.5 block text-xs font-medium text-[#CBD5E1]">
              Description <span className="text-[#475569]">(optional)</span>
            </label>
            <textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail what you need to study or complete..."
              rows={3}
              className="
                w-full
                resize-none
                rounded-lg
                border
                border-[#1F2937]
                bg-[#020617]
                px-3
                py-2.5
                text-sm
                text-[#E5E7EB]
                outline-none
                placeholder:text-[#475569]
                focus:border-[#06B6D4]
                focus:ring-1
                focus:ring-[#06B6D4]/20
              "
            />
          </div>

          {/* SUBJECT */}
          <div>
            <label htmlFor="task-subject" className="mb-1.5 block text-xs font-medium text-[#CBD5E1]">
              Subject
            </label>
            <select
              id="task-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="
                w-full
                rounded-lg
                border
                border-[#1F2937]
                bg-[#020617]
                px-3
                py-2.5
                text-sm
                text-[#E5E7EB]
                outline-none
                focus:border-[#06B6D4]
              "
            >
              {subjects.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
              <option value="Other">Other (Custom)</option>
            </select>

            {subject === "Other" && (
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="Enter custom subject name..."
                className="
                  mt-2
                  w-full
                  rounded-lg
                  border
                  border-[#1F2937]
                  bg-[#020617]
                  px-3
                  py-2.5
                  text-sm
                  text-[#E5E7EB]
                  outline-none
                  focus:border-[#06B6D4]
                "
              />
            )}
          </div>

          {/* PRIORITY */}
          <div>
            <div className="mb-1.5 flex items-center gap-1.5">
              <Flag size={13} className="text-[#64748B]" />
              <span className="text-xs font-medium text-[#CBD5E1]">Priority</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {priorities.map((item) => {
                const selected = priority === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setPriority(item.value)}
                    className={`
                      rounded-lg
                      border
                      px-3
                      py-2
                      text-xs
                      font-medium
                      transition
                      ${
                        selected
                          ? item.value === "high"
                            ? "border-red-400/40 bg-red-400/10 text-red-400"
                            : item.value === "medium"
                            ? "border-yellow-400/40 bg-yellow-400/10 text-yellow-400"
                            : "border-emerald-400/40 bg-emerald-400/10 text-emerald-400"
                          : "border-[#1F2937] bg-[#020617] text-[#64748B] hover:border-[#374151]"
                      }
                    `}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* DUE DATE */}
          <div>
            <label htmlFor="task-due-date" className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[#CBD5E1]">
              <CalendarDays size={13} className="text-[#64748B]" />
              Due Date <span className="text-red-400">*</span>
            </label>
            <input
              id="task-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="
                w-full
                rounded-lg
                border
                border-[#1F2937]
                bg-[#020617]
                px-3
                py-2.5
                text-sm
                text-[#E5E7EB]
                outline-none
                focus:border-[#06B6D4]
              "
            />
          </div>

          {/* FOOTER BUTTONS */}
          <div className="flex items-center justify-end gap-2 border-t border-[#1F2937] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="
                rounded-lg
                border
                border-[#1F2937]
                px-4
                py-2.5
                text-xs
                font-medium
                text-[#94A3B8]
                hover:bg-[#111827]
                disabled:opacity-50
              "
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="
                flex
                items-center
                gap-2
                rounded-lg
                bg-[#06B6D4]
                px-4
                py-2.5
                text-xs
                font-semibold
                text-[#020617]
                hover:bg-[#22D3EE]
                disabled:opacity-50
              "
            >
              {isSubmitting ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#020617]/30 border-t-[#020617]" />
                  Saving...
                </>
              ) : task ? (
                "Save changes"
              ) : (
                "Add Task"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}