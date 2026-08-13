import {
  Search,
  Bell,
  ChevronDown,
  Menu,
} from "lucide-react";
import { useLocation } from "react-router-dom";

const pageInfo: Record<
  string,
  {
    title: string;
    description: string;
  }
> = {
  "/dashboard": {
    title: "Dashboard",
    description: "Your study overview",
  },
  "/planner": {
    title: "Study Planner",
    description: "Plan your goals, organize your tasks, and track your study progress.",
  },
  "/subjects": {
    title: "Subjects",
    description: "Organize your courses, track your progress, and keep everything in one place.",
  },
  "/sessions": {
    title: "Study Sessions",
    description: "Track your study time, stay consistent, and see how you're spending your time.",
  },
  "/timer": {
    title: "Study Timer",
    description: "Focus on your current task",
  },
  "/notes": {
    title: "Notes",
    description: "Capture what you learn and keep your study material organized.",
  },
  "/resources": {
    title: "Resources",
    description: "Discover, organize, and study real learning materials for your courses.",
  },
  "/analytics": {
    title: "Analytics",
    description: "Understand your study habits, track your progress, and improve your consistency.",
  },
  "/settings": {
    title: "Settings",
    description: "Manage your preferences",
  },
};

interface NavbarProps {
  onToggleMobileMenu?: () => void;
}

export default function Navbar({ onToggleMobileMenu }: NavbarProps) {
  const location = useLocation();

  const currentPage =
    pageInfo[location.pathname] ?? pageInfo["/dashboard"];

  return (
    <header className="h-full w-full bg-[#020617]">
      <div className="flex h-full w-full items-center justify-between px-4 sm:px-6">

        {/* Left side */}
        <div className="flex min-w-0 items-center gap-3">

          {/* Mobile menu */}
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="
              flex h-9 w-9 shrink-0
              items-center justify-center
              rounded-lg
              text-[#64748B]
              hover:bg-[#111827]
              hover:text-[#E5E7EB]
              lg:hidden
            "
            aria-label="Open navigation"
          >
            <Menu size={19} />
          </button>

          {/* Page title */}
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-[#E5E7EB]">
              {currentPage.title}
            </h1>

            <p className="hidden truncate text-[11px] text-[#64748B] sm:block">
              {currentPage.description}
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex shrink-0 items-center gap-2">

          {/* Search */}
          <button
            type="button"
            className="
              hidden h-9
              items-center gap-2
              rounded-lg
              border border-[#1F2937]
              bg-[#0B1120]
              px-3
              text-xs text-[#64748B]
              transition-colors
              hover:border-[#334155]
              hover:text-[#CBD5E1]
              md:flex
            "
          >
            <Search size={15} />

            <span>Search</span>

            <kbd
              className="
                ml-4
                rounded
                border border-[#334155]
                bg-[#111827]
                px-1.5
                py-0.5
                text-[9px]
                text-[#64748B]
              "
            >
              /
            </kbd>
          </button>

          {/* Mobile search */}
          <button
            type="button"
            className="
              flex h-9 w-9
              items-center justify-center
              rounded-lg
              text-[#64748B]
              hover:bg-[#111827]
              hover:text-[#E5E7EB]
              md:hidden
            "
            aria-label="Search"
          >
            <Search size={17} />
          </button>

          {/* Notifications */}
          <button
            type="button"
            className="
              relative
              flex h-9 w-9
              items-center justify-center
              rounded-lg
              text-[#64748B]
              transition-colors
              hover:bg-[#111827]
              hover:text-[#E5E7EB]
            "
            aria-label="Notifications"
          >
            <Bell size={17} />

            <span
              className="
                absolute
                right-2
                top-2
                h-1.5 w-1.5
                rounded-full
                bg-[#06B6D4]
              "
            />
          </button>

          {/* Divider */}
          <div className="hidden h-6 w-px bg-[#1F2937] sm:block" />

          {/* Profile */}
          <button
            type="button"
            className="
              flex items-center gap-2
              rounded-lg
              p-1.5
              transition-colors
              hover:bg-[#111827]
            "
          >
            {/* Avatar */}
            <div
              className="
                flex h-8 w-8 shrink-0
                items-center justify-center
                rounded-full
                bg-[#164E63]
                text-xs font-semibold
                text-[#67E8F9]
              "
            >
              A
            </div>

            {/* User information */}
            <div className="hidden text-left sm:block">
              <p className="text-xs font-medium text-[#E5E7EB]">
                Ashish
              </p>

              <p className="text-[10px] text-[#64748B]">
                Student
              </p>
            </div>

            <ChevronDown
              size={14}
              className="hidden text-[#64748B] sm:block"
            />
          </button>
        </div>
      </div>
    </header>
  );
}