//@ts-nocheck
import { useState, FormEvent } from "react";
import { Project, Sprint, Story } from "../types";
import { FolderKanban, Plus, Layers, ClipboardList, Calendar, Edit2, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ProjectListProps {
  projects: Project[];
  sprints: Sprint[];
  stories: Story[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onCreateProject: (name: string) => void;
  onUpdateProject: (id: string, name: string) => void;
  onDeleteProject: (id: string) => void;
}

export function ProjectList({
  projects,
  sprints,
  stories,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
}: ProjectListProps) {
  const [newProjectName, setNewProjectName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState("");
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    onCreateProject(newProjectName);
    setNewProjectName("");
    setShowAddForm(false);
  };

  const handleSaveEdit = (projectId: string) => {
    if (!editingNameValue.trim()) return;
    onUpdateProject(projectId, editingNameValue.trim());
    setEditingProjectId(null);
  };

  return (
    <div className="flex flex-col gap-4 font-sans bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm shadow-slate-100/60 dark:shadow-none" id="project-list-section">
      {/* Header and Add Project Trigger */}
      <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-2.5">
        <h2 className="text-xs font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <FolderKanban className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          Projects
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 p-1.5 rounded-lg transition border border-slate-200/60 dark:border-slate-700"
          title="Create New Project"
          id="toggle-add-project-btn"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Add Project Form inline */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={handleSubmit}
            className="flex flex-col gap-2 overflow-hidden bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 p-3 rounded-xl"
            id="add-project-form"
          >
            <label className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
              Project Name
            </label>
            <input
              type="text"
              placeholder="e.g. Mobile App Redesign"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none transition w-full placeholder:text-slate-400 dark:placeholder:text-slate-500"
              autoFocus
              id="new-project-name-input"
            />
            <div className="flex items-center gap-2 justify-end mt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-xs px-2.5 py-1.5 rounded"
                id="cancel-add-project-btn"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition"
                id="submit-new-project-btn"
              >
                Create
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Projects list */}
      {projects.length === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700 rounded-xl p-6 text-center" id="empty-projects-state">
          <FolderKanban className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2.5 stroke-[1.5]" />
          <p className="text-slate-600 dark:text-slate-300 text-sm font-semibold">No projects created yet.</p>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 max-w-[200px] mx-auto">
            Create a project above to get started with your sprint board.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5" id="projects-grid">
          {projects.map((project) => {
            const projectSprints = sprints.filter((s) => s.projectId === project.id);
            const projectSprintIds = projectSprints.map((s) => s.id);
            const projectStories = stories.filter((story) => projectSprintIds.includes(story.sprintId));
            const activeStories = projectStories.filter((s) => s.status !== "done");

            const isActive = activeProjectId === project.id;
            const isEditing = editingProjectId === project.id;

            return (
              <div
                key={project.id}
                className={`group relative rounded-xl border transition duration-150 ${
                  isActive
                    ? "bg-indigo-50/60 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/30"
                    : "bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60 border-transparent"
                }`}
                id={`project-row-${project.id}`}
              >
                {isActive && (
                  <span className="absolute left-0 top-3 bottom-3 w-1 bg-indigo-600 rounded-r-md z-10" />
                )}

                {isEditing ? (
                  <div className="p-3 flex flex-col gap-2 w-full" id={`project-edit-container-${project.id}`}>
                    <input
                      type="text"
                      value={editingNameValue}
                      onChange={(e) => setEditingNameValue(e.target.value)}
                      className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs px-2.5 py-1.5 rounded-lg border border-indigo-500 focus:outline-none w-full font-sans"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSaveEdit(project.id);
                        } else if (e.key === "Escape") {
                          setEditingProjectId(null);
                        }
                      }}
                      id={`project-edit-input-${project.id}`}
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => setEditingProjectId(null)}
                        className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition"
                        id={`cancel-project-edit-${project.id}`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(project.id)}
                        className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold transition"
                        id={`save-project-edit-${project.id}`}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : deletingProjectId === project.id ? (
                  <div className="p-3 flex flex-col gap-1.5 w-full text-left" id={`project-delete-confirm-${project.id}`}>
                    <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">Delete Project?</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">This deletes all sprints and stories permanently.</span>
                    <div className="flex items-center gap-2.5 justify-end mt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingProjectId(null);
                        }}
                        className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition font-bold"
                        id={`cancel-project-delete-${project.id}`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteProject(project.id);
                          setDeletingProjectId(null);
                        }}
                        className="text-[10px] text-red-650 hover:text-red-700 font-bold transition"
                        id={`confirm-project-delete-${project.id}`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    {/* Select project button area */}
                    <button
                      onClick={() => onSelectProject(project.id)}
                      className="flex-1 flex items-center justify-between text-left p-3 pr-1 w-full text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                      id={`project-btn-${project.id}`}
                    >
                      <div className="flex flex-col gap-1 truncate pr-1">
                        <span className={`font-semibold text-xs truncate transition ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-700 dark:text-slate-300"}`}>
                          {project.name}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-slate-450 dark:text-slate-500" />
                          {new Date(project.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "2-digit",
                          })}
                        </span>
                      </div>
                    </button>

                    {/* Badge / Action area */}
                    <div className="flex items-center gap-1.5 shrink-0 pr-3 pl-1 z-10" id={`project-actions-${project.id}`}>
                      {/* Edit/Delete buttons visible on group-hover */}
                      <div className="hidden group-hover:flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProjectId(project.id);
                            setEditingNameValue(project.name);
                          }}
                          className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition"
                          title="Rename Project"
                          id={`edit-project-trigger-${project.id}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingProjectId(project.id);
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition"
                          title="Delete Project"
                          id={`delete-project-trigger-${project.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Regular stats badges, hidden on group-hover */}
                      <div className="flex group-hover:hidden items-center gap-1.5">
                        <div
                          className="flex items-center gap-1 text-[10px] bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700 px-1.5 py-0.5 rounded"
                          title={`${projectSprints.length} Sprints`}
                        >
                          <Layers className="w-3 h-3 text-slate-400" />
                          <span>{projectSprints.length}</span>
                        </div>
                        {projectStories.length > 0 && (
                          <div
                            className={`flex items-center gap-1 text-[10px] border px-1.5 py-0.5 rounded ${
                              activeStories.length > 0
                                ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-100/80 dark:border-indigo-500/30"
                                : "bg-slate-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border-emerald-100/80 dark:border-emerald-500/30"
                            }`}
                            title={`${activeStories.length} active of ${projectStories.length} total stories`}
                          >
                            <ClipboardList className="w-3 h-3" />
                            <span>{activeStories.length}/{projectStories.length}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
