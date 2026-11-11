//@ts-nocheck
import { useState, useEffect } from "react";
import { useTrackerData } from "./hooks/useTrackerData";
import { StorageBanner } from "./components/StorageBanner";
import { ProjectList } from "./components/ProjectList";
import { SprintTabs } from "./components/SprintTabs";
import { KanbanBoard } from "./components/KanbanBoard";
import { StoryModal } from "./components/StoryModal";
import { SplitView } from "./components/SplitView";
import {
  FolderKanban,
  Layers,
  Home,
  ChevronRight,
  Database,
  FileJson,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Plus,
  Sun,
  Moon,
  LayoutGrid,
  List,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const {
    data,
    loading,
    error,
    clearError,
    storageMode,
    fileName,
    fileSupport,
    createNewFile,
    selectExistingFile,
    useBrowserStorage,
    reconnectFile,
    needsFilePermission,
    addProject,
    updateProject,
    deleteProject,
    addSprint,
    updateSprint,
    deleteSprint,
    addStory,
    updateStory,
    deleteStory,
    addComment,
    moveStory,
    importBackupData,
    exportBackupData,
  } = useTrackerData();

  // Navigation Selections
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);

  // Theme & layout preferences
  const [theme, setTheme] = useState<"light" | "dark">(
    () => (localStorage.getItem("storydeck-theme") as "light" | "dark") || "light"
  );
  const [viewMode, setViewMode] = useState<"board" | "list">(
    () => (localStorage.getItem("storydeck-view-v2") as "board" | "list") || "list"
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
    localStorage.setItem("storydeck-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("storydeck-view-v2", viewMode);
  }, [viewMode]);

  const handleViewModeChange = (mode: "board" | "list") => {
    setViewMode(mode);
    setSelectedStoryId(null);
  };

  // Validate active selections against current data
  useEffect(() => {
    if (selectedProjectId) {
      const projectExists = data.projects.some((p) => p.id === selectedProjectId);
      if (!projectExists) {
        setSelectedProjectId(null);
        setSelectedSprintId(null);
      }
    }
  }, [data.projects, selectedProjectId]);

  useEffect(() => {
    if (selectedSprintId) {
      const sprintExists = data.sprints.some(
        (s) => s.id === selectedSprintId && s.projectId === selectedProjectId
      );
      if (!sprintExists) {
        setSelectedSprintId(null);
      }
    }
  }, [data.sprints, selectedSprintId, selectedProjectId]);

  useEffect(() => {
    if (selectedStoryId) {
      const storyExists = data.stories.some((s) => s.id === selectedStoryId);
      if (!storyExists) {
        setSelectedStoryId(null);
      }
    }
  }, [data.stories, selectedStoryId]);

  // Derived properties
  const activeProject = data.projects.find((p) => p.id === selectedProjectId);
  const activeSprint = data.sprints.find((s) => s.id === selectedSprintId);
  const activeStory = data.stories.find((s) => s.id === selectedStoryId);

  // Sprints in current project
  const projectSprints = selectedProjectId
    ? data.sprints.filter((s) => s.projectId === selectedProjectId)
    : [];

  // Stories in current sprint
  const sprintStories = selectedSprintId
    ? data.stories.filter((s) => s.sprintId === selectedSprintId)
    : [];

  // Comments map (count of comments per story)
  const commentsCountMap: Record<string, number> = {};
  data.stories.forEach((story) => {
    commentsCountMap[story.id] = data.comments.filter((c) => c.storyId === story.id).length;
  });

  // Automatically select the first sprint when a project is selected
  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setSelectedStoryId(null);
    const projectSprintsList = data.sprints.filter((s) => s.projectId === projectId);
    if (projectSprintsList.length > 0) {
      setSelectedSprintId(projectSprintsList[0].id);
    } else {
      setSelectedSprintId(null);
    }
  };

  const handleCreateProject = (name: string) => {
    const newProj = addProject(name);
    if (newProj) {
      setSelectedProjectId(newProj.id);
      setSelectedSprintId(null);
    }
  };

  const handleCreateSprint = (name: string, start?: string, end?: string) => {
    if (!selectedProjectId) return;
    const newSprint = addSprint(selectedProjectId, name, start, end);
    if (newSprint) {
      setSelectedSprintId(newSprint.id);
    }
  };

  const handleAddStory = (title: string, jiraLink: string, description: string, status: any) => {
    if (!selectedSprintId) return;
    addStory(selectedSprintId, title, jiraLink, description, status);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 flex flex-col font-sans transition-colors" id="app-root">
      {/* Top Main Navigation Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800 shrink-0 px-6 py-4.5 transition-colors" id="app-header">
        <div className="max-w-[1800px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-100 font-sans">
                  Story Deck
                </h1>
                <span className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700" />
                <span className="text-[10px] bg-indigo-50 dark:bg-indigo-500/10 text-indigo-750 dark:text-indigo-300 font-mono font-bold px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-500/30 uppercase tracking-wider">
                  Board Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-wide mt-0.5">Jira sprint deck & pipeline controller</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Live Stats Indicators */}
            <div className="hidden lg:flex items-center gap-3 mr-2 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <strong className="text-slate-700 dark:text-slate-200 font-extrabold">{data.projects.length}</strong> Projects
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
              <span className="flex items-center gap-1">
                <strong className="text-slate-700 dark:text-slate-200 font-extrabold">{data.sprints.length}</strong> Sprints
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
              <span className="flex items-center gap-1">
                <strong className="text-slate-700 dark:text-slate-200 font-extrabold">{data.stories.length}</strong> Tickets
              </span>
            </div>

            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-xl transition"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              id="theme-toggle-btn"
            >
              {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{theme === "dark" ? "Light" : "Dark"}</span>
            </button>

            {/* Storage quick status badge */}
            {storageMode !== "uninitialized" && (
              <div className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 rounded-xl border font-mono font-bold uppercase tracking-wider ${
                storageMode === "file" 
                  ? "bg-emerald-50/55 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border-emerald-150 dark:border-emerald-500/30" 
                  : "bg-indigo-50/55 dark:bg-indigo-500/10 text-indigo-800 dark:text-indigo-400 border-indigo-150 dark:border-indigo-500/30"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${storageMode === "file" ? "bg-emerald-500" : "bg-indigo-500 animate-pulse"}`} />
                <span>{storageMode === "file" ? "Disk Connected" : "Browser Saved"}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Persistence / Mode Config Banner */}
      <StorageBanner
        storageMode={storageMode}
        fileName={fileName}
        fileSupport={fileSupport}
        needsFilePermission={needsFilePermission}
        onSelectFile={selectExistingFile}
        onCreateFile={createNewFile}
        onUseLocalStorage={useBrowserStorage}
        onReconnectFile={reconnectFile}
        onExport={exportBackupData}
        onImport={importBackupData}
      />

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-red-500/10 border-b border-red-500/20 px-6 py-2.5 text-xs text-red-600 dark:text-red-400 flex items-center justify-between"
            id="error-notification"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold ml-4"
              id="clear-error-btn"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading state / Initialization dialog */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-3 bg-slate-50 dark:bg-slate-950" id="loading-spinner">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading work environment...</p>
        </div>
      ) : storageMode === "uninitialized" ? (
        /* Landing/Setup Overlay to pick storage on first run */
        <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950" id="landing-setup-view">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 text-center">
            <div className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/30 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto">
              <Database className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold font-display text-slate-800 dark:text-slate-100">Initialize Your Tracker</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                Story Deck is a private local utility. Choose how you want to save and access your projects, sprints, cards, and updates.
              </p>
            </div>

            <div className="space-y-2.5 text-left">
              {fileSupport ? (
                <>
                  <button
                    onClick={createNewFile}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-3 px-4 rounded-xl shadow-md shadow-indigo-100 transition flex items-center justify-between group"
                    id="setup-create-file"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileJson className="w-4.5 h-4.5" />
                      <span>Create new local JSON file</span>
                    </div>
                    <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition" />
                  </button>

                  <button
                    onClick={selectExistingFile}
                    className="w-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs py-3 px-4 rounded-xl transition flex items-center justify-between shadow-sm"
                    id="setup-open-file"
                  >
                    <div className="flex items-center gap-2.5">
                      <FolderKanban className="w-4.5 h-4.5 text-slate-500 dark:text-slate-400" />
                      <span>Open existing JSON file</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </>
              ) : (
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 p-3 rounded-lg text-xs text-amber-700 dark:text-amber-400 leading-normal mb-2 flex gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                  <span>
                    Your browser does not support standard Local File Access. Fall back to standard browser storage below.
                  </span>
                </div>
              )}

              <button
                onClick={useBrowserStorage}
                className="w-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs py-3 px-4 rounded-xl transition flex items-center justify-between shadow-sm"
                id="setup-use-local"
              >
                <div className="flex items-center gap-2.5">
                  <Database className="w-4.5 h-4.5 text-indigo-500" />
                  <span>Use browser local storage (No disk setup)</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="text-[10px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Full backups can be exported manually at any time.</span>
            </div>
          </div>
        </div>
      ) : (
        /* Main Workspace Layout */
        <main className="flex-1 max-w-[1800px] w-full mx-auto py-6 px-2 sm:px-3 flex flex-col md:flex-row gap-6 bg-slate-50 dark:bg-slate-950" id="workspace-main">
          {/* Sidebar Area: Project selection and details */}
          <aside className="w-full md:w-64 lg:w-72 shrink-0 flex flex-col gap-6" id="workspace-sidebar">
            <ProjectList
              projects={data.projects}
              sprints={data.sprints}
              stories={data.stories}
              activeProjectId={selectedProjectId}
              onSelectProject={handleSelectProject}
              onCreateProject={handleCreateProject}
              onUpdateProject={updateProject}
              onDeleteProject={deleteProject}
            />
          </aside>

          {/* Active Workspace Board Area */}
          <section className="flex-1 flex flex-col gap-6 min-w-0" id="workspace-content">
            {/* Breadcrumb Navigation bar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-4.5 py-3 rounded-2xl flex items-center gap-2 text-xs shrink-0 shadow-sm shadow-slate-100/50 dark:shadow-none" id="breadcrumbs-nav">
              <button
                onClick={() => {
                  setSelectedProjectId(null);
                  setSelectedSprintId(null);
                }}
                className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold flex items-center gap-1.5 transition"
                id="breadcrumb-home"
              >
                <Home className="w-3.5 h-3.5" />
                Home
              </button>

              {activeProject && (
                <>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                  <button
                    onClick={() => setSelectedSprintId(null)}
                    className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition max-w-[120px] truncate"
                    id={`breadcrumb-project-${activeProject.id}`}
                  >
                    {activeProject.name}
                  </button>
                </>
              )}

              {activeSprint && (
                <>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                  <span className="text-slate-800 dark:text-slate-100 font-bold max-w-[140px] truncate">
                    {activeSprint.name}
                  </span>
                </>
              )}
            </div>

            {/* Dynamic View panels based on selections */}
            {!selectedProjectId ? (
              /* Welcome/Project Select Help Page */
              <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center p-8 text-center shadow-sm shadow-slate-100/50 dark:shadow-none" id="no-project-welcome">
                <FolderKanban className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4 stroke-[1.5]" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Welcome to Story Deck</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5 max-w-sm mx-auto leading-relaxed">
                  To begin managing your work columns, select an existing project from the sidebar list, or click the <strong className="text-slate-700 dark:text-slate-200 font-bold inline-flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 px-1 rounded ml-0.5 mr-0.5"><Plus className="w-3 h-3" /></strong> icon to create a new one.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 max-w-md w-full">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200/60 dark:border-slate-700 rounded-xl text-left shadow shadow-slate-100/10 dark:shadow-none">
                    <span className="text-[9px] font-extrabold text-indigo-600 dark:text-indigo-400 font-mono tracking-wider block uppercase">
                      ORGANIZATION
                    </span>
                    <h5 className="text-xs font-bold text-slate-850 dark:text-slate-100 mt-1">Multi-Sprint Boards</h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Isolate releases, milestones, or standard two-week work iterations with independent Kanban metrics.
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200/60 dark:border-slate-700 rounded-xl text-left shadow shadow-slate-100/10 dark:shadow-none">
                    <span className="text-[9px] font-extrabold text-indigo-600 dark:text-indigo-400 font-mono tracking-wider block uppercase">
                      PERSISTENCE
                    </span>
                    <h5 className="text-xs font-bold text-slate-850 dark:text-slate-100 mt-1">Direct File Sync</h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Data is saved straight to a local JSON file on your machine. Highly secure and completely private.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Inside active project workspace panel */
              <div className="flex flex-col gap-6" id="project-workspace">
                {/* Sprint selection tabs */}
                <SprintTabs
                  sprints={projectSprints}
                  stories={data.stories}
                  activeSprintId={selectedSprintId}
                  onSelectSprint={(id) => {
                    setSelectedSprintId(id);
                    setSelectedStoryId(null);
                  }}
                  onCreateSprint={handleCreateSprint}
                  onUpdateSprint={updateSprint}
                  onDeleteSprint={deleteSprint}
                />

                {/* Sprints Board or Empty board instructions */}
                {selectedSprintId && activeSprint ? (
                  <div className="space-y-4" id="active-sprint-board">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-display">
                          {activeSprint.name} {viewMode === "board" ? "Kanban Board" : "Tickets"}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                          {viewMode === "board"
                            ? "Drag and drop cards between status lanes to update your progress. Click any card to log comments."
                            : "Browse tickets in a list and open any ticket in the detail panel on the right."}
                        </p>
                      </div>

                      {/* Board / List view toggle */}
                      <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-0.5 rounded-xl shrink-0 self-start sm:self-auto">
                        <button
                          onClick={() => handleViewModeChange("board")}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition ${
                            viewMode === "board"
                              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                          }`}
                          title="Classic kanban board"
                          id="view-mode-board-btn"
                        >
                          <LayoutGrid className="w-3.5 h-3.5" />
                          Board
                        </button>
                        <button
                          onClick={() => handleViewModeChange("list")}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition ${
                            viewMode === "list"
                              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                          }`}
                          title="Jira-style list with detail panel"
                          id="view-mode-list-btn"
                        >
                          <List className="w-3.5 h-3.5" />
                          List
                        </button>
                      </div>
                    </div>

                    {viewMode === "board" ? (
                      <KanbanBoard
                        stories={sprintStories}
                        commentsCount={commentsCountMap}
                        onSelectStory={setSelectedStoryId}
                        onAddStory={handleAddStory}
                        onMoveStory={moveStory}
                        onDeleteStory={deleteStory}
                      />
                    ) : (
                      <SplitView
                        stories={sprintStories}
                        comments={data.comments}
                        commentsCount={commentsCountMap}
                        selectedStoryId={selectedStoryId}
                        sprintName={activeSprint.name}
                        onSelectStory={setSelectedStoryId}
                        onCloseStory={() => setSelectedStoryId(null)}
                        onAddStory={handleAddStory}
                        onUpdateStory={updateStory}
                        onAddComment={addComment}
                        onDeleteStory={deleteStory}
                      />
                    )}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center p-12 text-center shadow-sm shadow-slate-100/50 dark:shadow-none" id="no-sprint-selected-welcome">
                    <Layers className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3 stroke-[1.5]" />
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Select a Sprint</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5 max-w-xs mx-auto leading-relaxed">
                      This project has {projectSprints.length} sprint{projectSprints.length === 1 ? "" : "s"}.
                      Choose a sprint from the tab list above or create a new one to access your interactive Kanban board.
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>
        </main>
      )}

      {/* Story detail modal */}
      <AnimatePresence>
        {viewMode === "board" && selectedStoryId && activeStory && (
          <StoryModal
            story={activeStory}
            comments={data.comments}
            onClose={() => setSelectedStoryId(null)}
            onUpdateStory={updateStory}
            onAddComment={addComment}
          />
        )}
      </AnimatePresence>

      {/* Humble Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200/65 dark:border-slate-800 py-4 px-6 text-center text-[10px] text-slate-400 dark:text-slate-500 shrink-0 font-sans mt-auto" id="app-footer">
        <div className="max-w-[1800px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-medium">
            Jira Story Tracker © 2026. Made with ❤️ for high performance offline-first workflows.
          </span>
          <div className="flex items-center gap-3 font-medium">
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3 text-indigo-500" />
              localStorage fallback enabled
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <FileJson className="w-3 h-3 text-emerald-500" />
              File System Access supported
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
