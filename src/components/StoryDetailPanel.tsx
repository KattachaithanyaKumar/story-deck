//@ts-nocheck
import { useState, KeyboardEvent, useEffect, useRef, FormEvent } from "react";
import { Story, Comment, StoryStatus } from "../types";
import { MarkdownViewer } from "./MarkdownViewer";
import {
  X,
  ExternalLink,
  MessageSquare,
  Edit2,
  Send,
  Calendar,
  Clock,
  Check,
  ClipboardList,
} from "lucide-react";

interface StoryDetailPanelProps {
  story: Story;
  comments?: Comment[];
  onClose?: () => void;
  onUpdateStory: (id: string, updates: Partial<Story>) => void;
  onAddComment: (storyId: string, text: string) => void;
  embedded?: boolean;
}

export function StoryDetailPanel({
  story,
  comments = [],
  onClose,
  onUpdateStory,
  onAddComment,
  embedded = false,
}: StoryDetailPanelProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(story.title);

  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState(story.description || "");

  const [latestUpdateText, setLatestUpdateText] = useState("");

  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitleValue(story.title);
    setDescValue(story.description || "");
    setIsEditingTitle(false);
    setIsEditingDesc(false);
    setLatestUpdateText("");
  }, [story.id]);

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
      setTitleValue(story.title);
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

  const handleSaveDescription = () => {
    onUpdateStory(story.id, { description: descValue.trim() });
    setIsEditingDesc(false);
  };

  const handleCommentSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!latestUpdateText.trim()) return;

    onAddComment(story.id, latestUpdateText.trim());
    setLatestUpdateText("");
  };

  const handleClose = () => {
    if (titleValue.trim() && titleValue.trim() !== story.title) {
      onUpdateStory(story.id, { title: titleValue.trim() });
    }
    if (descValue.trim() !== (story.description || "").trim()) {
      onUpdateStory(story.id, { description: descValue.trim() });
    }
    onClose?.();
  };

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

  const storyComments = comments
    .filter((c) => c.storyId === story.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const extractTicketKey = () => {
    const regex = /[A-Za-z]+-\d+/;
    const match = story.jiraLink?.match(regex) || story.title.match(regex);
    return match ? match[0].toUpperCase() : null;
  };

  const ticketKey = extractTicketKey();

  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col overflow-hidden ${
        embedded ? "h-full shadow-sm dark:shadow-none" : "w-full max-h-[90vh] shadow-2xl"
      }`}
      id="story-detail-panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5 py-3.5 bg-slate-50 dark:bg-slate-900/80 shrink-0 gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/30 p-2 rounded-xl flex items-center justify-center shrink-0">
            <ClipboardList className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-display truncate">
                {ticketKey || "Ticket Details"}
              </h3>
              {ticketKey && (
                <span className="hidden sm:inline text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono font-bold">
                  Details & Logs
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
              Manage details and daily developer updates
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {story.jiraLink?.trim() ? (
            <a
              href={story.jiraLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 p-2 rounded-xl transition text-xs font-bold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
              id="modal-jira-link"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open in Jira</span>
            </a>
          ) : (
            <span
              aria-disabled="true"
              title="No Jira link set for this ticket"
              className="text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-slate-800/60 p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700/60 cursor-not-allowed opacity-60"
              id="modal-jira-link-disabled"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open in Jira</span>
            </span>
          )}
          {onClose && (
            <button
              onClick={handleClose}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-xl transition border border-slate-200 dark:border-slate-700"
              id="modal-close-btn"
              title="Close ticket"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="overflow-y-auto p-5 space-y-5 flex-1 bg-white dark:bg-slate-900">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold font-mono">
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
              className="bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs px-3.5 py-2.5 rounded-xl border border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 focus:outline-none transition w-full font-bold"
              id="edit-title-input"
            />
          ) : (
            <div
              onClick={() => setIsEditingTitle(true)}
              className="group flex items-center justify-between gap-2 text-slate-800 dark:text-slate-100 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800/60 px-3.5 py-2.5 -ml-1 rounded-xl cursor-pointer transition w-full"
              id="title-display-box"
            >
              <span className="truncate pr-4">{story.title}</span>
              <Edit2 className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 shrink-0 transition" />
            </div>
          )}
        </div>

        {/* Quick Info Grid */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-sans">
          <div>
            <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] font-mono">
              Status
            </span>
            <div className="flex items-center gap-1.5 mt-1.5">
              <select
                value={story.status}
                onChange={(e) => onUpdateStory(story.id, { status: e.target.value as StoryStatus })}
                className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 text-xs px-3.5 py-2.5 rounded-xl focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none transition cursor-pointer font-semibold w-full"
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
            <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] font-mono">
              Last Updated
            </span>
            <div className="flex items-center gap-2 mt-3 text-slate-700 dark:text-slate-300 font-mono text-xs">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>{new Date(story.updatedAt).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
              Description (Markdown Supported)
            </label>

            {isEditingDesc ? (
              <button
                onClick={handleSaveDescription}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1 font-bold"
                id="save-desc-btn"
              >
                <Check className="w-3.5 h-3.5" />
                Save Preview
              </button>
            ) : (
              <button
                onClick={() => setIsEditingDesc(true)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1.5 font-bold"
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
                className="bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 focus:outline-none transition w-full resize-y font-sans placeholder:text-slate-400 dark:placeholder:text-slate-500"
                id="edit-desc-textarea"
              />
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                Tip: Changes save automatically when closing, or click "Save Preview" above.
              </p>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700 rounded-xl overflow-x-auto">
              <MarkdownViewer text={story.description} />
            </div>
          )}
        </div>

        {/* Comment Update Input */}
        <div className="space-y-2.5 pt-4 border-t border-slate-200/60 dark:border-slate-800">
          <label className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold block">
            Log Progress Update
          </label>
          <form onSubmit={handleCommentSubmit} className="flex gap-2.5 items-end">
            <input
              type="text"
              placeholder="What did you work on? (e.g. Completed unit tests, pending review)"
              value={latestUpdateText}
              onChange={(e) => setLatestUpdateText(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 focus:outline-none transition w-full flex-1 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              id="comment-input-box"
            />
            <button
              type="submit"
              disabled={!latestUpdateText.trim()}
              className={`p-2.5 rounded-xl border shrink-0 transition flex items-center justify-center ${
                latestUpdateText.trim()
                  ? "bg-indigo-600 border-indigo-500 hover:bg-indigo-500 text-white cursor-pointer shadow-md shadow-indigo-100"
                  : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
              }`}
              id="comment-submit-btn"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Comment History */}
        <div className="space-y-3.5 pt-4 border-t border-slate-200/60 dark:border-slate-800">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-slate-400" />
            History Log ({storyComments.length})
          </h4>

          {storyComments.length === 0 ? (
            <div
              className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl"
              id="empty-comments-box"
            >
              <MessageSquare className="w-6 h-6 text-slate-350 dark:text-slate-600 mx-auto mb-1 stroke-[1.5]" />
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                No updates logged for this story yet.
              </p>
            </div>
          ) : (
            <div
              className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[300px] overflow-y-auto pr-1"
              id="comments-timeline"
            >
              {storyComments.map((comment) => (
                <div
                  key={comment.id}
                  className="py-3.5 flex flex-col gap-1.5 first:pt-0 last:pb-0"
                  id={`comment-item-${comment.id}`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-extrabold tracking-wide uppercase">
                      DEVELOPER UPDATE
                    </span>
                    <span className="flex items-center gap-1 font-mono font-semibold">
                      <Calendar className="w-3 h-3" />
                      {formatCommentTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed whitespace-pre-wrap font-medium">
                    {comment.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      {!embedded && (
        <div className="flex items-center justify-end px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 shrink-0">
          <button
            onClick={handleClose}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4.5 py-2 rounded-xl shadow-lg shadow-indigo-600/10 transition flex items-center gap-1.5"
            id="modal-footer-close-btn"
          >
            <Check className="w-4 h-4" />
            <span>Close & Save Changes</span>
          </button>
        </div>
      )}
    </div>
  );
}
