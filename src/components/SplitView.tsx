//@ts-nocheck
import { useState, FormEvent } from "react";
import { Story, Comment, StoryStatus } from "../types";
import { StoryDetailPanel } from "./StoryDetailPanel";
import {
  Plus,
  Search,
  MessageSquare,
  ClipboardList,
  ExternalLink,
  Trash2,
  X,
  Ticket,
  ListFilter,
  ArrowUpRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SplitViewProps {
  stories: Story[];
  comments: Comment[];
  commentsCount: Record<string, number>;
  selectedStoryId: string | null;
  sprintName: string;
  onSelectStory: (id: string) => void;
  onCloseStory: () => void;
  onAddStory: (title: string, jiraLink: string, description: string, status: StoryStatus) => void;
  onUpdateStory: (id: string, updates: Partial<Story>) => void;
  onAddComment: (storyId: string, text: string) => void;
  onDeleteStory: (id: string) => void;
}

const STATUS_META: Record<StoryStatus, { label: string; badge: string; dot: string }> = {
  todo: {
    label: "To Do",
    badge:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    dot: "bg-slate-400",
  },
  in_progress: {
    label: "In Progress",
    badge:
      "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/30",
    dot: "bg-orange-500",
  },
  in_review: {
    label: "In Review",
    badge:
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/30",
    dot: "bg-purple-500",
  },
  done: {
    label: "Done",
    badge:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30",
    dot: "bg-emerald-500",
  },
};

const STATUS_ORDER: StoryStatus[] = ["todo", "in_progress", "in_review", "done"];

function extractTicketKey(title: string, link?: string): string | null {
  const regex = /[A-Za-z]+-\d+/;
  const match = (link || "").match(regex) || title.match(regex);
  return match ? match[0].toUpperCase() : null;
}

function stripMarkdown(value?: string) {
  return (value || "").replace(/[#*`_\[\]>]/g, "").replace(/\s+/g, " ").trim();
}

export function SplitView({
  stories,
  comments,
  commentsCount,
  selectedStoryId,
  sprintName,
  onSelectStory,
  onCloseStory,
  onAddStory,
  onUpdateStory,
  onAddComment,
  onDeleteStory,
}: SplitViewProps) {
  const [statusFilter, setStatusFilter] = useState<StoryStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newJiraLink, setNewJiraLink] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStatus, setNewStatus] = useState<StoryStatus>("todo");

  const selectedStory = stories.find((s) => s.id === selectedStoryId) || null;

  const filteredStories = stories
    .filter((story) => (statusFilter === "all" ? true : story.status === statusFilter))
    .filter((story) => {
      if (!query.trim()) return true;
      const haystack = `${story.title} ${story.description || ""} ${story.jiraLink || ""}`.toLowerCase();
      return haystack.includes(query.trim().toLowerCase());
    })
    .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));

  const counts = STATUS_ORDER.reduce<Record<string, number>>(
    (acc, status) => {
      acc[status] = stories.filter((s) => s.status === status).length;
      return acc;
    },
    { all: stories.length }
  );

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddStory(newTitle.trim(), newJiraLink.trim(), newDescription, newStatus);
    setNewTitle("");
    setNewJiraLink("");
    setNewDescription("");
    setNewStatus("todo");
    setShowAddForm(false);
  };

  const filterButton = (id: StoryStatus | "all", label: string) => {
    const active = statusFilter === id;
    return (
      <button
        key={id}
        onClick={() => setStatusFilter(id)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition whitespace-nowrap ${
          active
            ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
            : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        }`}
      >
        {id !== "all" && (
          <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-white/80" : STATUS_META[id].dot}`} />
        )}
        {label}
        <span
          className={`font-mono text-[9px] px-1 rounded ${
            active ? "bg-white/20" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
          }`}
        >
          {counts[id] ?? 0}
        </span>
      </button>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 font-sans items-stretch" id="split-view-container">
      {/* Left: ticket list */}
      <div className="flex-1 min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-sm shadow-slate-100/50 dark:shadow-none lg:h-[660px]">
        <div className="border-b border-slate-100 dark:border-slate-800 px-4 py-3 space-y-3 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <ListFilter className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                {sprintName} Tickets
              </h3>
              <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded">
                {stories.length}
              </span>
            </div>
            <button
              onClick={() => setShowAddForm((v) => !v)}
              className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-100 dark:border-indigo-500/30 px-2.5 py-1.5 rounded-lg transition shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              New ticket
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tickets..."
              className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs pl-8 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
            {filterButton("all", "All")}
            {STATUS_ORDER.map((status) => filterButton(status, STATUS_META[status].label))}
          </div>
        </div>

        {/* Inline create form */}
        <AnimatePresence initial={false}>
          {showAddForm && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleCreate}
              className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-4 py-3 space-y-2 overflow-hidden shrink-0"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 font-mono">
                  New Ticket
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="text"
                required
                autoFocus
                placeholder="Title (e.g. JIRA-123 Fix login loop)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <input
                type="url"
                placeholder="Jira link (optional, https://...)"
                value={newJiraLink}
                onChange={(e) => setNewJiraLink(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <textarea
                rows={2}
                placeholder="Description (optional, markdown supported)"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none transition resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <div className="flex items-center gap-2">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as StoryStatus)}
                  className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none transition"
                >
                  {STATUS_ORDER.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_META[status].label}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="ml-auto bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Ticket rows */}
        <div className="flex-1 overflow-y-auto">
          {filteredStories.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16 px-6">
              <Ticket className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2 stroke-[1.5]" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                {stories.length === 0 ? "No tickets in this sprint" : "No matching tickets"}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
                {stories.length === 0
                  ? "Create a new ticket to start tracking work in this sprint."
                  : "Try a different status filter or search term."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStories.map((story) => {
                const key = extractTicketKey(story.title, story.jiraLink);
                const meta = STATUS_META[story.status];
                const isSelected = story.id === selectedStoryId;
                const snippet = stripMarkdown(story.description);

                return (
                  <li key={story.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => onSelectStory(story.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelectStory(story.id);
                        }
                      }}
                      className={`w-full text-left px-4 py-3 flex items-start gap-3 transition group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 ${
                        isSelected
                          ? "bg-indigo-50/70 dark:bg-indigo-500/10"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${meta.dot}`} />
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          {key && (
                            <span className="text-[9px] font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/30 px-1.5 py-0.5 rounded shrink-0">
                              {key}
                            </span>
                          )}
                          <span
                            className={`text-xs font-semibold truncate transition ${
                              isSelected
                                ? "text-indigo-700 dark:text-indigo-300"
                                : "text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                            }`}
                          >
                            {story.title}
                          </span>
                        </div>

                        {snippet && (
                          <p className="text-[10.5px] text-slate-400 dark:text-slate-500 line-clamp-1">
                            {snippet}
                          </p>
                        )}

                        <div className="flex items-center gap-2 pt-0.5">
                          <span
                            className={`text-[8.5px] font-extrabold px-1.5 py-0.5 rounded border tracking-wide uppercase ${meta.badge}`}
                          >
                            {meta.label}
                          </span>
                          {commentsCount[story.id] > 0 && (
                            <span className="flex items-center gap-0.5 text-slate-400 dark:text-slate-500 text-[10px] font-mono font-bold">
                              <MessageSquare className="w-3 h-3" />
                              {commentsCount[story.id]}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 pt-0.5">
                        {story.jiraLink?.trim() ? (
                          <a
                            href={story.jiraLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 rounded-md transition opacity-0 group-hover:opacity-100"
                            title="Open in Jira"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span
                            aria-disabled="true"
                            title="No Jira link set for this ticket"
                            className="p-1.5 text-slate-300 dark:text-slate-600 rounded-md opacity-50 cursor-not-allowed"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Are you sure you want to delete this story?")) {
                              onDeleteStory(story.id);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              e.stopPropagation();
                              if (confirm("Are you sure you want to delete this story?")) {
                                onDeleteStory(story.id);
                              }
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white dark:hover:bg-slate-700 rounded-md transition opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Delete story"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </span>
                        <ArrowUpRight
                          className={`w-3.5 h-3.5 transition ${
                            isSelected ? "text-indigo-500" : "text-slate-300 dark:text-slate-600"
                          }`}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Right: detail panel */}
      <div className="w-full lg:w-[44%] shrink-0 lg:h-[660px]">
        {selectedStory ? (
          <StoryDetailPanel
            story={selectedStory}
            comments={comments}
            onClose={onCloseStory}
            onUpdateStory={onUpdateStory}
            onAddComment={onAddComment}
            embedded
          />
        ) : (
          <div className="h-full min-h-[280px] bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center text-center p-8">
            <ClipboardList className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3 stroke-[1.5]" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No ticket selected</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[220px] leading-relaxed">
              Select a ticket from the list to open its details, description and progress log here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
