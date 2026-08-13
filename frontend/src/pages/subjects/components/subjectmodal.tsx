/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { X, BookOpen, Palette, CalendarDays } from "lucide-react";
import type { Subject, SubjectStatus, CreateSubjectData } from "../../../context/subjectcontext";

interface SubjectModalProps {
  open: boolean;
  subject: Subject | null;
  onClose: () => void;
  onSave: (data: CreateSubjectData) => void;
}

const colorOptions = [
  { hex: "#06B6D4", label: "Cyan" },
  { hex: "#8B5CF6", label: "Violet" },
  { hex: "#F59E0B", label: "Amber" },
  { hex: "#10B981", label: "Emerald" },
  { hex: "#EC4899", label: "Pink" },
];

const statuses: { value: SubjectStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

export default function SubjectModal({
  open,
  subject,
  onClose,
  onSave,
}: SubjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#06B6D4");
  const [status, setStatus] = useState<SubjectStatus>("active");
  const [targetDate, setTargetDate] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (subject) {
      setName(subject.name);
      setDescription(subject.description || "");
      setColor(subject.color || "#06B6D4");
      setStatus(subject.status || "active");
      setTargetDate(subject.targetDate || "");
    } else {
      setName("");
      setDescription("");
      setColor("#06B6D4");
      setStatus("active");
      setTargetDate("");
    }

    setError("");
    setIsSubmitting(false);
  }, [open, subject]);

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

    if (!name.trim()) {
      setError("Please enter a subject name.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        status,
        targetDate: targetDate || undefined,
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
              {subject ? "Edit Subject" : "Add New Subject"}
            </h2>
            <p className="mt-0.5 text-xs text-[#64748B]">
              {subject
                ? "Update your course details and status."
                : "Create a subject hub to organize tasks, goals, notes, and sessions."}
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

          {/* NAME */}
          <div>
            <label htmlFor="sub-name" className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[#CBD5E1]">
              <BookOpen size={13} className="text-[#06B6D4]" />
              Subject Name <span className="text-red-400">*</span>
            </label>
            <input
              id="sub-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Computer Networks"
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
            <label htmlFor="sub-desc" className="mb-1.5 block text-xs font-medium text-[#CBD5E1]">
              Description <span className="text-[#475569]">(optional)</span>
            </label>
            <textarea
              id="sub-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief course summary or topics covered..."
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
              "
            />
          </div>

          {/* TARGET / DUE DATE */}
          <div>
            <label htmlFor="sub-target-date" className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[#CBD5E1]">
              <CalendarDays size={13} className="text-[#06B6D4]" />
              Target / Exam Date <span className="text-[#475569]">(optional)</span>
            </label>
            <input
              id="sub-target-date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
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

          {/* STATUS */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#CBD5E1]">Status</label>
            <div className="grid grid-cols-3 gap-2">
              {statuses.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setStatus(item.value)}
                  className={`
                    rounded-lg
                    border
                    px-3
                    py-2
                    text-xs
                    font-medium
                    transition
                    ${
                      status === item.value
                        ? "border-[#06B6D4]/40 bg-[#06B6D4]/10 text-[#06B6D4]"
                        : "border-[#1F2937] bg-[#020617] text-[#64748B] hover:border-[#374151]"
                    }
                  `}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* COLOR */}
          <div>
            <div className="mb-1.5 flex items-center gap-1.5">
              <Palette size={13} className="text-[#64748B]" />
              <span className="text-xs font-medium text-[#CBD5E1]">Accent Color</span>
            </div>
            <div className="flex items-center gap-3">
              {colorOptions.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setColor(c.hex)}
                  className={`
                    h-7
                    w-7
                    rounded-full
                    transition-all
                    ${color === c.hex ? "ring-2 ring-white ring-offset-2 ring-offset-[#0B1120] scale-110" : "opacity-80 hover:opacity-100"}
                  `}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                />
              ))}
            </div>
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
              ) : subject ? (
                "Save changes"
              ) : (
                "Add Subject"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
