import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Target,
  BookOpen,
  Clock3,
  Timer,
  FolderKanban,
  BarChart3,
  LogOut,
} from "lucide-react";

interface NavItemProps {
  label: string;
  href: string;
  icon: React.ElementType;
  onNavigate?: () => void;
}

function NavItem({
  label,
  href,
  icon: Icon,
  onNavigate,
}: NavItemProps) {
  const location = useLocation();
  const isActive =
    location.pathname === href ||
    (href !== "/" && href !== "/dashboard" && location.pathname.startsWith(href + "/")) ||
    (href === "/dashboard" && location.pathname === "/dashboard");

  return (
    <Link
      to={href}
      onClick={onNavigate}
      className={`
        group flex items-center gap-3
        rounded-lg px-3 py-2.5
        text-sm transition-colors
        ${
          isActive
            ? "bg-[#06B6D4]/10 text-[#06B6D4] font-medium"
            : "text-[#94A3B8] hover:bg-[#111827] hover:text-[#E5E7EB]"
        }
      `}
    >
      <Icon
        size={17}
        strokeWidth={isActive ? 2.2 : 1.8}
        className={
          isActive
            ? "text-[#06B6D4]"
            : "text-[#64748B] group-hover:text-[#CBD5E1]"
        }
      />

      <span className="truncate">{label}</span>
    </Link>
  );
}

interface NavSectionProps {
  title: string;
  children: React.ReactNode;
}

function NavSection({ title, children }: NavSectionProps) {
  return (
    <div className="mb-6">
      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#475569]">
        {title}
      </p>

      <div className="space-y-1">{children}</div>
    </div>
  );
}

interface SidebarProps {
  onNavigate?: () => void;
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onNavigate?.();
    navigate("/login");
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#0B1120]">
      {/* =========================
          BRAND
      ========================== */}
      <div className="flex h-16 shrink-0 items-center border-b border-[#1F2937] px-5">
        <Link
          to="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-3"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#06B6D4] text-[#020617]">
            <BookOpen size={17} strokeWidth={2.5} />
          </div>

          <div>
            <p className="text-sm font-semibold tracking-tight text-[#E5E7EB]">
              StudyFlow
            </p>

            <p className="text-[10px] text-[#64748B]">Study smarter</p>
          </div>
        </Link>
      </div>

      {/* =========================
          NAVIGATION
      ========================== */}
      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {/* Main */}
        <NavSection title="Main">
          <NavItem
            label="Dashboard"
            href="/dashboard"
            icon={LayoutDashboard}
            onNavigate={onNavigate}
          />
        </NavSection>

        {/* Study */}
        <NavSection title="Study">
          <NavItem
            label="Study Planner"
            href="/planner"
            icon={Target}
            onNavigate={onNavigate}
          />

          <NavItem
            label="Subjects"
            href="/subjects"
            icon={BookOpen}
            onNavigate={onNavigate}
          />

          <NavItem
            label="Study Sessions"
            href="/sessions"
            icon={Clock3}
            onNavigate={onNavigate}
          />

          <NavItem
            label="Timer"
            href="/timer"
            icon={Timer}
            onNavigate={onNavigate}
          />
        </NavSection>

        {/* Resources */}
        <NavSection title="Resources">
          <NavItem
            label="Resources"
            href="/resources"
            icon={FolderKanban}
            onNavigate={onNavigate}
          />
        </NavSection>

        {/* Progress */}
        <NavSection title="Progress">
          <NavItem
            label="Analytics"
            href="/analytics"
            icon={BarChart3}
            onNavigate={onNavigate}
          />
        </NavSection>
      </nav>

      {/* =========================
          BOTTOM AREA (LOG OUT)
      ========================== */}
      <div className="shrink-0 border-t border-[#1F2937] p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="
            group flex w-full items-center gap-3
            rounded-lg px-3 py-2.5
            text-sm text-[#94A3B8] transition-colors
            hover:bg-red-500/10 hover:text-red-400
          "
        >
          <LogOut
            size={17}
            className="text-[#64748B] group-hover:text-red-400"
          />

          <span className="truncate font-medium">Log out</span>
        </button>
      </div>
    </div>
  );
}