import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileText,
  Plus,
  Search,
  Star,
  Pencil,
  Trash2,
  BookOpen,
  Tag,
  Target,
  ListTodo,
  ArrowRight,
} from "lucide-react";

import AppShell from "../../components/appshell";
import NoteModal from "./components/notemodal";

import { useNotes, type Note, type CreateNoteData } from "../../context/notecontext";
import { useSubjects } from "../../context/subjectcontext";

export default function NotesPage() {
  const navigate = useNavigate();
  const { notes, addNote, updateNote, deleteNote, toggleFavoriteNote } = useNotes();
  const { subjects } = useSubjects();

  // Filters & Search
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  /*
   * FILTER NOTES
   */
  const filteredNotes = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return notes.filter((n) => {
      if (favoritesOnly && !n.isFavorite) return false;
      if (subjectFilter !== "all" && n.subjectId !== subjectFilter) return false;

      if (searchValue) {
        const matchesTitle = n.title.toLowerCase().includes(searchValue);
        const matchesSub = n.subjectName.toLowerCase().includes(searchValue);
        const matchesContent = n.content.toLowerCase().includes(searchValue);
        const matchesTags = (n.tags || []).some((t) => t.toLowerCase().includes(searchValue));
        if (!matchesTitle && !matchesSub && !matchesContent && !matchesTags) return false;
      }

      return true;
    });
  }, [notes, search, subjectFilter, favoritesOnly]);

  const handleSaveNote = (data: CreateNoteData) => {
    if (editingNote) {
      updateNote(editingNote.id, data);
      showToast(`Note "${data.title}" updated.`);
    } else {
      addNote(data);
      showToast(`Note "${data.title}" created.`);
    }

    setModalOpen(false);
    setEditingNote(null);
  };

  const handleDeleteNote = (id: string) => {
    deleteNote(id);
    showToast(`Note deleted.`);
    setDeleteConfirmId(null);
  };

  return (
    <AppShell>
      <div className="min-h-full w-full relative pb-12">
        {/* TOAST */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-[110] flex items-center gap-2 rounded-xl border border-[#06B6D4]/30 bg-[#0B1120] px-4 py-3 text-xs font-medium text-[#E5E7EB] shadow-2xl backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-[#06B6D4]" />
            {toastMessage}
          </div>
        )}

        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FileText size={24} className="text-[#06B6D4]" />
              <h1 className="text-2xl font-bold tracking-tight text-[#E5E7EB]">
                Notes
              </h1>
            </div>
            <p className="mt-1 text-sm text-[#64748B]">
              Capture what you learn and keep your study material organized.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingNote(null);
              setModalOpen(true);
            }}
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
              font-semibold
              text-[#020617]
              shadow-lg
              shadow-[#06B6D4]/10
              transition-all
              hover:bg-[#22D3EE]
              active:scale-[0.98]
            "
          >
            <Plus size={16} strokeWidth={2.5} />
            New Note
          </button>
        </div>

        {/* CONTROLS BAR */}
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1">
            {/* SEARCH */}
            <div className="relative w-full sm:w-72">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notes, tags, content..."
                className="
                  w-full
                  rounded-xl
                  border
                  border-[#1F2937]
                  bg-[#0B1120]
                  py-2
                  pl-9
                  pr-3
                  text-xs
                  text-[#E5E7EB]
                  outline-none
                  placeholder:text-[#475569]
                  focus:border-[#06B6D4]
                "
              />
            </div>

            {/* SUBJECT FILTER */}
            <div className="relative flex items-center">
              <BookOpen size={13} className="absolute left-3 text-[#64748B]" />
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="
                  w-full
                  rounded-xl
                  border
                  border-[#1F2937]
                  bg-[#0B1120]
                  py-2
                  pl-8
                  pr-8
                  text-xs
                  text-[#CBD5E1]
                  outline-none
                  hover:border-[#374151]
                  focus:border-[#06B6D4]
                "
              >
                <option value="all">All Subjects</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* FAVORITES FILTER */}
          <button
            type="button"
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={`
              flex
              items-center
              gap-1.5
              rounded-xl
              border
              px-3
              py-2
              text-xs
              font-medium
              transition
              ${
                favoritesOnly
                  ? "border-amber-400/40 bg-amber-400/10 text-amber-400"
                  : "border-[#1F2937] bg-[#0B1120] text-[#64748B] hover:text-[#E5E7EB]"
              }
            `}
          >
            <Star size={13} fill={favoritesOnly ? "currentColor" : "none"} />
            Favorites
          </button>
        </div>

        {/* NOTES GRID */}
        {filteredNotes.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => navigate(`/notes/${note.id}`)}
                className="
                  group
                  relative
                  flex
                  flex-col
                  justify-between
                  cursor-pointer
                  rounded-2xl
                  border
                  border-[#1F2937]
                  bg-[#0B1120]
                  p-5
                  shadow-lg
                  transition-all
                  duration-200
                  hover:border-[#374151]
                  hover:bg-[#0F172A]
                "
              >
                <div>
                  {/* TOP SUBJECT & FAVORITE */}
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      to={`/subjects/${note.subjectId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 rounded-md bg-[#06B6D4]/10 px-2.5 py-1 text-[10px] font-semibold text-[#06B6D4] hover:underline"
                    >
                      <BookOpen size={11} />
                      {note.subjectName}
                    </Link>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavoriteNote(note.id);
                      }}
                      className={`p-1 transition ${
                        note.isFavorite
                          ? "text-amber-400"
                          : "text-[#475569] hover:text-[#CBD5E1]"
                      }`}
                      title={note.isFavorite ? "Unfavorite" : "Favorite"}
                    >
                      <Star size={15} fill={note.isFavorite ? "currentColor" : "none"} />
                    </button>
                  </div>

                  {/* TITLE */}
                  <h3 className="mt-3 text-base font-semibold text-[#E5E7EB] group-hover:text-white transition-colors truncate">
                    {note.title}
                  </h3>

                  {/* CONTENT PREVIEW */}
                  <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-[#64748B] font-mono">
                    {note.content}
                  </p>

                  {/* METADATA: GOAL, TASK & TAGS */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {note.goalTitle && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#94A3B8] truncate max-w-[140px]">
                          <Target size={11} className="text-[#06B6D4]" />
                          {note.goalTitle}
                        </span>
                      )}

                      {note.taskTitle && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#94A3B8] truncate max-w-[140px]">
                          <ListTodo size={11} className="text-emerald-400" />
                          {note.taskTitle}
                        </span>
                      )}
                    </div>

                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        {note.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-0.5 rounded-md bg-[#111827] px-2 py-0.5 text-[9px] font-medium text-[#64748B]"
                          >
                            <Tag size={9} />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* FOOTER ACTIONS */}
                <div
                  className="mt-5 flex items-center justify-between border-t border-[#1F2937] pt-3 text-[10px] text-[#64748B]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>Updated {note.updatedAt.split("T")[0]}</span>

                  <div className="flex items-center gap-1">
                    <Link
                      to={`/notes/${note.id}`}
                      className="inline-flex items-center gap-1 text-[#06B6D4] font-semibold hover:underline"
                    >
                      Open
                      <ArrowRight size={11} />
                    </Link>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingNote(note);
                        setModalOpen(true);
                      }}
                      className="rounded-lg p-1 text-[#64748B] hover:bg-[#111827] hover:text-[#E5E7EB] transition"
                      title="Edit note"
                    >
                      <Pencil size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(note.id);
                      }}
                      className="rounded-lg p-1 text-[#64748B] hover:bg-red-400/10 hover:text-red-400 transition"
                      title="Delete note"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* EMPTY STATE */
          <div className="rounded-2xl border border-dashed border-[#1F2937] bg-[#0B1120] py-16 text-center">
            <FileText size={36} className="mx-auto mb-3 text-[#334155]" />
            <h3 className="text-sm font-semibold text-[#94A3B8]">
              {search || subjectFilter !== "all" || favoritesOnly
                ? "No matching notes found"
                : "No study notes created yet"}
            </h3>
            <p className="mt-1 text-xs text-[#64748B]">
              {search || subjectFilter !== "all" || favoritesOnly
                ? "Try clearing your filters or search query."
                : "Create notes as you study to keep important concepts in one place."}
            </p>

            <button
              type="button"
              onClick={() => {
                setEditingNote(null);
                setModalOpen(true);
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#06B6D4] px-4 py-2 text-xs font-semibold text-[#020617] hover:bg-[#22D3EE]"
            >
              <Plus size={15} />
              New Note
            </button>
          </div>
        )}

        {/* MODAL */}
        <NoteModal
          open={modalOpen}
          note={editingNote}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveNote}
        />

        {/* DELETE CONFIRMATION MODAL */}
        {deleteConfirmId && (
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
            onClick={() => setDeleteConfirmId(null)}
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
                  onClick={() => setDeleteConfirmId(null)}
                  className="rounded-lg border border-[#1F2937] px-4 py-2 text-xs text-[#94A3B8]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteNote(deleteConfirmId)}
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
