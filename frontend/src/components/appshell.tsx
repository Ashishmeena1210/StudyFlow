import { useState, type ReactNode } from "react";
import Sidebar from "./sidebar";
import Navbar from "./navbar";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#020617] text-[#E5E7EB]">
      <div className="flex h-full w-full overflow-hidden">
        {/* Desktop Sidebar */}
        <aside
          className="
            hidden
            h-full
            w-64
            shrink-0
            overflow-hidden
            border-r
            border-[#1F2937]
            bg-[#0B1120]
            lg:block
          "
        >
          <Sidebar />
        </aside>

        {/* Mobile Sidebar Overlay Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative flex w-full max-w-xs flex-1 flex-col bg-[#0B1120] shadow-2xl">
              <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Application */}
        <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          {/* Navbar */}
          <header className="h-16 shrink-0 overflow-hidden">
            <Navbar onToggleMobileMenu={() => setMobileMenuOpen(true)} />
          </header>

          {/* ONLY SCROLLABLE AREA */}
          <main
            className="
              min-h-0
              min-w-0
              flex-1
              overflow-y-auto
              overflow-x-hidden
              overscroll-none
              p-4
              sm:p-6
              scrollbar-none
            "
          >
            <div className="mx-auto w-full max-w-[1600px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}