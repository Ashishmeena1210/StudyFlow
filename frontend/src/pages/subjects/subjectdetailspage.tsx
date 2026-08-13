import { useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Target,
  CheckCircle2,
  Clock,
  Pencil,
  Archive,
  Plus,
  FileText,
  FolderKanban,
  ExternalLink,
  TrendingUp,
  X,
  Trash2,
  CalendarDays,
} from "lucide-react";

import AppShell from "../../components/appshell";
import TaskCard from "../tasks/components/taskcard";
import TaskModel from "../tasks/components/taskmodel";
import SubjectModal from "./components/subjectmodal";
import ResourceModal from "../resources/components/resourcemodal";

import { useSubjects, type CreateSubjectData } from "../../context/subjectcontext";
import { useTasks, type Task, type Priority } from "../../context/taskcontext";
import { useGoals } from "../../context/goalcontext";
import { useSessions } from "../../context/sessioncontext";
import { useNotes } from "../../context/notecontext";
import { useResources, type CreateResourceData } from "../../context/resourcecontext";

type SubjectTab = "overview" | "tasks" | "sessions" | "notes" | "resources";

export default function SubjectDetailsPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();

  const { subjects, getSubject, updateSubject, archiveSubject, deleteSubject } = useSubjects();
  const { tasks, addTask, updateTask, deleteTask, toggleTask } = useTasks();
  const { goals } = useGoals();
  const { getSessionsForSubject, getTotalMinutesForSubject, addSession, deleteSession } = useSessions();
  const { getNotesForSubject, addNote, deleteNote } = useNotes();
  const { getResourcesForSubject, addResource, deleteResource: deleteResourceItem } = useResources();

  const subject = useMemo(() => {
    if (!subjectId) return undefined;
    const found = getSubject(subjectId);
    if (found) return found;
    // Fallback search by name
    return subjects.find((s) => s.name.toLowerCase() === subjectId.toLowerCase());
  }, [subjectId, getSubject, subjects]);

  const [activeTab, setActiveTab] = useState<SubjectTab>("overview");

  // Modals state
  const [editSubjectModalOpen, setEditSubjectModalOpen] = useState(false);

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [logSessionModalOpen, setLogSessionModalOpen] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionDuration, setSessionDuration] = useState(45);

  const [addNoteModalOpen, setAddNoteModalOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  const [addResourceModalOpen, setAddResourceModalOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (!subject) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookOpen size={40} className="mb-4 text-[#334155]" />
          <h2 className="text-xl font-bold text-[#E5E7EB]">Subject Not Found</h2>
          <p className="mt-1 text-xs text-[#64748B]">
            The subject you are looking for does not exist or has been removed.
          </p>
          <Link
            to="/subjects"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#06B6D4] px-4 py-2.5 text-xs font-semibold text-[#020617]"
          >
            <ArrowLeft size={15} />
            Back to Subjects
          </Link>
        </div>
      </AppShell>
    );
  }

  // Related data for this subject
  const subjectTasks = tasks.filter(
    (t) =>
      t.subjectId === subject.id ||
      t.subject.toLowerCase() === subject.name.toLowerCase()
  );

  const subjectGoals = goals.filter(
    (g) =>
      g.subjectId === subject.id ||
      g.subject.toLowerCase() === subject.name.toLowerCase()
  );

  const subjectSessions = getSessionsForSubject(subject.id).length > 0
    ? getSessionsForSubject(subject.id)
    : getSessionsForSubject(subject.name);

  const subjectNotes = getNotesForSubject(subject.id).length > 0
    ? getNotesForSubject(subject.id)
    : getNotesForSubject(subject.name);

  // Metrics
  const totalTasks = subjectTasks.length;
  const completedTasks = subjectTasks.filter((t) => t.completed).length;
  const activeTasks = totalTasks - completedTasks;
  const progressPercent =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalStudyMinutes =
    getTotalMinutesForSubject(subject.id) || getTotalMinutesForSubject(subject.name);
  const formattedStudyTime = useMemo(() => {
    const hours = Math.floor(totalStudyMinutes / 60);
    const mins = totalStudyMinutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  }, [totalStudyMinutes]);

  const accentColor = subject.color || "#06B6D4";

  /*
   * Handlers
   */
  const handleUpdateSubject = (data: CreateSubjectData) => {
    updateSubject(subject.id, data);
    showToast(`Subject updated.`);
    setEditSubjectModalOpen(false);
  };

  const handleArchiveSubject = () => {
    archiveSubject(subject.id);
    showToast(`Subject "${subject.name}" archived.`);
  };

  const handleDeleteSubject = () => {
    deleteSubject(subject.id);
    navigate("/subjects");
  };

  const handleSaveTask = (data: {
    title: string;
    description: string;
    subject: string;
    priority: Priority;
    dueDate: string;
  }) => {
    if (editingTask) {
      updateTask(editingTask.id, {
        ...data,
        subject: subject.name,
        subjectId: subject.id,
      });
      showToast(`Task updated.`);
    } else {
      addTask({
        ...data,
        subject: subject.name,
        subjectId: subject.id,
      });
      showToast(`Task added to ${subject.name}.`);
    }
    setTaskModalOpen(false);
    setEditingTask(null);
  };

  const handleLogSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionTitle.trim()) return;

    addSession({
      subjectId: subject.id,
      subjectName: subject.name,
      sessionType: "Focus",
      notes: sessionTitle.trim() || undefined,
      durationMinutes: Number(sessionDuration) || 30,
    });

    showToast(`Study session logged (${sessionDuration}m)!`);
    setSessionTitle("");
    setSessionDuration(45);
    setLogSessionModalOpen(false);
  };

  const subjectResources = getResourcesForSubject(subject.id).length > 0
    ? getResourcesForSubject(subject.id)
    : getResourcesForSubject(subject.name);

  const handleSaveResource = (data: CreateResourceData) => {
    addResource(data);
    showToast(`Resource "${data.title}" added to ${subject.name}!`);
    setAddResourceModalOpen(false);
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;

    addNote({
      subjectId: subject.id,
      subjectName: subject.name,
      title: noteTitle.trim(),
      content: noteContent.trim(),
    });

    showToast(`Note "${noteTitle}" created!`);
    setNoteTitle("");
    setNoteContent("");
    setAddNoteModalOpen(false);
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

        {/* BACK LINK */}
        <Link
          to="/subjects"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#64748B] hover:text-[#E5E7EB] transition-colors mb-4"
        >
          <ArrowLeft size={14} />
          Back to Subjects
        </Link>

        {/* SUBJECT HEADER CARD */}
        <div className="relative rounded-2xl border border-[#1F2937] bg-[#0B1120] p-6 shadow-xl overflow-hidden mb-6">
          <div
            className="absolute left-0 top-0 bottom-0 w-2"
            style={{ backgroundColor: accentColor }}
          />

          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between pl-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold"
                  style={{
                    backgroundColor: `${accentColor}1A`,
                    color: accentColor,
                  }}
                >
                  <BookOpen size={18} />
                </span>

                {subject.courseCode && (
                  <span className="rounded-md bg-[#111827] px-2.5 py-1 text-xs font-semibold text-[#94A3B8]">
                    {subject.courseCode}
                  </span>
                )}

                <span className="rounded-md border border-[#06B6D4]/20 bg-[#06B6D4]/10 px-2.5 py-1 text-[10px] font-semibold text-[#06B6D4] uppercase">
                  {subject.status}
                </span>
              </div>

              <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#E5E7EB]">
                {subject.name}
              </h1>

              {subject.description && (
                <p className="mt-1.5 text-sm text-[#94A3B8] leading-relaxed max-w-3xl">
                  {subject.description}
                </p>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setEditSubjectModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-[#1F2937] bg-[#111827] px-3 py-2 text-xs font-medium text-[#CBD5E1] hover:bg-[#1F2937] transition"
              >
                <Pencil size={13} />
                Edit
              </button>

              <button
                type="button"
                onClick={handleArchiveSubject}
                className="flex items-center gap-1.5 rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs font-medium text-amber-400 hover:bg-amber-400/20 transition"
              >
                <Archive size={13} />
                Archive
              </button>

              <button
                type="button"
                onClick={handleDeleteSubject}
                className="flex items-center gap-1.5 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-400/20 transition"
              >
                <Trash2 size={13} />
                Delete
              </button>
            </div>
          </div>

          {/* OVERVIEW METRICS BAR */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5 border-t border-[#1F2937] pt-5 pl-2">
            <div>
              <span className="text-[10px] font-medium text-[#64748B] uppercase">Overall Progress</span>
              <p className="mt-1 text-xl font-bold text-[#E5E7EB]">
                {totalTasks > 0 ? `${progressPercent}%` : "No tasks"}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-medium text-[#64748B] uppercase">Goals</span>
              <p className="mt-1 text-xl font-bold text-[#06B6D4]">{subjectGoals.length}</p>
            </div>

            <div>
              <span className="text-[10px] font-medium text-[#64748B] uppercase">Active Tasks</span>
              <p className="mt-1 text-xl font-bold text-amber-400">{activeTasks}</p>
            </div>

            <div>
              <span className="text-[10px] font-medium text-[#64748B] uppercase">Completed Tasks</span>
              <p className="mt-1 text-xl font-bold text-emerald-400">{completedTasks}</p>
            </div>

            <div>
              <span className="text-[10px] font-medium text-[#64748B] uppercase">Study Time</span>
              <p className="mt-1 text-xl font-bold text-violet-400">{formattedStudyTime}</p>
            </div>
          </div>
        </div>

        {/* INTERNAL VIEW TABS */}
        <div className="mb-6 flex items-center gap-2 border-b border-[#1F2937] pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "overview"
                ? "bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/30"
                : "text-[#64748B] hover:text-[#E5E7EB]"
            }`}
          >
            <TrendingUp size={14} />
            Overview
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tasks")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "tasks"
                ? "bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/30"
                : "text-[#64748B] hover:text-[#E5E7EB]"
            }`}
          >
            <Target size={14} />
            Goals & Tasks ({totalTasks})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("sessions")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "sessions"
                ? "bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/30"
                : "text-[#64748B] hover:text-[#E5E7EB]"
            }`}
          >
            <Clock size={14} />
            Sessions ({subjectSessions.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("notes")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "notes"
                ? "bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/30"
                : "text-[#64748B] hover:text-[#E5E7EB]"
            }`}
          >
            <FileText size={14} />
            Notes ({subjectNotes.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("resources")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "resources"
                ? "bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/30"
                : "text-[#64748B] hover:text-[#E5E7EB]"
            }`}
          >
            <FolderKanban size={14} />
            Resources ({subjectResources.length})
          </button>
        </div>

        {/* ================= OVERVIEW TAB ================= */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* GOALS PREVIEW */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-bold text-[#E5E7EB]">
                  Subject Goals ({subjectGoals.length})
                </h3>
              </div>

              {subjectGoals.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {subjectGoals.map((goal) => {
                    const gTasks = tasks.filter((t) => t.goalId === goal.id);
                    const gCompleted = gTasks.filter((t) => t.completed).length;
                    const gProg =
                      gTasks.length > 0
                        ? Math.round((gCompleted / gTasks.length) * 100)
                        : 0;
                    return (
                      <div
                        key={goal.id}
                        className="rounded-xl border border-[#1F2937] bg-[#0B1120] p-4 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="rounded-md bg-[#06B6D4]/10 px-2 py-0.5 text-[10px] font-semibold text-[#06B6D4]">
                            {goal.subject}
                          </span>
                          <span className="text-[10px] text-[#64748B]">
                            Target: {goal.targetDate}
                          </span>
                        </div>
                        <h4 className="mt-2 text-sm font-semibold text-[#E5E7EB]">
                          {goal.title}
                        </h4>
                        <p className="mt-1 text-xs text-[#64748B] line-clamp-2">
                          {goal.description}
                        </p>
                        <div className="mt-3 flex items-center justify-between text-xs text-[#94A3B8]">
                          <span>
                            {gCompleted}/{gTasks.length} tasks completed
                          </span>
                          <span className="font-bold text-[#E5E7EB]">
                            {gProg}%
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#1F2937]">
                          <div
                            className="h-full rounded-full bg-[#06B6D4] transition-all"
                            style={{ width: `${gProg}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#1F2937] bg-[#0B1120] py-6 text-center">
                  <p className="text-xs text-[#64748B]">No goals for this subject yet.</p>
                </div>
              )}
            </div>

            {/* TASKS PREVIEW */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-bold text-[#E5E7EB]">
                  Tasks ({subjectTasks.length})
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setEditingTask(null);
                    setTaskModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#06B6D4]"
                >
                  <Plus size={13} /> Add Task
                </button>
              </div>

              {subjectTasks.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {subjectTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      title={task.title}
                      description={task.description}
                      subject={task.subject}
                      priority={task.priority}
                      dueDate={task.dueDate}
                      completed={task.completed}
                      onToggleComplete={() => toggleTask(task.id)}
                      onEdit={() => {
                        setEditingTask(task);
                        setTaskModalOpen(true);
                      }}
                      onDelete={() => deleteTask(task.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#1F2937] bg-[#0B1120] py-6 text-center">
                  <p className="text-xs text-[#64748B]">No tasks for this subject yet.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTask(null);
                      setTaskModalOpen(true);
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#06B6D4] px-3 py-1.5 text-xs font-semibold text-[#020617]"
                  >
                    <Plus size={13} /> Add Task
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= GOALS & TASKS TAB ================= */}
        {activeTab === "tasks" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#E5E7EB]">
                Tasks ({subjectTasks.length})
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingTask(null);
                  setTaskModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-[#06B6D4] px-4 py-2 text-xs font-semibold text-[#020617]"
              >
                <Plus size={15} /> Add Task
              </button>
            </div>

            {subjectTasks.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {subjectTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    title={task.title}
                    description={task.description}
                    subject={task.subject}
                    priority={task.priority}
                    dueDate={task.dueDate}
                    completed={task.completed}
                    onToggleComplete={() => toggleTask(task.id)}
                    onEdit={() => {
                      setEditingTask(task);
                      setTaskModalOpen(true);
                    }}
                    onDelete={() => deleteTask(task.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#1F2937] bg-[#0B1120] py-14 text-center">
                <CheckCircle2 size={36} className="mx-auto mb-3 text-[#334155]" />
                <h3 className="text-sm font-semibold text-[#94A3B8]">No tasks for this subject yet</h3>
                <button
                  type="button"
                  onClick={() => {
                    setEditingTask(null);
                    setTaskModalOpen(true);
                  }}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#06B6D4] px-4 py-2 text-xs font-semibold text-[#020617]"
                >
                  <Plus size={14} /> Add Task
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================= SESSIONS TAB ================= */}
        {activeTab === "sessions" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#E5E7EB]">
                Study Sessions ({subjectSessions.length})
              </h3>
              <button
                type="button"
                onClick={() => setLogSessionModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#06B6D4] px-4 py-2 text-xs font-semibold text-[#020617]"
              >
                <Plus size={15} /> Log Session
              </button>
            </div>

            {subjectSessions.length > 0 ? (
              <div className="space-y-3">
                {subjectSessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-xl border border-[#1F2937] bg-[#0B1120] p-4">
                    <div>
                      <h4 className="text-sm font-semibold text-[#E5E7EB]">
                        {s.notes || `${s.sessionType} Session`}
                      </h4>
                      <span className="text-xs text-[#64748B] flex items-center gap-1.5 mt-1">
                        <CalendarDays size={12} /> {s.date}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-md bg-violet-400/10 px-3 py-1 text-xs font-bold text-violet-400">
                        {s.durationMinutes} mins
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteSession(s.id)}
                        className="p-1 text-[#64748B] hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#1F2937] bg-[#0B1120] py-14 text-center">
                <Clock size={36} className="mx-auto mb-3 text-[#334155]" />
                <h3 className="text-sm font-semibold text-[#94A3B8]">No study sessions logged yet</h3>
                <button
                  type="button"
                  onClick={() => setLogSessionModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#06B6D4] px-4 py-2 text-xs font-semibold text-[#020617]"
                >
                  <Plus size={14} /> Log Session
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================= NOTES TAB ================= */}
        {activeTab === "notes" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#E5E7EB]">
                Subject Notes ({subjectNotes.length})
              </h3>
              <button
                type="button"
                onClick={() => setAddNoteModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#06B6D4] px-4 py-2 text-xs font-semibold text-[#020617]"
              >
                <Plus size={15} /> Create Note
              </button>
            </div>

            {subjectNotes.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {subjectNotes.map((n) => (
                  <div key={n.id} className="flex flex-col justify-between rounded-xl border border-[#1F2937] bg-[#0B1120] p-4">
                    <div>
                      <h4 className="text-sm font-semibold text-[#E5E7EB]">{n.title}</h4>
                      <p className="mt-2 text-xs text-[#94A3B8] leading-relaxed line-clamp-3">
                        {n.content}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-[#1F2937] pt-3 text-[10px] text-[#64748B]">
                      <span>Updated {n.updatedAt.split("T")[0]}</span>
                      <button
                        type="button"
                        onClick={() => deleteNote(n.id)}
                        className="text-[#64748B] hover:text-red-400"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#1F2937] bg-[#0B1120] py-14 text-center">
                <FileText size={36} className="mx-auto mb-3 text-[#334155]" />
                <h3 className="text-sm font-semibold text-[#94A3B8]">No notes created yet</h3>
                <button
                  type="button"
                  onClick={() => setAddNoteModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#06B6D4] px-4 py-2 text-xs font-semibold text-[#020617]"
                >
                  <Plus size={14} /> Create Note
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================= RESOURCES TAB ================= */}
        {activeTab === "resources" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h3 className="text-base font-bold text-[#E5E7EB]">
                Learning Resources ({subjectResources.length})
              </h3>

              <div className="flex items-center gap-2">
                <Link
                  to={`/resources/subject/${subject.id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#06B6D4]/40 bg-[#06B6D4]/10 px-3.5 py-2 text-xs font-bold text-[#06B6D4] hover:bg-[#06B6D4] hover:text-[#020617] transition"
                >
                  View All Resources →
                </Link>

                <button
                  type="button"
                  onClick={() => setAddResourceModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#06B6D4] px-4 py-2 text-xs font-semibold text-[#020617]"
                >
                  <Plus size={15} /> Add Resource
                </button>
              </div>
            </div>

            {subjectResources.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {subjectResources.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-col justify-between rounded-xl border border-[#1F2937] bg-[#0B1120] p-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-md bg-[#06B6D4]/10 px-2 py-0.5 text-[10px] font-semibold text-[#06B6D4]">
                          {r.type}
                        </span>
                        {r.url && (
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#06B6D4] hover:underline"
                          >
                            Open Link <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                      <h4 className="mt-2 text-sm font-semibold text-[#E5E7EB]">{r.title}</h4>
                      {r.description && (
                        <p className="mt-1 text-xs text-[#94A3B8] leading-relaxed line-clamp-2">
                          {r.description}
                        </p>
                      )}
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-[#1F2937] pt-3 text-[10px] text-[#64748B]">
                      <span>Added {r.createdAt.split("T")[0]}</span>
                      <button
                        type="button"
                        onClick={() => deleteResourceItem(r.id)}
                        className="text-[#64748B] hover:text-red-400"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#1F2937] bg-[#0B1120] py-14 text-center">
                <FolderKanban size={36} className="mx-auto mb-3 text-[#334155]" />
                <h3 className="text-sm font-semibold text-[#94A3B8]">No resources added for this subject yet</h3>
                <button
                  type="button"
                  onClick={() => setAddResourceModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#06B6D4] px-4 py-2 text-xs font-semibold text-[#020617]"
                >
                  <Plus size={14} /> Add Resource
                </button>
              </div>
            )}
          </div>
        )}

        {/* MODALS */}
        <SubjectModal
          open={editSubjectModalOpen}
          subject={subject}
          onClose={() => setEditSubjectModalOpen(false)}
          onSave={handleUpdateSubject}
        />

        <ResourceModal
          open={addResourceModalOpen}
          resource={null}
          onClose={() => setAddResourceModalOpen(false)}
          onSave={handleSaveResource}
        />

        <TaskModel
          open={taskModalOpen}
          task={editingTask}
          subjects={[subject.name]}
          onClose={() => setTaskModalOpen(false)}
          onSave={handleSaveTask}
        />

        {/* LOG SESSION MODAL */}
        {logSessionModalOpen && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
            onClick={() => setLogSessionModalOpen(false)}
          >
            <form
              onSubmit={handleLogSession}
              className="w-full max-w-md rounded-2xl border border-[#1F2937] bg-[#0B1120] p-5 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
                <h3 className="text-base font-semibold text-[#E5E7EB]">Log Study Session</h3>
                <button
                  type="button"
                  onClick={() => setLogSessionModalOpen(false)}
                  className="rounded-lg p-1 text-[#64748B] hover:text-[#E5E7EB]"
                >
                  <X size={16} />
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1">Topic / Title</label>
                <input
                  type="text"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="e.g. Subnetting practice"
                  className="w-full rounded-lg border border-[#1F2937] bg-[#020617] p-2.5 text-xs text-[#E5E7EB] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="480"
                  value={sessionDuration}
                  onChange={(e) => setSessionDuration(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#1F2937] bg-[#020617] p-2.5 text-xs text-[#E5E7EB] outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setLogSessionModalOpen(false)}
                  className="rounded-lg border border-[#1F2937] px-4 py-2 text-xs text-[#94A3B8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#06B6D4] px-4 py-2 text-xs font-semibold text-[#020617]"
                >
                  Save Session
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ADD NOTE MODAL */}
        {addNoteModalOpen && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
            onClick={() => setAddNoteModalOpen(false)}
          >
            <form
              onSubmit={handleCreateNote}
              className="w-full max-w-lg rounded-2xl border border-[#1F2937] bg-[#0B1120] p-5 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
                <h3 className="text-base font-semibold text-[#E5E7EB]">Create Subject Note</h3>
                <button
                  type="button"
                  onClick={() => setAddNoteModalOpen(false)}
                  className="rounded-lg p-1 text-[#64748B] hover:text-[#E5E7EB]"
                >
                  <X size={16} />
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1">Title</label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="e.g. OSI Model Summary"
                  className="w-full rounded-lg border border-[#1F2937] bg-[#020617] p-2.5 text-xs text-[#E5E7EB] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1">Note Content</label>
                <textarea
                  rows={4}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Write your study notes..."
                  className="w-full rounded-lg border border-[#1F2937] bg-[#020617] p-2.5 text-xs text-[#E5E7EB] outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddNoteModalOpen(false)}
                  className="rounded-lg border border-[#1F2937] px-4 py-2 text-xs text-[#94A3B8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#06B6D4] px-4 py-2 text-xs font-semibold text-[#020617]"
                >
                  Create Note
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AppShell>
  );
}
