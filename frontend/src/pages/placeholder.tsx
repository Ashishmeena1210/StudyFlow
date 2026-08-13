import { useLocation, Link } from "react-router-dom";
import { Construction, ArrowLeft } from "lucide-react";
import AppShell from "../components/appshell";

export default function PlaceholderPage() {
  const location = useLocation();
  const pageName = location.pathname.substring(1);
  const formattedTitle = pageName
    ? pageName.charAt(0).toUpperCase() + pageName.slice(1)
    : "Page";

  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-400 shadow-lg shadow-cyan-400/5">
          <Construction size={28} />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-[#E5E7EB]">
          {formattedTitle} Module
        </h1>

        <p className="mt-2 max-w-md text-xs text-[#64748B] leading-relaxed">
          The {formattedTitle} section is active and ready for upcoming study modules. Use the Study Planner or Tasks section to manage your schedule.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/planner"
            className="inline-flex items-center gap-2 rounded-lg bg-[#06B6D4] px-4 py-2.5 text-xs font-semibold text-[#020617] hover:bg-[#22D3EE] transition"
          >
            Go to Study Planner
          </Link>

          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-[#1F2937] bg-[#0B1120] px-4 py-2.5 text-xs font-medium text-[#CBD5E1] hover:bg-[#111827] transition"
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
