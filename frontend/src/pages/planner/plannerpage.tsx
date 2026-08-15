import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  ArrowUpDown,
  Filter as FilterIcon,
  CheckCircle2,
  Clock,
  ListTodo,
  TrendingUp,
  AlertTriangle,
  X,
  Trash2,
  AlertCircle,
} from "lucide-react";

import AppShell from "../../components/appshell";
import TaskCard from "../tasks/components/taskcard";
import TaskModel from "../tasks/components/taskmodel";

import { useTasks, type Task, type Priority } from "../../context/taskcontext";
import { useGoals } from "../../context/goalcontext";
import { useSubjects } from "../../context/subjectcontext";

const defaultSubjects = [
  "Networks",
  "Mathematics",
  "DSA",
  "Operating Systems",
  "DBMS",
];

type TaskFilter = "all" | "today" | "upcoming" | "completed" | "overdue";
type TaskSortOption = "due_date" | "priority" | "recently_created";

const taskFilters: { value: TaskFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "today", label: "Today" },
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
  { value: "overdue", label: "Overdue" },
];

const priorityWeight: Record<Priority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

interface TaskSaveData {
  title: string;
  description: string;
  subject: string;
  priority: Priority;
  dueDate: string;
}

export default function PlannerPage() {
  const navigate = useNavigate();
  const { tasks, loading: tasksLoading, error: tasksError, addTask, updateTask, deleteTask, toggleTask } = useTasks();
  const { loading: goalsLoading, error: goalsError } = useGoals();
  const { subjects: contextSubjects, addSubject } = useSubjects();

  const loading = tasksLoading || goalsLoading;

  // Filters & Search
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [taskSortBy, setTaskSortBy] = useState<TaskSortOption>("due_date");
  const [search, setSearch] = useState("");

  // Modals state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const getLocalDateString = (d: Date = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayStr = useMemo(() => getLocalDateString(), []);

  // Available subjects
  const availableSubjects = useMemo(() => {
    const set = new Set([
      ...defaultSubjects,
      ...contextSubjects.map((s) => s.name),
      ...tasks.map((t) => t.subject),
    ]);
    return Array.from(set).filter(Boolean);
  }, [contextSubjects, tasks]);

  /*
   * --------------------------------
   * METRICS & OVERVIEW CALCULATIONS
   * --------------------------------
   */
  const metrics = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.completed).length;
    const activeTasks = tasks.filter((t) => !t.completed).length;
    const remainingTasks = totalTasks - completedTasks;

    const overdueTasks = tasks.filter(
      (t) => !t.completed && t.dueDate < todayStr
    ).length;

    const overallProgress =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalTasks,
      activeTasks,
      completedTasks,
      remainingTasks,
      overdueTasks,
      overallProgress,
    };
  }, [tasks, todayStr]);

  /*
   * --------------------------------
   * FILTERED TASKS
   * --------------------------------
   */
  const filteredTasks = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    const result = tasks.filter((task: Task) => {
      if (taskFilter === "completed" && !task.completed) return false;
      if (taskFilter === "today" && task.dueDate !== todayStr) return false;
      if (taskFilter === "upcoming" && (task.completed || task.dueDate <= todayStr)) return false;
      if (taskFilter === "overdue" && (task.completed || task.dueDate >= todayStr)) return false;

      if (subjectFilter !== "all" && task.subject !== subjectFilter) return false;

      if (searchValue) {
        const matchesTitle = task.title.toLowerCase().includes(searchValue);
        const matchesSubject = task.subject.toLowerCase().includes(searchValue);
        const matchesDesc = (task.description || "").toLowerCase().includes(searchValue);
        if (!matchesTitle && !matchesSubject && !matchesDesc) return false;
      }

      return true;
    });

    return result.sort((a, b) => {
      if (taskSortBy === "due_date") return (a.dueDate || "").localeCompare(b.dueDate || "");
      if (taskSortBy === "priority") return priorityWeight[b.priority] - priorityWeight[a.priority];
      if (taskSortBy === "recently_created") return (b.createdAt || "").localeCompare(a.createdAt || "");
      return 0;
    });
  }, [tasks, taskFilter, subjectFilter, search, taskSortBy, todayStr]);

  /*
   * Handlers
   */
  const handleSaveTask = async (data: TaskSaveData) => {
    if (data.subject) {
      const subjectName = data.subject.trim();
      const existing = contextSubjects.find(
        (s) => s.name.toLowerCase() === subjectName.toLowerCase()
      );
      if (!existing) {
        try {
          await addSubject({ name: subjectName });
        } catch (err) {
          console.warn("Auto subject creation failed:", err);
        }
      }
    }

    if (editingTask) {
      updateTask(editingTask.id, data);
      showToast(`Task "${data.title}" updated.`);
    } else {
      addTask(data);
      showToast(`Task "${data.title}" added.`);
    }
    setTaskModalOpen(false);
    setEditingTask(null);
  };

  const confirmDeleteTask = () => {
    if (taskToDelete) {
      deleteTask(taskToDelete.id);
      showToast(`Task "${taskToDelete.title}" deleted.`);
      setTaskToDelete(null);
    }
  };

  return (
    <AppShell>
      <div className="min-h-full w-full relative pb-10">
        {/* TOAST */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-[110] flex items-center gap-2 rounded-xl border border-[#06B6D4]/30 bg-[#0B1120] px-4 py-3 text-xs font-medium text-[#E5E7EB] shadow-2xl backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-[#06B6D4]" />
            {toastMessage}
          </div>
        )}

        {/* HEADER */}
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#E5E7EB]">
              Study Planner
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#64748B]">
              Organize your tasks, prioritize your studies, and track your progress.
            </p>
          </div>

          {/* TOP RIGHT SINGLE ACTION BUTTON */}
          <button
            type="button"
            onClick={() => {
              setEditingTask(null);
              setTaskModalOpen(true);
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
            Add Task
          </button>
        </div>

        {/* COMPACT OVERVIEW WIDGET */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-xl border border-[#1F2937] bg-[#0B1120] p-3.5 transition-all hover:border-[#374151]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[#64748B]">Total Tasks</span>
              <ListTodo size={15} className="text-[#94A3B8]" />
            </div>
            <p className="mt-1.5 text-xl font-bold text-[#E5E7EB]">{metrics.totalTasks}</p>
          </div>

          <div className="rounded-xl border border-[#1F2937] bg-[#0B1120] p-3.5 transition-all hover:border-[#374151]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[#64748B]">Active</span>
              <Clock size={15} className="text-[#06B6D4]" />
            </div>
            <p className="mt-1.5 text-xl font-bold text-[#06B6D4]">{metrics.activeTasks}</p>
          </div>

          <div className="rounded-xl border border-[#1F2937] bg-[#0B1120] p-3.5 transition-all hover:border-[#374151]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[#64748B]">Completed</span>
              <CheckCircle2 size={15} className="text-emerald-400" />
            </div>
            <p className="mt-1.5 text-xl font-bold text-emerald-400">{metrics.completedTasks}</p>
          </div>

          <div className="rounded-xl border border-[#1F2937] bg-[#0B1120] p-3.5 transition-all hover:border-[#374151]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[#64748B]">Remaining</span>
              <Clock size={15} className="text-amber-400" />
            </div>
            <p className="mt-1.5 text-xl font-bold text-amber-400">{metrics.remainingTasks}</p>
          </div>

          <div className="rounded-xl border border-[#1F2937] bg-[#0B1120] p-3.5 transition-all hover:border-[#374151]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[#64748B]">Overdue</span>
              <AlertCircle size={15} className="text-red-400" />
            </div>
            <p className="mt-1.5 text-xl font-bold text-red-400">{metrics.overdueTasks}</p>
          </div>

          <div className="rounded-xl border border-[#1F2937] bg-[#0B1120] p-3.5 transition-all hover:border-[#374151]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[#64748B]">Overall Progress</span>
              <TrendingUp size={15} className="text-violet-400" />
            </div>
            <p className="mt-1.5 text-xl font-bold text-violet-400">{metrics.overallProgress}%</p>
          </div>
        </div>

        {/* CONTROLS BAR: SEARCH, FILTERS, & SORT */}
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
                placeholder="Search tasks or subjects..."
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
              <FilterIcon size={13} className="absolute left-3 text-[#64748B]" />
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
                {availableSubjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* STATUS FILTERS & SORT */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl border border-[#1F2937] bg-[#0B1120] p-1">
              {taskFilters.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setTaskFilter(item.value)}
                  className={`
                    rounded-lg
                    px-2.5
                    py-1
                    text-[11px]
                    font-medium
                    transition-all
                    ${
                      taskFilter === item.value
                        ? "bg-[#06B6D4]/15 text-[#06B6D4]"
                        : "text-[#64748B] hover:text-[#E5E7EB]"
                    }
                  `}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="relative flex items-center">
              <ArrowUpDown size={13} className="absolute left-3 text-[#64748B]" />
              <select
                value={taskSortBy}
                onChange={(e) => setTaskSortBy(e.target.value as TaskSortOption)}
                className="
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
                <option value="due_date">Sort by Due Date</option>
                <option value="priority">Sort by Priority</option>
                <option value="recently_created">Sort by Newest</option>
              </select>
            </div>
          </div>
        </div>

        {/* SINGLE UNIFIED TASK GRID, LOADING, OR EMPTY STATE */}
        {loading ? (
          <div className="rounded-2xl border border-[#1F2937] bg-[#0B1120] py-20 text-center space-y-3">
            <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#06B6D4]/30 border-t-[#06B6D4]" />
            <p className="text-xs text-[#94A3B8]">Loading study tasks & goals...</p>
          </div>
        ) : filteredTasks.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 pb-8">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                title={task.title}
                description={task.description}
                subject={task.subject}
                priority={task.priority}
                dueDate={task.dueDate}
                completed={task.completed}
                onToggleComplete={() => {
                  toggleTask(task.id);
                  showToast(
                    task.completed
                      ? `Reopened "${task.title}"`
                      : `Completed "${task.title}"!`
                  );
                }}
                onStartSession={() =>
                  navigate(`/sessions?taskId=${task.id}&subjectId=${task.subjectId || ""}`)
                }
                onEdit={() => {
                  setEditingTask(task);
                  setTaskModalOpen(true);
                }}
                onDelete={() => setTaskToDelete(task)}
              />
            ))}
          </div>
        ) : (
          /* EMPTY STATE */
          <div className="rounded-2xl border border-dashed border-[#1F2937] bg-[#0B1120] py-16 text-center">
            <ListTodo size={36} className="mx-auto mb-3 text-[#334155]" />
            <h3 className="text-sm font-semibold text-[#94A3B8]">
              {search || taskFilter !== "all" || subjectFilter !== "all"
                ? "No matching tasks found"
                : tasksError || goalsError
                ? "Unable to load tasks"
                : "No study tasks yet"}
            </h3>
            <p className="mt-1 text-xs text-[#64748B]">
              {search || taskFilter !== "all" || subjectFilter !== "all"
                ? "Try clearing your search keyword or filters."
                : tasksError || goalsError
                ? tasksError || goalsError
                : "Add your first study task to start organizing your plan."}
            </p>

            <button
              type="button"
              onClick={() => {
                setEditingTask(null);
                setTaskModalOpen(true);
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#06B6D4] px-4 py-2 text-xs font-semibold text-[#020617] hover:bg-[#22D3EE]"
            >
              <Plus size={14} />
              Add Task
            </button>
          </div>
        )}

        {/* TASK CREATION & EDIT MODAL */}
        <TaskModel
          open={taskModalOpen}
          task={editingTask}
          subjects={availableSubjects}
          onClose={() => setTaskModalOpen(false)}
          onSave={handleSaveTask}
        />

        {/* DELETE TASK CONFIRM MODAL */}
        {taskToDelete && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
            onClick={() => setTaskToDelete(null)}
          >
            <div
              className="w-full max-w-md rounded-2xl border border-[#1F2937] bg-[#0B1120] p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertTriangle size={18} />
                  <h3 className="text-base font-semibold text-[#E5E7EB]">
                    Delete Task
                  </h3>
                </div>
                <button
                  onClick={() => setTaskToDelete(null)}
                  className="rounded-lg p-1 text-[#64748B] hover:text-[#E5E7EB]"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-[#94A3B8]">
                Are you sure you want to delete task{" "}
                <span className="font-semibold text-[#E5E7EB]">
                  "{taskToDelete.title}"
                </span>
                ? This action cannot be undone.
              </p>

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTaskToDelete(null)}
                  className="rounded-lg border border-[#1F2937] px-4 py-2 text-xs font-medium text-[#94A3B8]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteTask}
                  className="flex items-center gap-1.5 rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600"
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
