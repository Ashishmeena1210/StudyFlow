/* eslint-disable react-hooks/set-state-in-effect */
import { useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Sparkles,
  BookOpen,
  Search,
  ExternalLink,
  Star,
  Pencil,
  Trash2,
  Globe,
  FileText,
  Video,
  File,
  GraduationCap,
  BookmarkCheck,
  Bookmark,
  Layers,
  Code,
  Book,
  X,
  FolderKanban,
} from "lucide-react";

import AppShell from "../../components/appshell";
import ResourceModal from "./components/resourcemodal";

import {
  useResources,
  type Resource,
  type ResourceType,
  type CreateResourceData,
  type DifficultyLevel,
} from "../../context/resourcecontext";
import { useSubjects } from "../../context/subjectcontext";
import { useGoals } from "../../context/goalcontext";
import { useTasks } from "../../context/taskcontext";

import {
  generateAIRecommendations,
  type DiscoveredResourceItem,
} from "../../services/resourceDiscovery";

type StatusFilter = "all" | "saved" | "ai" | "favorite";
type SortOption = "recent_added" | "recent_saved" | "alphabetical";

export default function SubjectResourcePage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();

  const {
    resources,
    addResource,
    saveDiscoveredResource,
    unsaveResource,
    updateResource,
    deleteResource,
    toggleFavoriteResource,
    markResourceOpened,
  } = useResources();

  const { subjects } = useSubjects();
  const { goals } = useGoals();
  const { tasks } = useTasks();

  const currentSubjectObj = useMemo(
    () => subjects.find((s) => s.id === subjectId),
    [subjects, subjectId]
  );

  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("all");
  const [selectedSort, setSelectedSort] = useState<SortOption>("recent_added");

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // AI Finder state (Locked to this subject)
  const [aiModalOpen, setAiModalOpen] = useState(false);
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

  /*
   * SUBJECT-SPECIFIC RESOURCES
   */
  const subjectResources = useMemo(() => {
    if (!subjectId) return [];
    return resources.filter(
      (r) =>
        r.subjectId === subjectId ||
        r.subjectName.toLowerCase() === (currentSubjectObj?.name || "").toLowerCase()
    );
  }, [resources, subjectId, currentSubjectObj]);

  /*
   * FILTERED & SORTED RESOURCES
   */
  const filteredResources = useMemo(() => {
    return subjectResources
      .filter((r) => {
        // Type filter
        if (selectedType !== "all" && r.type !== selectedType) return false;

        // Status filter
        if (selectedStatus === "saved" && !r.isSaved) return false;
        if (selectedStatus === "favorite" && !r.isFavorite) return false;
        if (selectedStatus === "ai" && (!r.isAISuggested && !r.relevanceReason)) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          const mTitle = r.title.toLowerCase().includes(q);
          const mDesc = (r.description || "").toLowerCase().includes(q);
          const mSource = r.source.toLowerCase().includes(q);
          const mTags = (r.tags || []).some((t) => t.toLowerCase().includes(q));
          if (!mTitle && !mDesc && !mSource && !mTags) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (selectedSort === "alphabetical") {
          return a.title.localeCompare(b.title);
        }
        if (selectedSort === "recent_saved") {
          const aTime = a.updatedAt || a.createdAt;
          const bTime = b.updatedAt || b.createdAt;
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [subjectResources, selectedType, selectedStatus, searchQuery, selectedSort]);

  // Categorized Sections
  const savedSection = useMemo(() => filteredResources.filter((r) => r.isSaved), [filteredResources]);
  const aiSection = useMemo(() => filteredResources.filter((r) => !r.isSaved && (r.isAISuggested || r.relevanceReason)), [filteredResources]);
  const otherSection = useMemo(() => filteredResources.filter((r) => !r.isSaved && !r.isAISuggested && !r.relevanceReason), [filteredResources]);

  /*
   * RUN AI FINDER SCOPED TO THIS SUBJECT
   */
  const handleRunAiFinder = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsAiLoading(true);

    const activeGoal = goals.find((g) => g.subjectId === subjectId);
    const activeTask = tasks.find((t) => t.subjectId === subjectId && !t.completed);

    setTimeout(() => {
      const res = generateAIRecommendations({
        query: aiPrompt || searchQuery,
        subjectName: currentSubjectObj?.name,
        goalTitle: activeGoal?.title,
        taskTitle: activeTask?.title,
      });

      setAiResults(res.recommendations);
      setAiSummary(res.explanationSummary);
      setIsAiLoading(false);
    }, 400);
  };

  /*
   * SAVE AI RECOMMENDATION
   */
  const handleSaveAiItem = (item: DiscoveredResourceItem) => {
    if (!currentSubjectObj) return;
    saveDiscoveredResource(
      {
        title: item.title,
        type: item.type,
        source: item.source,
        url: item.url,
        description: item.description,
        subjectId: currentSubjectObj.id,
        subjectName: currentSubjectObj.name,
        tags: item.tags,
        isFavorite: false,
        difficulty: item.difficulty,
        relevanceScore: item.relevanceScore,
        relevanceReason: item.relevanceReason,
        isAISuggested: true,
      },
      currentSubjectObj.id
    );
    showToast(`Saved "${item.title}" to ${currentSubjectObj.name}!`);
  };

  const handleSaveManualResource = (data: CreateResourceData) => {
    if (editingResource) {
      updateResource(editingResource.id, data);
      showToast(`Resource "${data.title}" updated.`);
    } else {
      addResource({
        ...data,
        subjectId: currentSubjectObj?.id || data.subjectId,
        subjectName: currentSubjectObj?.name || data.subjectName,
      });
      showToast(`Resource "${data.title}" added to ${currentSubjectObj?.name}.`);
    }

    setModalOpen(false);
    setEditingResource(null);
  };

  const handleDeleteResource = (id: string) => {
    deleteResource(id);
    showToast("Resource removed.");
    setDeleteConfirmId(null);
  };

  const getTypeIcon = (type: ResourceType) => {
    switch (type) {
      case "Video":
        return Video;
      case "Article":
        return FileText;
      case "PDF":
        return File;
      case "Book":
        return Book;
      case "Course":
        return GraduationCap;
      case "Documentation":
        return Code;
      case "Practice":
        return Layers;
      default:
        return Globe;
    }
  };

  const getDifficultyBadgeClass = (level?: DifficultyLevel) => {
    switch (level) {
      case "Beginner":
        return "bg-emerald-400/10 text-emerald-400 border-emerald-400/30";
      case "Advanced":
        return "bg-[#06B6D4]/10 text-[#06B6D4] border-[#06B6D4]/30";
      default:
        return "bg-amber-400/10 text-amber-400 border-amber-400/30";
    }
  };

  if (!currentSubjectObj) {
    return (
      <AppShell>
        <div className="py-20 text-center space-y-4">
          <BookOpen size={48} className="mx-auto text-[#334155]" />
          <h2 className="text-lg font-bold text-[#E5E7EB]">Subject Not Found</h2>
          <Link
            to="/resources"
            className="inline-flex items-center gap-2 rounded-xl bg-[#06B6D4] px-4 py-2 text-xs font-semibold text-[#020617]"
          >
            ← Back to Resources
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="min-h-full w-full relative pb-12 max-w-5xl mx-auto space-y-6">
        {/* TOAST */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-[110] flex items-center gap-2 rounded-xl border border-[#06B6D4]/30 bg-[#0B1120] px-4 py-3 text-xs font-medium text-[#E5E7EB] shadow-2xl backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-[#06B6D4]" />
            {toastMessage}
          </div>
        )}

        {/* BACK LINK & HEADER */}
        <div>
          <button
            type="button"
            onClick={() => navigate("/resources")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#06B6D4] transition"
          >
            <ArrowLeft size={14} /> Back to Resources
          </button>

          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl font-bold"
                style={{
                  backgroundColor: `${currentSubjectObj.color || "#06B6D4"}20`,
                  color: currentSubjectObj.color || "#06B6D4",
                }}
              >
                <BookOpen size={24} />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#E5E7EB]">
                  {currentSubjectObj.name}
                </h1>
                <p className="mt-0.5 text-xs text-[#64748B]">
                  Your learning resources for {currentSubjectObj.name}.
                </p>
              </div>
            </div>

            {/* ACTIONS */}
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
                onClick={() => {
                  setEditingResource(null);
                  setModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-[#06B6D4] px-4 py-2.5 text-xs font-bold text-[#020617] shadow-lg shadow-[#06B6D4]/10 hover:bg-[#22D3EE] transition"
              >
                <Plus size={16} strokeWidth={2.5} /> Add Resource
              </button>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR SCOPED TO SUBJECT */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-y border-[#1F2937] py-4">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search resources in ${currentSubjectObj.name}...`}
              className="w-full rounded-xl border border-[#1F2937] bg-[#0B1120] py-2.5 pl-9 pr-3 text-xs text-[#E5E7EB] outline-none focus:border-[#06B6D4]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* TYPE FILTER */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="rounded-xl border border-[#1F2937] bg-[#0B1120] py-2 px-3 text-xs text-[#CBD5E1] outline-none"
            >
              <option value="all">All Types</option>
              <option value="Video">Video</option>
              <option value="Article">Article</option>
              <option value="Website">Website</option>
              <option value="Documentation">Documentation</option>
              <option value="Course">Course</option>
              <option value="PDF">PDF</option>
              <option value="Book">Book</option>
              <option value="Practice">Practice</option>
            </select>

            {/* STATUS FILTER */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as StatusFilter)}
              className="rounded-xl border border-[#1F2937] bg-[#0B1120] py-2 px-3 text-xs text-[#CBD5E1] outline-none"
            >
              <option value="all">All Status</option>
              <option value="saved">Saved</option>
              <option value="ai">AI Suggested</option>
              <option value="favorite">Favorites</option>
            </select>

            {/* SORTING */}
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value as SortOption)}
              className="rounded-xl border border-[#1F2937] bg-[#0B1120] py-2 px-3 text-xs text-[#CBD5E1] outline-none"
            >
              <option value="recent_added">Recently Added</option>
              <option value="recent_saved">Recently Saved</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>
        </div>

        {/* ================= RESOURCE SECTIONS ================= */}
        {subjectResources.length > 0 ? (
          <div className="space-y-8">
            {/* 1. SAVED RESOURCES */}
            {savedSection.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#06B6D4] flex items-center gap-1.5">
                  <BookmarkCheck size={14} /> Saved Resources ({savedSection.length})
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {savedSection.map((res) => {
                    const TypeIcon = getTypeIcon(res.type);

                    return (
                      <div
                        key={res.id}
                        className="flex flex-col justify-between rounded-2xl border border-[#06B6D4]/30 bg-[#0B1120] p-5 shadow-lg space-y-4 hover:border-[#06B6D4] transition"
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1.5 font-bold text-[#06B6D4]">
                              <TypeIcon size={14} />
                              {res.type} · {res.source}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleFavoriteResource(res.id)}
                              className={`p-1 transition ${
                                res.isFavorite ? "text-amber-400" : "text-[#475569] hover:text-[#CBD5E1]"
                              }`}
                            >
                              <Star size={15} fill={res.isFavorite ? "currentColor" : "none"} />
                            </button>
                          </div>

                          <h4 className="mt-2 text-sm font-semibold text-[#E5E7EB]">{res.title}</h4>
                          <p className="mt-1 text-xs text-[#64748B] line-clamp-2">{res.description || "No description."}</p>
                        </div>

                        <div className="flex items-center justify-between border-t border-[#1F2937] pt-3 text-xs">
                          {res.url ? (
                            <a
                              href={res.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => markResourceOpened(res.id)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-[#06B6D4] hover:underline"
                            >
                              Open Resource <ExternalLink size={12} />
                            </a>
                          ) : (
                            <span className="text-[10px] text-[#64748B] italic">No URL</span>
                          )}

                          <button
                            type="button"
                            onClick={() => unsaveResource(res.id)}
                            className="rounded-lg border border-[#1F2937] px-2.5 py-1 text-[11px] text-[#94A3B8] hover:text-red-400"
                          >
                            Unsave
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. AI SUGGESTIONS */}
            {aiSection.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#06B6D4] flex items-center gap-1.5">
                  <Sparkles size={14} /> ✨ AI Suggestions ({aiSection.length})
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {aiSection.map((res) => {
                    const TypeIcon = getTypeIcon(res.type);

                    return (
                      <div
                        key={res.id}
                        className="flex flex-col justify-between rounded-2xl border border-[#1F2937] bg-[#0F172A] p-5 shadow-lg space-y-4 hover:border-[#06B6D4]/40 transition"
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1.5 font-semibold text-[#06B6D4]">
                              <TypeIcon size={14} />
                              {res.type} · {res.source}
                            </span>
                            {res.difficulty && (
                              <span className={`rounded border px-2 py-0.5 text-[10px] font-semibold ${getDifficultyBadgeClass(res.difficulty)}`}>
                                {res.difficulty}
                              </span>
                            )}
                          </div>

                          <h4 className="mt-2 text-sm font-semibold text-[#E5E7EB]">{res.title}</h4>
                          {res.relevanceReason && (
                            <p className="mt-2 rounded-xl border border-[#06B6D4]/20 bg-[#06B6D4]/5 p-2 text-[11px] text-[#CBD5E1] italic">
                              "{res.relevanceReason}"
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between border-t border-[#1F2937] pt-3 text-xs">
                          {res.url ? (
                            <a
                              href={res.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => markResourceOpened(res.id)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-[#06B6D4] hover:underline"
                            >
                              Open <ExternalLink size={12} />
                            </a>
                          ) : (
                            <span className="text-[10px] text-[#64748B] italic">No URL</span>
                          )}

                          <button
                            type="button"
                            onClick={() => saveDiscoveredResource(res, currentSubjectObj.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#06B6D4] px-3 py-1.5 text-xs font-semibold text-[#020617] hover:bg-[#22D3EE]"
                          >
                            <Bookmark size={13} /> Save Resource
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. OTHER RESOURCES */}
            {otherSection.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                  Other Resources ({otherSection.length})
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {otherSection.map((res) => {
                    const TypeIcon = getTypeIcon(res.type);

                    return (
                      <div
                        key={res.id}
                        className="flex flex-col justify-between rounded-2xl border border-[#1F2937] bg-[#0B1120] p-5 shadow-lg space-y-4 hover:border-[#374151] transition"
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1.5 font-semibold text-[#06B6D4]">
                              <TypeIcon size={14} />
                              {res.type}
                            </span>
                          </div>

                          <h4 className="mt-2 text-sm font-semibold text-[#E5E7EB]">{res.title}</h4>
                          <p className="mt-1 text-xs text-[#64748B] line-clamp-2">{res.description || "No description."}</p>
                        </div>

                        <div className="flex items-center justify-between border-t border-[#1F2937] pt-3 text-xs">
                          {res.url ? (
                            <a
                              href={res.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => markResourceOpened(res.id)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-[#06B6D4] hover:underline"
                            >
                              Open <ExternalLink size={12} />
                            </a>
                          ) : (
                            <span className="text-[10px] text-[#64748B] italic">No URL</span>
                          )}

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingResource(res);
                                setModalOpen(true);
                              }}
                              className="p-1 text-[#64748B] hover:text-[#E5E7EB]"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(res.id)}
                              className="p-1 text-[#64748B] hover:text-red-400"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* EMPTY SUBJECT STATE */
          <div className="rounded-2xl border border-dashed border-[#1F2937] bg-[#0B1120] py-16 text-center space-y-3">
            <FolderKanban size={40} className="mx-auto text-[#334155]" />
            <h3 className="text-base font-bold text-[#E5E7EB]">No resources yet for {currentSubjectObj.name}</h3>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto">
              Start building your personal resource library for {currentSubjectObj.name} or ask AI to find relevant learning materials.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAiModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#06B6D4]/30 bg-[#06B6D4]/10 px-4 py-2 text-xs font-bold text-[#06B6D4] hover:bg-[#06B6D4] hover:text-[#020617]"
              >
                <Sparkles size={14} /> Find with AI
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingResource(null);
                  setModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#06B6D4] px-4 py-2 text-xs font-bold text-[#020617]"
              >
                <Plus size={14} /> Add Resource
              </button>
            </div>
          </div>
        )}

        {/* MODAL: MANUAL ADD / EDIT RESOURCE */}
        <ResourceModal
          open={modalOpen}
          resource={editingResource}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveManualResource}
        />

        {/* MODAL: SUBJECT-LOCKED AI RESOURCE FINDER */}
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
                  <div>
                    <h3 className="text-base font-bold text-[#E5E7EB]">Find resources with AI</h3>
                    <p className="text-[11px] text-[#64748B]">
                      Tell us what you want to learn for <span className="text-[#06B6D4] font-semibold">{currentSubjectObj.name}</span>.
                    </p>
                  </div>
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
                          <BookmarkCheck size={13} /> Save to {currentSubjectObj.name}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* DELETE CONFIRMATION MODAL */}
        {deleteConfirmId && (
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
            onClick={() => setDeleteConfirmId(null)}
          >
            <div
              className="w-full max-w-sm rounded-2xl border border-[#1F2937] bg-[#0B1120] p-5 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-bold text-[#E5E7EB]">Remove Resource?</h3>
              <p className="text-xs text-[#94A3B8]">
                Are you sure you want to remove this resource link?
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="rounded-lg border border-[#1F2937] px-4 py-2 text-xs text-[#94A3B8]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteResource(deleteConfirmId)}
                  className="rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
