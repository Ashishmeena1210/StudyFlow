/* eslint-disable react-hooks/set-state-in-effect */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FolderKanban,
  Plus,
  Sparkles,
  BookOpen,
  ArrowRight,
  BookmarkCheck,
  Search,
  X,
} from "lucide-react";

import AppShell from "../../components/appshell";
import ResourceModal from "./components/resourcemodal";

import { useResources, type CreateResourceData } from "../../context/resourcecontext";
import { useSubjects } from "../../context/subjectcontext";
import { suggestAIResourcesApi } from "../../api/aiApi";
import { type DiscoveredResourceItem } from "../../services/resourceDiscovery";

export default function ResourcesPage() {
  const navigate = useNavigate();

  const { resources, addResource, saveDiscoveredResource } = useResources();
  const { subjects } = useSubjects();

  // Modals state
  const [addResourceModalOpen, setAddResourceModalOpen] = useState(false);

  // Global AI Finder Modal state
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiSubjectId, setAiSubjectId] = useState<string>(subjects[0]?.id || "");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResults, setAiResults] = useState<DiscoveredResourceItem[]>([]);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddManualResource = async (data: CreateResourceData) => {
    try {
      await addResource(data);
      showToast(`Resource "${data.title}" added successfully.`);
      setAddResourceModalOpen(false);
    } catch (err: any) {
      showToast(err.message || "Failed to add resource.");
    }
  };

  const handleRunAiFinder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAiLoading(true);

    const subObj = subjects.find((s) => s.id === aiSubjectId) || subjects[0];

    try {
      const suggestions = await suggestAIResourcesApi({
        subjectId: subObj?.id || subjects[0]?.id || "",
        topic: aiPrompt.trim() || subObj?.name || "Study Guide",
      });

      const formatted: DiscoveredResourceItem[] = suggestions.map((r) => ({
        id: "disc-" + crypto.randomUUID(),
        title: r.title,
        type: (r.type ? r.type.charAt(0) + r.type.slice(1).toLowerCase() : "Article") as any,
        source: r.source || "AI Suggestion",
        url: r.url,
        description: r.description,
        subjectId: subObj?.id || "sub-networks",
        subjectName: subObj?.name || "General",
        tags: [subObj?.name || "General"],
        isSaved: r.alreadySaved || false,
        isFavorite: false,
        difficulty: "Intermediate",
        relevanceScore: "Highly relevant",
        relevanceReason: r.reason,
      }));

      setAiResults(formatted);
      setAiSummary(`AI suggested ${formatted.length} verified study resources for ${subObj?.name || "General"}.`);
    } catch (err: any) {
      showToast(err.message || "AI resource suggestions are temporarily unavailable.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSaveAiItem = async (item: DiscoveredResourceItem) => {
    const subObj = subjects.find((s) => s.id === aiSubjectId) || subjects[0];
    try {
      await saveDiscoveredResource(
        {
          title: item.title,
          type: item.type,
          source: item.source,
          url: item.url,
          description: item.description,
          subjectId: subObj?.id || item.subjectId,
          subjectName: subObj?.name || item.subjectName,
          tags: item.tags,
          isFavorite: false,
        },
        subObj?.id,
        undefined,
        undefined,
        item.tags
      );

      setAiResults((prev) => prev.filter((r) => r.title !== item.title));
      showToast(`Saved "${item.title}" to ${subObj?.name || "library"}.`);
    } catch (err: any) {
      showToast(err.message || "Failed to save resource.");
    }
  };

  return (
    <AppShell>
      <div className="min-h-full w-full relative pb-12 max-w-5xl mx-auto space-y-8">
        {/* TOAST */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-[110] flex items-center gap-2 rounded-xl border border-[#06B6D4]/30 bg-[#0B1120] px-4 py-3 text-xs font-medium text-[#E5E7EB] shadow-2xl backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-[#06B6D4]" />
            {toastMessage}
          </div>
        )}

        {/* HEADER & PRIMARY ACTIONS */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FolderKanban size={24} className="text-[#06B6D4]" />
              <h1 className="text-2xl font-bold tracking-tight text-[#E5E7EB]">
                Resources
              </h1>
            </div>
            <p className="mt-1 text-sm text-[#64748B]">
              Organize and discover learning resources by subject.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAiModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-[#06B6D4]/30 bg-[#06B6D4]/10 px-4 py-2.5 text-xs font-bold text-[#06B6D4] hover:bg-[#06B6D4] hover:text-[#020617] transition"
            >
              <Sparkles size={15} /> Ask AI
            </button>

            <button
              type="button"
              onClick={() => setAddResourceModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#06B6D4] px-4 py-2.5 text-xs font-bold text-[#020617] shadow-lg shadow-[#06B6D4]/10 hover:bg-[#22D3EE] transition"
            >
              <Plus size={16} strokeWidth={2.5} /> Add Resource
            </button>
          </div>
        </div>

        {/* YOUR SUBJECTS SECTION */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-[#E5E7EB]">Your Subjects</h2>

          {subjects.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {subjects.map((sub) => {
                const subResources = resources.filter((r) => r.subjectId === sub.id || r.subjectName.toLowerCase() === sub.name.toLowerCase());
                const totalCount = subResources.length;
                const savedCount = subResources.filter((r) => r.isSaved).length;
                const aiSuggestedCount = subResources.filter((r) => r.isAISuggested || r.relevanceReason).length;

                return (
                  <div
                    key={sub.id}
                    onClick={() => navigate(`/resources/subject/${sub.id}`)}
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
                      p-6
                      shadow-xl
                      transition-all
                      duration-200
                      hover:border-[#06B6D4]/50
                      hover:bg-[#0F172A]
                    "
                  >
                    <div>
                      {/* ICON & NAME */}
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-bold"
                          style={{
                            backgroundColor: `${sub.color || "#06B6D4"}15`,
                            color: sub.color || "#06B6D4",
                          }}
                        >
                          <BookOpen size={20} />
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-[#E5E7EB] group-hover:text-[#06B6D4] transition-colors">
                            {sub.name}
                          </h3>
                          {sub.courseCode && (
                            <span className="text-[10px] font-mono text-[#64748B]">
                              {sub.courseCode}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* DESCRIPTION */}
                      {sub.description && (
                        <p className="mt-3 text-xs leading-relaxed text-[#64748B] line-clamp-2">
                          {sub.description}
                        </p>
                      )}

                      {/* RESOURCE COUNTS */}
                      <div className="mt-5 space-y-1 text-xs">
                        <p className="font-bold text-[#CBD5E1]">
                          {totalCount} {totalCount === 1 ? "Resource" : "Resources"}
                        </p>
                        <p className="text-[11px] text-[#64748B]">
                          {savedCount} Saved · {aiSuggestedCount} AI Suggested
                        </p>
                      </div>
                    </div>

                    {/* CTA LINK */}
                    <div className="mt-6 flex items-center justify-end border-t border-[#1F2937] pt-3">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#06B6D4] group-hover:translate-x-0.5 transition-transform">
                        View Resources
                        <ArrowRight size={13} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* EMPTY SUBJECTS FALLBACK */
            <div className="rounded-2xl border border-dashed border-[#1F2937] bg-[#0B1120] py-16 text-center">
              <BookOpen size={40} className="mx-auto mb-3 text-[#334155]" />
              <h3 className="text-sm font-semibold text-[#94A3B8]">No subjects created yet</h3>
              <p className="mt-1 text-xs text-[#64748B]">
                Add courses and subjects to organize your study resource library.
              </p>
              <Link
                to="/subjects"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#06B6D4] px-4 py-2 text-xs font-semibold text-[#020617]"
              >
                Go to Subjects
              </Link>
            </div>
          )}
        </div>

        {/* MODAL: MANUAL ADD RESOURCE */}
        <ResourceModal
          open={addResourceModalOpen}
          resource={null}
          onClose={() => setAddResourceModalOpen(false)}
          onSave={handleAddManualResource}
        />

        {/* MODAL: GLOBAL AI RESOURCE FINDER */}
        {aiModalOpen && (
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm"
            onClick={() => setAiModalOpen(false)}
          >
            <div
              className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[#06B6D4]/30 bg-[#0B1120] p-6 shadow-2xl space-y-4 scrollbar-none"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={20} className="text-[#06B6D4]" />
                  <h3 className="text-base font-bold text-[#E5E7EB]">Find Resources with AI</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setAiModalOpen(false)}
                  className="text-[#64748B] hover:text-[#E5E7EB]"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleRunAiFinder} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#CBD5E1]">
                    Select Subject Context
                  </label>
                  <select
                    value={aiSubjectId}
                    onChange={(e) => setAiSubjectId(e.target.value)}
                    className="w-full rounded-xl border border-[#1F2937] bg-[#020617] p-2.5 text-xs text-[#E5E7EB] outline-none"
                  >
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-[#CBD5E1]">
                    What are you looking for?
                  </label>
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. Beginner resources for subnetting, Best TCP videos..."
                    className="w-full rounded-xl border border-[#1F2937] bg-[#020617] p-3 text-xs text-[#E5E7EB] outline-none focus:border-[#06B6D4]"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAiLoading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#06B6D4] py-2.5 text-xs font-bold text-[#020617] hover:bg-[#22D3EE] disabled:opacity-50 transition"
                >
                  <Search size={14} />
                  {isAiLoading ? "Searching..." : "Find Resources"}
                </button>
              </form>

              {aiSummary && (
                <p className="text-xs font-semibold text-[#06B6D4] pt-2">{aiSummary}</p>
              )}

              {/* AI RESULTS */}
              {aiResults.length > 0 && (
                <div className="space-y-3 pt-2">
                  {aiResults.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-[#1F2937] bg-[#020617] p-4 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#06B6D4]">{item.source} · {item.type}</span>
                        <span className="rounded bg-amber-400/10 px-2 py-0.5 font-semibold text-amber-400 text-[10px]">
                          {item.difficulty}
                        </span>
                      </div>
                      <h4 className="font-semibold text-[#E5E7EB]">{item.title}</h4>
                      <p className="text-[#64748B] text-[11px]">{item.description}</p>
                      <p className="text-[#CBD5E1] text-[11px] italic">"{item.relevanceReason}"</p>

                      <div className="flex items-center justify-between border-t border-[#1F2937] pt-2">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-[#06B6D4] hover:underline"
                        >
                          Open
                        </a>
                        <button
                          type="button"
                          onClick={() => handleSaveAiItem(item)}
                          className="inline-flex items-center gap-1 rounded-lg bg-[#06B6D4] px-3 py-1 text-xs font-semibold text-[#020617]"
                        >
                          <BookmarkCheck size={13} /> Save to Subject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
