import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Target, CheckCircle2, Clock, CalendarDays } from "lucide-react";
import type { Subject } from "../../../context/subjectcontext";
import type { Task } from "../../../context/taskcontext";
import type { Goal } from "../../../context/goalcontext";

interface SubjectCardProps {
  subject: Subject;
  tasks: Task[];
  goals: Goal[];
}

export default function SubjectCard({ subject, tasks, goals }: SubjectCardProps) {
  // Filter tasks & goals belonging to this subject
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

  const totalTasks = subjectTasks.length;
  const completedTasks = subjectTasks.filter((t) => t.completed).length;
  const activeTasks = totalTasks - completedTasks;

  const todayStr = new Date().toISOString().split("T")[0];
  const upcomingCount = subjectTasks.filter(
    (t) => !t.completed && t.dueDate >= todayStr
  ).length;

  const progressPercent =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const accentColor = subject.color || "#06B6D4";

  const statusConfig = {
    active: { text: "text-[#06B6D4]", bg: "bg-[#06B6D4]/10", border: "border-[#06B6D4]/20", label: "Active" },
    completed: { text: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", label: "Completed" },
    archived: { text: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", label: "Archived" },
  };

  const statusKey = (subject.status ? String(subject.status).toLowerCase() : "active") as keyof typeof statusConfig;
  const currentStatus = statusConfig[statusKey] || statusConfig.active;

  return (
    <div
      className="
        group
        relative
        flex
        flex-col
        justify-between
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
      {/* ACCENT BAR */}
      <div
        className="absolute left-0 top-5 bottom-5 w-1 rounded-r-full"
        style={{ backgroundColor: accentColor }}
      />

      <div>
        {/* HEADER: NAME + CODE + STATUS */}
        <div className="flex items-start justify-between gap-3 pl-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className="
                  flex
                  h-7
                  w-7
                  items-center
                  justify-center
                  rounded-lg
                  text-xs
                  font-bold
                "
                style={{
                  backgroundColor: `${accentColor}1A`,
                  color: accentColor,
                }}
              >
                <BookOpen size={14} />
              </span>

              {subject.courseCode && (
                <span className="rounded-md bg-[#111827] px-2 py-0.5 text-[10px] font-semibold text-[#94A3B8]">
                  {subject.courseCode}
                </span>
              )}
            </div>

            <h3 className="mt-2.5 truncate text-base font-semibold text-[#E5E7EB] group-hover:text-white">
              {subject.name}
            </h3>
          </div>

          <span
            className={`
              shrink-0
              rounded-md
              border
              px-2
              py-0.5
              text-[10px]
              font-medium
              ${currentStatus.text}
              ${currentStatus.bg}
              ${currentStatus.border}
            `}
          >
            {currentStatus.label}
          </span>
        </div>

        {/* DESCRIPTION */}
        <p className="mt-2 line-clamp-2 pl-2 text-xs leading-relaxed text-[#64748B]">
          {subject.description || "No description provided."}
        </p>

        {/* COUNTERS METRICS */}
        <div className="mt-4 flex flex-wrap items-center gap-3 pl-2 text-xs text-[#94A3B8]">
          <span className="flex items-center gap-1 text-[#CBD5E1]">
            <Target size={13} className="text-[#06B6D4]" />
            {subjectGoals.length} Goals
          </span>
          <span className="flex items-center gap-1 text-[#CBD5E1]">
            <CheckCircle2 size={13} className="text-emerald-400" />
            {activeTasks} Active Tasks
          </span>
          {subject.targetDate && (
            <span className="flex items-center gap-1 text-[#06B6D4] font-semibold">
              <CalendarDays size={13} />
              Target: {subject.targetDate}
            </span>
          )}
          {upcomingCount > 0 && !subject.targetDate && (
            <span className="flex items-center gap-1 text-[#CBD5E1]">
              <Clock size={13} className="text-amber-400" />
              {upcomingCount} Upcoming
            </span>
          )}
        </div>
      </div>

      {/* FOOTER: PROGRESS + CTA */}
      <div className="mt-5 border-t border-[#1F2937] pt-4 pl-2">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-[#64748B] font-medium">Task Progress</span>
          <span className="font-bold text-[#E5E7EB]">
            {totalTasks > 0 ? `${progressPercent}%` : "No tasks yet"}
          </span>
        </div>

        {/* PROGRESS BAR */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-[#1F2937]">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${totalTasks > 0 ? progressPercent : 0}%`,
              backgroundColor: accentColor,
            }}
          />
        </div>

        <div className="mt-4 flex items-center justify-end">
          <Link
            to={`/subjects/${subject.id}`}
            className="
              inline-flex
              items-center
              gap-1.5
              rounded-lg
              bg-[#111827]
              px-3.5
              py-1.5
              text-xs
              font-semibold
              text-[#06B6D4]
              transition-colors
              hover:bg-[#06B6D4]
              hover:text-[#020617]
            "
          >
            Open Subject
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
