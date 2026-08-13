import { X, Pencil, Trash2, CalendarDays, Clock, BookOpen, Target, ListTodo, FileText } from "lucide-react";
import type { StudySession } from "../../../context/sessioncontext";

interface SessionDetailModalProps {
  session: StudySession | null;
  onClose: () => void;
  onEdit: (session: StudySession) => void;
  onDelete: (sessionId: string) => void;
}

export default function SessionDetailModal({
  session,
  onClose,
  onEdit,
  onDelete,
}: SessionDetailModalProps) {
  if (!session) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[#1F2937] bg-[#0B1120] p-6 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#06B6D4]/10 px-2.5 py-1 text-xs font-bold text-[#06B6D4]">
              {session.sessionType}
            </span>
            <span className="rounded-md border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-400 uppercase">
              {session.status}
            </span>
          </div>

          <button onClick={onClose} className="text-[#64748B] hover:text-[#E5E7EB]">
            <X size={18} />
          </button>
        </div>

        {/* DETAILS BODY */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#64748B] flex items-center gap-1.5">
              <BookOpen size={14} className="text-[#06B6D4]" /> Subject
            </span>
            <span className="text-xs font-semibold text-[#E5E7EB]">{session.subjectName}</span>
          </div>

          {session.goalTitle && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#64748B] flex items-center gap-1.5">
                <Target size={14} /> Goal
              </span>
              <span className="text-xs font-medium text-[#CBD5E1] truncate max-w-[200px]">
                {session.goalTitle}
              </span>
            </div>
          )}

          {session.taskTitle && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#64748B] flex items-center gap-1.5">
                <ListTodo size={14} /> Task
              </span>
              <span className="text-xs font-medium text-[#CBD5E1] truncate max-w-[200px]">
                {session.taskTitle}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs text-[#64748B] flex items-center gap-1.5">
              <Clock size={14} /> Duration
            </span>
            <span className="text-xs font-bold text-violet-400">{session.durationMinutes} mins</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-[#64748B] flex items-center gap-1.5">
              <CalendarDays size={14} /> Date
            </span>
            <span className="text-xs font-medium text-[#94A3B8]">{session.date}</span>
          </div>

          {session.notes && (
            <div className="border-t border-[#1F2937] pt-3">
              <span className="text-xs font-medium text-[#64748B] flex items-center gap-1.5 mb-1">
                <FileText size={13} /> Notes
              </span>
              <p className="rounded-lg bg-[#020617] p-3 text-xs text-[#CBD5E1] leading-relaxed">
                {session.notes}
              </p>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex items-center justify-end gap-2 border-t border-[#1F2937] pt-4">
          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(session);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-[#1F2937] px-3 py-1.5 text-xs font-medium text-[#CBD5E1] hover:bg-[#111827]"
          >
            <Pencil size={13} /> Edit
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onDelete(session.id);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-400/20"
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
