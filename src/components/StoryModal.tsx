//@ts-nocheck
import { useState, KeyboardEvent, useEffect, useRef, FormEvent } from "react";
import { Story, Comment, StoryStatus } from "../types";
import { MarkdownViewer } from "./MarkdownViewer";
import {
  X,
  ExternalLink,
  MessageSquare,
  Edit2,
  Eye,
  Send,
  Calendar,
  Clock,
  Check,
  ClipboardList,
} from "lucide-react";
import { motion } from "motion/react";

interface StoryModalProps {
  story: Story;
  comments: Comment[];
  onClose: () => void;
  onUpdateStory: (id: string, updates: Partial<Story>) => void;
  onAddComment: (storyId: string, text: string) => void;
}

export function StoryModal({
  story,
  comments = [],
  onClose,
  onUpdateStory,
  onAddComment,
}: StoryModalProps) {
  // Title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(story.title);

  // Description editing state
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState(story.description || "");

  // New Comment input state
  const [latestUpdateText, setLatestUpdateText] = useState("");

  const titleInputRef = useRef<HTMLInputElement>(null);

  // Synchronize state when story changes
  useEffect(() => {
    setTitleValue(story.title);
    setDescValue(story.description || "");
  }, [story]);

  // Handle title focus on edit
  useEffect(() => {
    if (isEditingTitle) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [isEditingTitle]);

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (titleValue.trim() && titleValue.trim() !== story.title) {
      onUpdateStory(story.id, { title: titleValue.trim() });
    } else {
      setTitleValue(story.title); // reset on empty or same
    }
  };

  const handleTitleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleTitleBlur();
    } else if (e.key === "Escape") {
      setTitleValue(story.title);
      setIsEditingTitle(false);
    }
  };

  // Auto-save description on toggle/blur
  const handleSaveDescription = () => {
    onUpdateStory(story.id, { description: descValue.trim() });
    setIsEditingDesc(false);
  };

  // Submit comment
  const handleCommentSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!latestUpdateText.trim()) return;

    onAddComment(story.id, latestUpdateText.trim());
    setLatestUpdateText("");
  };

  // Close helper
  const handleClose = () => {
    // If we were editing, save automatically
    if (titleValue.trim() && titleValue.trim() !== story.title) {
      onUpdateStory(story.id, { title: titleValue.trim() });
    }
    if (descValue.trim() !== (story.description || "").trim()) {
      onUpdateStory(story.id, { description: descValue.trim() });
    }
    onClose();
  };

  // Format Comment Timestamps (e.g. "Jul 6, 2026, 3:45 PM")
  const formatCommentTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "Just now";
    }
  };

  // Filter and sort comments for this story (newest first)
  const storyComments = comments
    .filter((c) => c.storyId === story.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm font-sans animate-fade-in" id="story-modal-overlay">
      {/* Modal Card */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        id="story-modal-container"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-50 text-indigo-600 border border-indigo-100 p-2 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 font-display">Story Details & Logs</h3>
              <p className="text-[10px] text-slate-500 font-medium">Manage details and daily developer updates</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href={story.jiraLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 hover:text-indigo-600 bg-white hover:bg-slate-50 p-2 rounded-xl transition text-xs font-bold flex items-center gap-1.5 border border-slate-200"
              id="modal-jira-link"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Jira</span>
            </a>
            <button
              onClick={handleClose}
              className="text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 p-2 rounded-xl transition border border-slate-200"
              id="modal-close-btn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1 bg-white">
          {/* Title Area */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold font-mono">
              Story Title (Click to Edit)
            </label>
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                className="bg-slate-50 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 focus:outline-none transition w-full font-bold"
                id="edit-title-input"
              />
            ) : (
              <div
                onClick={() => setIsEditingTitle(true)}
                className="group flex items-center justify-between gap-2 text-slate-800 text-sm font-bold hover:bg-slate-50 px-3.5 py-2.5 -ml-1 rounded-xl cursor-pointer transition w-full"
                id="title-display-box"
              >
                <span className="truncate pr-4">{story.title}</span>
                <Edit2 className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 shrink-0 transition" />
              </div>
            )}
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 border border-slate-200 rounded-2xl text-xs font-sans">
            <div>
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] font-mono">Status</span>
              <div className="flex items-center gap-1.5 mt-1.5">
                <select
                  value={story.status}
                  onChange={(e) => onUpdateStory(story.id, { status: e.target.value as StoryStatus })}
                  className="bg-white text-slate-800 border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none transition cursor-pointer font-semibold w-full"
                  id="story-status-dropdown"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="in_review">In Review</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>

            <div>
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] font-mono">Last Updated</span>
              <div className="flex items-center gap-2 mt-3 text-slate-700 font-mono text-xs">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{new Date(story.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                Description (Markdown Supported)
              </label>

              {isEditingDesc ? (
                <button
                  onClick={handleSaveDescription}
                  className="text-xs text-indigo-600 hover:text-indigo-500 flex items-center gap-1 font-bold"
                  id="save-desc-btn"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save Preview
                </button>
              ) : (
                <button
                  onClick={() => setIsEditingDesc(true)}
                  className="text-xs text-indigo-600 hover:text-indigo-500 flex items-center gap-1.5 font-bold"
                  id="edit-desc-btn"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Description
                </button>
              )}
            </div>

            {isEditingDesc ? (
              <div className="space-y-1">
                <textarea
                  rows={6}
                  placeholder="Type a description. Use markdown: **bold**, - lists, `code`, [link](url)..."
                  value={descValue}
                  onChange={(e) => setDescValue(e.target.value)}
                  className="bg-slate-50 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 focus:outline-none transition w-full resize-y font-sans"
                  id="edit-desc-textarea"
                />
                <p className="text-[10px] text-slate-400">
                  Tip: Changes save automatically when closing, or click "Save Preview" above.
                </p>
              </div>
            ) : (
              <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl overflow-x-auto">
                <MarkdownViewer text={story.description} />
              </div>
            )}
          </div>

          {/* Comment Update Input */}
          <div className="space-y-2.5 pt-4 border-t border-slate-200/60">
            <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
              Log Progress Update
            </label>
            <form onSubmit={handleCommentSubmit} className="flex gap-2.5 items-end">
              <input
                type="text"
                placeholder="What did you work on? (e.g. Completed unit tests, pending review)"
                value={latestUpdateText}
                onChange={(e) => setLatestUpdateText(e.target.value)}
                className="bg-slate-50 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 focus:outline-none transition w-full flex-1"
                id="comment-input-box"
              />
              <button
                type="submit"
                disabled={!latestUpdateText.trim()}
                className={`p-2.5 rounded-xl border shrink-0 transition flex items-center justify-center ${
                  latestUpdateText.trim()
                    ? "bg-indigo-600 border-indigo-500 hover:bg-indigo-500 text-white cursor-pointer shadow-md shadow-indigo-100"
                    : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                }`}
                id="comment-submit-btn"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Comment History Section */}
          <div className="space-y-3.5 pt-4 border-t border-slate-200/60">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              History Log ({storyComments.length})
            </h4>

            {storyComments.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl" id="empty-comments-box">
                <MessageSquare className="w-6 h-6 text-slate-350 mx-auto mb-1 stroke-[1.5]" />
                <p className="text-slate-500 text-xs">No updates logged for this story yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1" id="comments-timeline">
                {storyComments.map((comment) => (
                  <div
                    key={comment.id}
                    className="py-3.5 flex flex-col gap-1.5 first:pt-0 last:pb-0"
                    id={`comment-item-${comment.id}`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-mono text-indigo-600 font-extrabold tracking-wide uppercase">DEVELOPER UPDATE</span>
                      <span className="flex items-center gap-1 font-mono font-semibold">
                        <Calendar className="w-3 h-3" />
                        {formatCommentTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-wrap font-medium">
                      {comment.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer with close button */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
          <button
            onClick={handleClose}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4.5 py-2 rounded-xl shadow-lg shadow-indigo-600/10 transition flex items-center gap-1.5"
            id="modal-footer-close-btn"
          >
            <Check className="w-4 h-4" />
            <span>Close & Save Changes</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
