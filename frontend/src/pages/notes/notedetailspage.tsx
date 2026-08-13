import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Star,
  Pencil,
  Trash2,
  Tag,
  Target,
  ListTodo,
  FileText,
  CalendarDays,
} from "lucide-react";

import AppShell from "../../components/appshell";
import NoteModal from "./components/notemodal";

import { useNotes, type CreateNoteData } from "../../context/notecontext";

export default function NoteDetailsPage() {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();

  const { getNote, updateNote, deleteNote, toggleFavoriteNote } = useNotes();
  const note = noteId ? getNote(noteId) : undefined;

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (!note) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText size={40} className="mb-4 text-[#334155]" />
          <h2 className="text-xl font-bold text-[#E5E7EB]">Note Not Found</h2>
          <p className="mt-1 text-xs text-[#64748B]">
            The note you are looking for does not exist or has been removed.
          </p>
          <Link
            to="/notes"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#06B6D4] px-4 py-2.5 text-xs font-semibold text-[#020617]"
          >
            <ArrowLeft size={15} />
            Back to Notes
          </Link>
        </div>
      </AppShell>
    );
  }

  const handleSaveNote = (data: CreateNoteData) => {
    updateNote(note.id, data);
    showToast(`Note updated.`);
    setEditModalOpen(false);
  };

  const handleDelete = () => {
    deleteNote(note.id);
    navigate("/notes");
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

        {/* BACK LINK */}
        <Link
          to="/notes"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#64748B] hover:text-[#E5E7EB] transition-colors mb-4"
        >
          <ArrowLeft size={14} />
          Back to Notes
        </Link>

        {/* NOTE HEADER CARD */}
        <div className="rounded-2xl border border-[#1F2937] bg-[#0B1120] p-6 shadow-xl space-y-4 mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Link
                  to={`/subjects/${note.subjectId}`}
                  className="inline-flex items-center gap-1 rounded-md bg-[#06B6D4]/10 px-2.5 py-1 text-xs font-semibold text-[#06B6D4] hover:underline"
                >
                  <BookOpen size={13} />
                  {note.subjectName}
                </Link>

                {note.goalTitle && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#111827] px-2.5 py-1 text-xs font-medium text-[#94A3B8]">
                    <Target size={12} className="text-[#06B6D4]" />
                    {note.goalTitle}
                  </span>
                )}

                {note.taskTitle && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#111827] px-2.5 py-1 text-xs font-medium text-[#94A3B8]">
                    <ListTodo size={12} className="text-emerald-400" />
                    {note.taskTitle}
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-[#E5E7EB]">
                {note.title}
              </h1>

              <div className="mt-2 flex items-center gap-4 text-xs text-[#64748B]">
                <span className="flex items-center gap-1">
                  <CalendarDays size={13} />
                  Updated: {note.updatedAt.split("T")[0]}
                </span>
                <span>Created: {note.createdAt.split("T")[0]}</span>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleFavoriteNote(note.id)}
                className={`p-2 rounded-lg border transition ${
                  note.isFavorite
                    ? "border-amber-400/30 bg-amber-400/10 text-amber-400"
                    : "border-[#1F2937] bg-[#111827] text-[#64748B] hover:text-[#E5E7EB]"
                }`}
                title={note.isFavorite ? "Unfavorite" : "Favorite"}
              >
                <Star size={16} fill={note.isFavorite ? "currentColor" : "none"} />
              </button>

              <button
                type="button"
                onClick={() => setEditModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-[#1F2937] bg-[#111827] px-3 py-2 text-xs font-medium text-[#CBD5E1] hover:bg-[#1F2937] transition"
              >
                <Pencil size={14} />
                Edit
              </button>

              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-400/20 transition"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>

          {/* TAGS */}
          {note.tags && note.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 border-t border-[#1F2937] pt-3">
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-md bg-[#111827] px-2.5 py-1 text-xs font-medium text-[#94A3B8]"
                >
                  <Tag size={11} />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* NOTE CONTENT BODY */}
        <div className="rounded-2xl border border-[#1F2937] bg-[#0B1120] p-6 shadow-xl">
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-[#CBD5E1] font-mono space-y-2">
            {note.content}
          </div>
        </div>

        {/* MODAL */}
        <NoteModal
          open={editModalOpen}
          note={note}
          onClose={() => setEditModalOpen(false)}
          onSave={handleSaveNote}
        />

        {/* DELETE CONFIRMATION MODAL */}
        {deleteConfirmOpen && (
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
            onClick={() => setDeleteConfirmOpen(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl border border-[#1F2937] bg-[#0B1120] p-5 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-bold text-[#E5E7EB]">Delete Note?</h3>
              <p className="text-xs text-[#94A3B8]">
                Are you sure you want to delete this note? This action cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmOpen(false)}
                  className="rounded-lg border border-[#1F2937] px-4 py-2 text-xs text-[#94A3B8]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600"
                >
                  Delete Note
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
