//@ts-nocheck
import { useState, FormEvent } from "react";
import { Sprint, Story } from "../types";
import { Plus, Calendar, Layers, Clock, AlertCircle, Edit2, Trash2, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SprintTabsProps {
  sprints: Sprint[];
  stories: Story[];
  activeSprintId: string | null;
  onSelectSprint: (id: string) => void;
  onCreateSprint: (name: string, startDate?: string, endDate?: string) => void;
  onUpdateSprint: (id: string, updates: Partial<Sprint>) => void;
  onDeleteSprint: (id: string) => void;
}

export function SprintTabs({
  sprints,
  stories,
  activeSprintId,
  onSelectSprint,
  onCreateSprint,
  onUpdateSprint,
  onDeleteSprint,
}: SprintTabsProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [sprintName, setSprintName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Edit Sprint states
  const [editingSprintId, setEditingSprintId] = useState<string | null>(null);
  const [editingSprintName, setEditingSprintName] = useState("");
  const [editingStartDate, setEditingStartDate] = useState("");
  const [editingEndDate, setEditingEndDate] = useState("");
  const [deletingSprintId, setDeletingSprintId] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!sprintName.trim()) return;
    onCreateSprint(sprintName, startDate || undefined, endDate || undefined);
    setSprintName("");
    setStartDate("");
    setEndDate("");
    setShowAddForm(false);
  };

  // Format date nicely
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  const getSprintPeriod = (sprint: Sprint) => {
    if (!sprint.startDate && !sprint.endDate) return "No dates set";
    if (sprint.startDate && sprint.endDate) {
      return `${formatDate(sprint.startDate)} - ${formatDate(sprint.endDate)}`;
    }
    if (sprint.startDate) return `Starts ${formatDate(sprint.startDate)}`;
    return `Ends ${formatDate(sprint.endDate)}`;
  };

  return (
    <div className="flex flex-col gap-3 font-sans" id="sprints-section">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4.5 h-4.5 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-850">Sprints</h3>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 border border-indigo-150 px-2.5 py-1.5 rounded-lg transition font-semibold"
          id="toggle-add-sprint-btn"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Sprint
        </button>
      </div>

      {/* Add Sprint Inline Dialog */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleSubmit}
            className="bg-white border border-slate-200/80 p-4 rounded-xl flex flex-col gap-3 shadow-sm shadow-slate-100"
            id="add-sprint-form"
          >
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                Sprint Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sprint 1 - Core Features"
                value={sprintName}
                onChange={(e) => setSprintName(e.target.value)}
                className="bg-slate-50 text-slate-800 text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none transition w-full"
                id="sprint-name-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  Start Date (Optional)
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-50 text-slate-800 text-xs px-3 py-1.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none transition w-full"
                  id="sprint-start-date"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-50 text-slate-800 text-xs px-3 py-1.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none transition w-full"
                  id="sprint-end-date"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end mt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-slate-500 hover:text-slate-800 text-xs px-3 py-1.5 rounded-lg"
                id="cancel-add-sprint"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-1.5 rounded-lg shadow-sm transition"
                id="submit-sprint"
              >
                Create Sprint
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Sprints list tabs layout */}
      {sprints.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-8 text-center" id="empty-sprints-state">
          <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2 stroke-[1.5]" />
          <p className="text-slate-600 text-sm font-semibold">No Sprints created in this project yet.</p>
          <p className="text-slate-400 text-xs mt-1">
            Create a sprint above to open your kanban task board.
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2.5" id="sprint-tabs-container">
          {sprints.map((sprint) => {
            const sprintStories = stories.filter((story) => story.sprintId === sprint.id);
            const doneCount = sprintStories.filter((st) => st.status === "done").length;
            const totalCount = sprintStories.length;
            const isActive = activeSprintId === sprint.id;

            // Soft-tinted modern indigo active state or clean white card inactive state
            const isSelectedClass = isActive
              ? "bg-indigo-50 border-indigo-200 text-indigo-900 shadow-sm shadow-indigo-100/50"
              : "bg-white hover:bg-slate-50/80 border-slate-200/80 text-slate-600 shadow-sm shadow-slate-100/30";

            return deletingSprintId === sprint.id ? (
              <div
                key={sprint.id}
                onClick={(e) => e.stopPropagation()}
                className="flex flex-col gap-1.5 px-4 py-3.5 rounded-xl border border-red-100 bg-red-50 text-left min-w-[160px] max-w-[240px] flex-1 relative"
                id={`sprint-tab-delete-confirm-${sprint.id}`}
              >
                <span className="font-bold text-[10px] text-red-600 uppercase tracking-wide">Delete Sprint?</span>
                <p className="text-[10px] text-slate-500 leading-snug">
                  Permanently deletes all its stories.
                </p>
                <div className="flex items-center gap-2.5 justify-end mt-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingSprintId(null);
                    }}
                    className="text-[10px] text-slate-500 hover:text-slate-800 transition font-bold"
                    id={`cancel-delete-sprint-${sprint.id}`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSprint(sprint.id);
                      setDeletingSprintId(null);
                    }}
                    className="text-[10px] text-red-600 hover:text-red-700 font-extrabold transition"
                    id={`confirm-delete-sprint-${sprint.id}`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <div
                key={sprint.id}
                onClick={() => onSelectSprint(sprint.id)}
                className={`flex flex-col gap-1 px-4 py-3 rounded-xl border text-left cursor-pointer transition min-w-[160px] max-w-[240px] flex-1 relative group ${isSelectedClass}`}
                id={`sprint-tab-${sprint.id}`}
              >
                {/* Edit / Delete overlay buttons (visible on hover) */}
                <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-1 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingSprintId(sprint.id);
                      setEditingSprintName(sprint.name);
                      setEditingStartDate(sprint.startDate || "");
                      setEditingEndDate(sprint.endDate || "");
                    }}
                    className="p-1 text-slate-500 hover:text-indigo-600 bg-white border border-slate-200 rounded-md transition shadow-sm"
                    title="Edit Sprint"
                    id={`edit-sprint-trigger-${sprint.id}`}
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingSprintId(sprint.id);
                    }}
                    className="p-1 text-slate-500 hover:text-red-600 bg-white border border-slate-200 rounded-md transition shadow-sm"
                    title="Delete Sprint"
                    id={`delete-sprint-trigger-${sprint.id}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex items-start justify-between gap-1 w-full pr-8">
                  <span className={`font-semibold text-xs truncate ${isActive ? "text-indigo-900" : "text-slate-800"}`}>{sprint.name}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                  )}
                </div>

                <div className={`flex items-center gap-1.5 text-[10px] ${isActive ? "text-indigo-600" : "text-slate-400"}`}>
                  <Clock className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-indigo-500" : "text-slate-400"}`} />
                  <span className="truncate font-medium">{getSprintPeriod(sprint)}</span>
                </div>

                {totalCount > 0 ? (
                  <div className={`mt-2 w-full flex items-center justify-between text-[10px] font-mono ${isActive ? "text-indigo-700/85" : "text-slate-450"}`}>
                    <span>
                      Done: {doneCount}/{totalCount}
                    </span>
                    <span className="font-bold">
                      {Math.round((doneCount / totalCount) * 100)}%
                    </span>
                  </div>
                ) : (
                  <div className={`mt-2 flex items-center gap-1 text-[10px] ${isActive ? "text-indigo-500" : "text-slate-400"}`}>
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>No stories</span>
                  </div>
                )}
                
                {/* Visual Progress Bar */}
                {totalCount > 0 && (
                  <div className={`w-full h-1 rounded-full overflow-hidden mt-1.5 ${isActive ? "bg-indigo-200/50" : "bg-slate-100"}`}>
                    <div
                      className={`h-1 rounded-full transition-all duration-300 ${isActive ? "bg-indigo-600" : "bg-indigo-500/70"}`}
                      style={{ width: `${(doneCount / totalCount) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Sprint Modal */}
      <AnimatePresence>
        {editingSprintId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm font-sans" id="edit-sprint-modal-overlay">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col"
              id="edit-sprint-modal-container"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="bg-indigo-50 text-indigo-600 border border-indigo-100 p-2 rounded-xl flex items-center justify-center">
                    <Edit2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 font-display">Edit Sprint Details</h3>
                    <p className="text-[10px] text-slate-500">Update sprint name or duration</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingSprintId(null)}
                  className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition hover:bg-slate-100"
                  id="close-edit-sprint-modal-btn"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!editingSprintName.trim()) return;
                  onUpdateSprint(editingSprintId, {
                    name: editingSprintName.trim(),
                    startDate: editingStartDate || undefined,
                    endDate: editingEndDate || undefined,
                  });
                  setEditingSprintId(null);
                }}
                className="p-6 flex flex-col gap-4"
              >
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold font-mono">
                    Sprint Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingSprintName}
                    onChange={(e) => setEditingSprintName(e.target.value)}
                    className="bg-slate-50 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 focus:outline-none transition w-full"
                    id="edit-sprint-name-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold font-mono">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={editingStartDate}
                      onChange={(e) => setEditingStartDate(e.target.value)}
                      className="bg-slate-50 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none transition w-full"
                      id="edit-sprint-start-date"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold font-mono">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={editingEndDate}
                      onChange={(e) => setEditingEndDate(e.target.value)}
                      className="bg-slate-50 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none transition w-full"
                      id="edit-sprint-end-date"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2.5 mt-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingSprintId(null)}
                    className="bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-200 transition"
                    id="cancel-sprint-edit-btn"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4.5 py-2 rounded-xl shadow-lg shadow-indigo-600/10 transition flex items-center gap-1.5"
                    id="submit-sprint-edit-btn"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
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
