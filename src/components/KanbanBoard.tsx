//@ts-nocheck
import React, { useState, FormEvent, DragEvent } from "react";
import { Story, StoryStatus } from "../types";
import {
  Plus,
  ExternalLink,
  MessageSquare,
  AlignLeft,
  Trash2,
  Tag,
  ArrowRight,
  ClipboardList,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface KanbanBoardProps {
  stories: Story[];
  commentsCount: Record<string, number>; // map of storyId -> count of comments
  onSelectStory: (id: string) => void;
  onAddStory: (title: string, jiraLink: string, description: string, status: StoryStatus) => void;
  onMoveStory: (id: string, targetStatus: StoryStatus) => void;
  onDeleteStory: (id: string) => void;
}

interface ColumnConfig {
  id: StoryStatus;
  title: string;
  bgColor: string;
  borderColor: string;
  badgeColor: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    id: "todo",
    title: "To Do",
    bgColor: "bg-slate-50/50",
    borderColor: "border-slate-200/40",
    badgeColor: "bg-slate-100 text-slate-600 border-slate-200",
  },
  {
    id: "in_progress",
    title: "In Progress",
    bgColor: "bg-slate-50/50",
    borderColor: "border-slate-200/40",
    badgeColor: "bg-orange-50 text-orange-600 border-orange-100",
  },
  {
    id: "in_review",
    title: "In Review",
    bgColor: "bg-slate-50/50",
    borderColor: "border-slate-200/40",
    badgeColor: "bg-purple-50 text-purple-600 border-purple-100",
  },
  {
    id: "done",
    title: "Done",
    bgColor: "bg-slate-50/50",
    borderColor: "border-slate-200/40",
    badgeColor: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
];

export function KanbanBoard({
  stories,
  commentsCount,
  onSelectStory,
  onAddStory,
  onMoveStory,
  onDeleteStory,
}: KanbanBoardProps) {
  // Column state for inline adding forms
  const [addingToColumn, setAddingToColumn] = useState<StoryStatus | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newJiraLink, setNewJiraLink] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // Track drag over state per column
  const [dragOverColumn, setDragOverColumn] = useState<StoryStatus | null>(null);

  // Track currently dragged story id
  const [draggingStoryId, setDraggingStoryId] = useState<string | null>(null);

  // Submit inline story form
  const handleAddStorySubmit = (e: FormEvent, columnId: StoryStatus) => {
    e.preventDefault();
    if (!newTitle.trim() || !newJiraLink.trim()) return;

    onAddStory(newTitle, newJiraLink, newDescription, columnId);

    // Reset
    setNewTitle("");
    setNewJiraLink("");
    setNewDescription("");
    setAddingToColumn(null);
  };

  // Extract a ticker badge name like "JIRA-402" or "ABC-123" from Jira links or titles
  const extractTicketKey = (title: string, link: string): string | null => {
    // Regex for matching key patterns: e.g., AB-123, JIRA-8532
    const regex = /[A-Za-z]+-\d+/;
    const matchLink = link.match(regex);
    if (matchLink) return matchLink[0].toUpperCase();

    const matchTitle = title.match(regex);
    if (matchTitle) return matchTitle[0].toUpperCase();

    return null;
  };

  // Native HTML5 Drag and Drop Handlers
  const handleDragStart = (e: DragEvent, storyId: string) => {
    setDraggingStoryId(storyId);
    e.dataTransfer.setData("text/plain", storyId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggingStoryId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: DragEvent, columnId: StoryStatus) => {
    e.preventDefault();
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: DragEvent, columnId: StoryStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id) {
      onMoveStory(id, columnId);
    }
    setDragOverColumn(null);
    setDraggingStoryId(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-sans" id="kanban-grid-container">
      {COLUMNS.map((col) => {
        const columnStories = stories.filter((story) => story.status === col.id);
        const isDragOver = dragOverColumn === col.id;

        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`flex flex-col rounded-2xl border p-4.5 min-h-[500px] transition duration-200 ${col.bgColor} ${
              isDragOver
                ? "border-indigo-500 bg-slate-50/90 shadow-[0_4px_24px_rgba(99,102,241,0.08)] scale-[1.01]"
                : col.borderColor
            }`}
            id={`column-container-${col.id}`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-slate-800">{col.title}</h4>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full border ${col.badgeColor}`}>
                  {columnStories.length}
                </span>
              </div>
              <button
                onClick={() => setAddingToColumn(col.id)}
                className="text-slate-400 hover:text-slate-800 hover:bg-slate-100 p-1.5 rounded-lg transition"
                title={`Add story to ${col.title}`}
                id={`add-story-btn-${col.id}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Stories Cards List */}
            <div className="flex flex-col gap-3 overflow-y-auto max-h-[600px] pr-1" id={`stories-column-list-${col.id}`}>
              {columnStories.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl" id={`empty-col-${col.id}`}>
                  <ClipboardList className="w-6 h-6 text-slate-300 mx-auto mb-1 stroke-[1.5]" />
                  <p className="text-slate-400 text-xs">Empty column</p>
                </div>
              ) : (
                columnStories.map((story) => {
                  const key = extractTicketKey(story.title, story.jiraLink);
                  const isDragging = draggingStoryId === story.id;

                  // Seeded randomizer for realistic priority and duration to match screenshot exactly
                  let hash = 0;
                  for (let i = 0; i < story.id.length; i++) {
                    hash = story.id.charCodeAt(i) + ((hash << 5) - hash);
                  }
                  const priorities = ["Low", "Normal", "High", "Urgent"];
                  const priority = priorities[Math.abs(hash) % priorities.length];
                  
                  const times = ["20 min", "30 min", "50 min", "90 min", "120 min"];
                  const duration = times[Math.abs(hash >> 2) % times.length];

                  // Priority style classes
                  const priorityClass = 
                    priority === "Urgent" ? "bg-red-50 text-red-700 border-red-100" :
                    priority === "High" ? "bg-orange-50 text-orange-700 border-orange-100" :
                    priority === "Normal" ? "bg-blue-50 text-blue-700 border-blue-100" :
                    "bg-slate-50 text-slate-600 border-slate-200";

                  // Status badge style matching screenshot
                  let statusLabel = "TO DO";
                  let statusBadgeClass = "bg-slate-100 text-slate-700 border-slate-200/60";
                  if (story.status === "in_progress") {
                    statusLabel = "PROGRESS";
                    statusBadgeClass = "bg-[#FF7A00]/10 text-[#FF7A00] border-[#FF7A00]/20";
                  } else if (story.status === "in_review") {
                    statusLabel = "REVIEW";
                    statusBadgeClass = "bg-purple-100 text-purple-700 border-purple-200/40";
                  } else if (story.status === "done") {
                    statusLabel = "DONE";
                    statusBadgeClass = "bg-emerald-100 text-emerald-700 border-emerald-200/40";
                  }

                  return (
                    <div
                      key={story.id}
                      draggable="true"
                      onDragStart={(e) => handleDragStart(e, story.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => onSelectStory(story.id)}
                      className={`bg-white border border-slate-200/60 hover:border-slate-300 rounded-2xl p-4 flex flex-col gap-2.5 cursor-pointer select-none transition shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] group ${
                        isDragging ? "opacity-30 border-dashed border-indigo-500 scale-95" : ""
                      }`}
                      id={`story-card-${story.id}`}
                    >
                      {/* Ticket key / Tags and external link */}
                      <div className="flex items-center justify-between gap-1">
                        {key ? (
                          <div className="flex items-center gap-1 text-[9px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-md shrink-0">
                            <Tag className="w-2.5 h-2.5 text-indigo-500" />
                            {key}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[9px] font-mono text-slate-400 px-1 shrink-0 font-bold tracking-wide">
                            STORY
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition duration-150 shrink-0">
                          <a
                            href={story.jiraLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()} // don't open modal
                            className="text-slate-400 hover:text-indigo-600 p-1 hover:bg-slate-100 rounded transition"
                            title="Open in Jira"
                            id={`card-jira-link-${story.id}`}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Are you sure you want to delete this story?")) {
                                onDeleteStory(story.id);
                              }
                            }}
                            className="text-slate-400 hover:text-red-600 p-1 hover:bg-slate-100 rounded transition"
                            title="Delete story"
                            id={`delete-story-btn-${story.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Story Title */}
                      <span className="text-slate-800 text-xs font-semibold leading-relaxed line-clamp-3 group-hover:text-indigo-600 transition">
                        {story.title}
                      </span>

                      {/* Story Short Description (if exists) */}
                      {story.description && story.description.trim().length > 0 ? (
                        <p className="text-slate-400 text-[10.5px] leading-relaxed line-clamp-2">
                          {story.description.replace(/[#*`_\[\]]/g, "")}
                        </p>
                      ) : null}

                      {/* Card Footer Metrics styled like the screenshot */}
                      <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px] text-slate-500 border-t border-slate-100 pt-2.5">
                        <div className="flex items-center gap-1.5">
                          {/* Screenshot design: tag status block */}
                          <span className={`text-[8.5px] font-extrabold px-1.5 py-0.5 rounded tracking-wide border font-sans ${statusBadgeClass}`}>
                            {statusLabel}
                          </span>

                          {/* Screenshot design: priority block */}
                          {/* <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded border ${priorityClass}`}>
                            {priority}
                          </span> */}
                        </div>

                        <div className="flex items-center gap-2 text-slate-450">
                          {/* Duration estimate */}
                          {/* <span className="text-[9px] font-mono font-medium bg-slate-50 border border-slate-150 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <span className="text-slate-400">⏱</span>
                            {duration}
                          </span> */}

                          {commentsCount[story.id] > 0 && (
                            <div
                              className="flex items-center gap-0.5 text-slate-500 bg-slate-50 border border-slate-200 px-1 py-0.5 rounded"
                              title={`${commentsCount[story.id]} updates`}
                            >
                              <MessageSquare className="w-3 h-3 text-indigo-500" />
                              <span className="font-mono text-[9px] font-bold">
                                {commentsCount[story.id]}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}

      {/* Create Task Modal Overlay */}
      <AnimatePresence>
        {addingToColumn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm font-sans animate-fade-in" id="add-story-modal-overlay">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col"
              id="add-story-modal-container"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="bg-indigo-50 text-indigo-600 border border-indigo-100 p-2 rounded-xl flex items-center justify-center">
                    <Plus className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 font-display">Create Story Card</h3>
                    <p className="text-[10px] text-slate-500">Add a new ticket to your sprint board</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAddingToColumn(null)}
                  className="text-slate-450 hover:text-slate-850 p-1.5 rounded-lg transition hover:bg-slate-100"
                  id="close-add-modal-btn"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={(e) => handleAddStorySubmit(e, addingToColumn)} className="p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold font-mono">
                    Story Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. JIRA-123 Fix Login Loop"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="bg-slate-50 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 focus:outline-none transition w-full"
                    id="modal-new-story-title"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold font-mono">
                    Jira Link *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="e.g. https://company.atlassian.net/browse/JIRA-123"
                    value={newJiraLink}
                    onChange={(e) => setNewJiraLink(e.target.value)}
                    className="bg-slate-50 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 focus:outline-none transition w-full"
                    id="modal-new-story-jira-link"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold font-mono">
                    Description (Optional)
                  </label>
                  <textarea
                    placeholder="Markdown description or details about this ticket..."
                    rows={4}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="bg-slate-50 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 focus:outline-none transition w-full resize-none font-sans"
                    id="modal-new-story-description"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold font-mono">
                    Status / Column
                  </label>
                  <select
                    value={addingToColumn}
                    onChange={(e) => setAddingToColumn(e.target.value as StoryStatus)}
                    className="bg-slate-50 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none transition w-full"
                    id="modal-new-story-status"
                  >
                    {COLUMNS.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Footer buttons */}
                <div className="flex items-center justify-end gap-2.5 mt-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setNewTitle("");
                      setNewJiraLink("");
                      setNewDescription("");
                      setAddingToColumn(null);
                    }}
                    className="bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-200 transition"
                    id="modal-cancel-story-create"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4.5 py-2 rounded-xl shadow-lg shadow-indigo-600/10 transition flex items-center gap-1.5"
                    id="modal-submit-new-story"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Story</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
