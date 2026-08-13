import { useMemo, useState } from "react";
import {
  BookOpen,
  Plus,
  Search,
  ArrowUpDown,
} from "lucide-react";

import AppShell from "../../components/appshell";
import SubjectCard from "./components/subjectcard";
import SubjectModal from "./components/subjectmodal";

import { useSubjects, type Subject, type SubjectStatus, type CreateSubjectData } from "../../context/subjectcontext";
import { useTasks } from "../../context/taskcontext";
import { useGoals } from "../../context/goalcontext";

type StatusFilter = "all" | SubjectStatus;
type SortOption = "name" | "progress" | "recently_created" | "most_active";

const filters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

export default function SubjectsPage() {
  const { subjects, loading, error, addSubject, updateSubject } = useSubjects();
  const { tasks } = useTasks();
  const { goals } = useGoals();

  const [filter, setFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  /*
   * FILTER & SORT SUBJECTS
   */
  const filteredSubjects = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    const result = subjects.filter((subject) => {
      // Status filter
      if (filter !== "all" && subject.status !== filter) {
        return false;
      }

      // Search query
      if (searchValue) {
        const matchesName = subject.name.toLowerCase().includes(searchValue);
        const matchesCode = (subject.courseCode || "").toLowerCase().includes(searchValue);
        const matchesDesc = (subject.description || "").toLowerCase().includes(searchValue);
        if (!matchesName && !matchesCode && !matchesDesc) {
          return false;
        }
      }

      return true;
    });

    return result.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "recently_created") {
        return (b.createdAt || "").localeCompare(a.createdAt || "");
      }

      // Compute progress & activity for sorting
      const aTasks = tasks.filter(
        (t) => t.subjectId === a.id || t.subject.toLowerCase() === a.name.toLowerCase()
      );
      const bTasks = tasks.filter(
        (t) => t.subjectId === b.id || t.subject.toLowerCase() === b.name.toLowerCase()
      );

      if (sortBy === "most_active") {
        return bTasks.length - aTasks.length;
      }

      if (sortBy === "progress") {
        const aProg =
          aTasks.length > 0
            ? aTasks.filter((t) => t.completed).length / aTasks.length
            : 0;
        const bProg =
          bTasks.length > 0
            ? bTasks.filter((t) => t.completed).length / bTasks.length
            : 0;
        return bProg - aProg;
      }

      return 0;
    });
  }, [subjects, tasks, filter, search, sortBy]);

  const handleCreateSubject = () => {
    setEditingSubject(null);
    setModalOpen(true);
  };

  const handleSaveSubject = async (data: CreateSubjectData) => {
    try {
      if (editingSubject) {
        await updateSubject(editingSubject.id, data);
        showToast(`Subject "${data.name}" updated.`);
      } else {
        await addSubject(data);
        showToast(`Subject "${data.name}" created!`);
      }

      setModalOpen(false);
      setEditingSubject(null);
    } catch (err: any) {
      showToast(err.message || "Failed to save subject.");
    }
  };

  return (
    <AppShell>
      <div className="min-h-full w-full relative pb-10">
        {/* TOAST NOTIFICATION */}
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
              <BookOpen size={24} className="text-[#06B6D4]" />
              <h1 className="text-2xl font-bold tracking-tight text-[#E5E7EB]">
                Subjects
              </h1>
            </div>
            <p className="mt-1 text-sm text-[#64748B]">
              Organize your courses, track your progress, and keep everything in one place.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreateSubject}
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
            Add Subject
          </button>
        </div>

        {/* CONTROLS BAR: SEARCH, FILTERS & SORT */}
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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
              placeholder="Search subjects or course codes..."
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

          {/* STATUS TABS & SORT */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl border border-[#1F2937] bg-[#0B1120] p-1">
              {filters.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  className={`
                    rounded-lg
                    px-3
                    py-1.5
                    text-xs
                    font-medium
                    transition-all
                    ${
                      filter === item.value
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
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
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
                <option value="name">Sort by Name</option>
                <option value="progress">Sort by Progress</option>
                <option value="most_active">Sort by Most Active</option>
                <option value="recently_created">Sort by Newest</option>
              </select>
            </div>
          </div>
        </div>

        {/* SUBJECT CARDS GRID, LOADING, OR EMPTY STATE */}
        {loading ? (
          <div className="rounded-2xl border border-[#1F2937] bg-[#0B1120] py-20 text-center space-y-3">
            <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#06B6D4]/30 border-t-[#06B6D4]" />
            <p className="text-xs text-[#94A3B8]">Loading subjects...</p>
          </div>
        ) : filteredSubjects.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSubjects.map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                tasks={tasks}
                goals={goals}
              />
            ))}
          </div>
        ) : (
          /* EMPTY STATE */
          <div className="rounded-2xl border border-dashed border-[#1F2937] bg-[#0B1120] py-20 text-center">
            <BookOpen size={36} className="mx-auto mb-3 text-[#334155]" />
            <h3 className="text-sm font-semibold text-[#94A3B8]">
              {search || filter !== "all"
                ? "No matching subjects found"
                : error
                ? "Unable to load subjects"
                : "No subjects yet"}
            </h3>
            <p className="mt-1 text-xs text-[#64748B]">
              {search || filter !== "all"
                ? "Try clearing your search query or status filter."
                : error
                ? error
                : "Create your first subject to organize your study plan."}
            </p>

            <button
              type="button"
              onClick={handleCreateSubject}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#06B6D4] px-4 py-2.5 text-xs font-semibold text-[#020617] hover:bg-[#22D3EE]"
            >
              <Plus size={15} />
              Add Subject
            </button>
          </div>
        )}

        {/* MODAL */}
        <SubjectModal
          open={modalOpen}
          subject={editingSubject}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveSubject}
        />
      </div>
    </AppShell>
  );
}
