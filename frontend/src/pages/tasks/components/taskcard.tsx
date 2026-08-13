import { useMemo } from "react";
import {
  CheckCircle2,
  Circle,
  Play,
  Pencil,
  Trash2,
  CalendarDays,
  AlertTriangle,
} from "lucide-react";

export type Priority = "high" | "medium" | "low";

interface TaskCardProps {
  title: string;
  description: string;
  subject: string;
  priority: Priority;
  dueDate: string;
  overdueDays?: number;
  completed: boolean;

  onToggleComplete: () => void;
  onStartSession?: () => void;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const subjectColors: Record<string, string> = {
  Networks: "#06B6D4",
  Mathematics: "#8B5CF6",
  DSA: "#F59E0B",
  DBMS: "#10B981",
  "Operating Systems": "#EC4899",
};

export default function TaskCard({
  title,
  description,
  subject,
  priority,
  dueDate,
  overdueDays,
  completed,
  onToggleComplete,
  onStartSession,
  onSelect,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const formattedDueDate = useMemo(() => {
    if (!dueDate) return "No due date";
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const todayStr = `${year}-${month}-${day}`;

    const tomorrow = new Date(d);
    tomorrow.setDate(d.getDate() + 1);
    const tomYear = tomorrow.getFullYear();
    const tomMonth = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const tomDay = String(tomorrow.getDate()).padStart(2, "0");
    const tomorrowStr = `${tomYear}-${tomMonth}-${tomDay}`;

    if (dueDate === todayStr) return "Today";
    if (dueDate === tomorrowStr) return "Tomorrow";
    return dueDate;
  }, [dueDate]);

  const calculatedOverdueDays = useMemo(() => {
    if (overdueDays !== undefined) return overdueDays;
    if (completed || !dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate + "T00:00:00");
    if (due < today) {
      const diffTime = Math.abs(today.getTime() - due.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    return 0;
  }, [dueDate, overdueDays, completed]);

  const priorityStyles = {
    high: {
      text: "text-red-400",
      bg: "bg-red-400/10",
      border: "border-red-400/20",
      label: "High",
    },
    medium: {
      text: "text-yellow-400",
      bg: "bg-yellow-400/10",
      border: "border-yellow-400/20",
      label: "Medium",
    },
    low: {
      text: "text-emerald-400",
      bg: "bg-emerald-400/10",
      border: "border-emerald-400/20",
      label: "Low",
    },
  };

  const priorityConfig = priorityStyles[priority] || priorityStyles.medium;
  const accentColor =
    calculatedOverdueDays > 0 && !completed
      ? "#F43F5E"
      : completed
      ? "#10B981"
      : subjectColors[subject] || "#06B6D4";

  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          onSelect?.();
        }
      }}
      className={`
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
        ${completed ? "opacity-75" : ""}
      `}
    >
      {/* ACCENT COLOR BAR */}
      <div
        className="absolute left-0 top-5 bottom-5 w-1 rounded-r-full"
        style={{ backgroundColor: accentColor }}
      />

      <div>
        {/* TOP HEADER: SUBJECT + PRIORITY */}
        <div className="flex items-start justify-between gap-3 pl-2">
          <div className="min-w-0 flex-1">
            <span
              className="
                inline-block
                rounded-md
                px-2.5
                py-1
                text-[10px]
                font-semibold
                tracking-wide
              "
              style={{
                backgroundColor: `${accentColor}1A`,
                color: accentColor,
              }}
            >
              {subject}
            </span>

            <h3
              className={`
                mt-2.5
                truncate
                text-base
                font-semibold
                transition-colors
                ${
                  completed
                    ? "text-[#64748B] line-through"
                    : "text-[#E5E7EB] group-hover:text-white"
                }
              `}
            >
              {title}
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
              ${priorityConfig.text}
              ${priorityConfig.bg}
              ${priorityConfig.border}
            `}
          >
            {priorityConfig.label}
          </span>
        </div>

        {/* DESCRIPTION */}
        <p className="mt-2 line-clamp-2 pl-2 text-xs leading-relaxed text-[#64748B]">
          {description || "No additional details provided."}
        </p>

        {/* METADATA: DUE DATE & OVERDUE */}
        <div className="mt-4 flex flex-wrap items-center gap-2 pl-2 text-xs text-[#94A3B8]">
          <span className="flex items-center gap-1.5 text-[#94A3B8]">
            <CalendarDays size={13} className="text-[#64748B]" />
            Due: {formattedDueDate}
          </span>

          {calculatedOverdueDays > 0 && !completed && (
            <span className="flex items-center gap-1 rounded-md border border-red-400/20 bg-red-400/10 px-2 py-0.5 text-[10px] font-medium text-red-400">
              <AlertTriangle size={11} />
              {calculatedOverdueDays} {calculatedOverdueDays === 1 ? "day" : "days"} overdue
            </span>
          )}

          {completed && (
            <span className="rounded-md border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
              Completed
            </span>
          )}
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div
        className="mt-5 border-t border-[#1F2937] pt-4 pl-2 flex items-center justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* COMPLETION TOGGLE BUTTON */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete();
          }}
          className={`
            inline-flex
            items-center
            gap-1.5
            rounded-lg
            px-3
            py-1.5
            text-xs
            font-medium
            transition-colors
            ${
              completed
                ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 hover:bg-emerald-400/20"
                : "bg-[#111827] text-[#CBD5E1] border border-[#1F2937] hover:bg-[#06B6D4]/10 hover:text-[#06B6D4] hover:border-[#06B6D4]/30"
            }
          `}
        >
          {completed ? (
            <>
              <CheckCircle2 size={14} className="text-emerald-400" />
              Completed
            </>
          ) : (
            <>
              <Circle size={14} className="text-[#64748B]" />
              Mark Complete
            </>
          )}
        </button>

        {/* QUICK ACTIONS: START, EDIT, DELETE */}
        <div className="flex items-center gap-1">
          {!completed && onStartSession && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStartSession();
              }}
              className="
                flex
                items-center
                gap-1
                rounded-lg
                bg-[#06B6D4]/10
                px-2.5
                py-1.5
                text-xs
                font-medium
                text-[#06B6D4]
                hover:bg-[#06B6D4]/20
                transition
              "
              title="Start study session"
            >
              <Play size={12} />
              Start
            </button>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="
                rounded-lg
                p-1.5
                text-[#64748B]
                hover:bg-[#111827]
                hover:text-[#E5E7EB]
                transition
              "
              title="Edit task"
            >
              <Pencil size={14} />
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="
                rounded-lg
                p-1.5
                text-[#64748B]
                hover:bg-red-400/10
                hover:text-red-400
                transition
              "
              title="Delete task"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}