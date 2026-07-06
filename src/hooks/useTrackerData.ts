import { useState, useEffect, useRef, useCallback } from "react";
import { AppData, INITIAL_DATA, Project, Sprint, Story, Comment, StoryStatus } from "../types";
import {
  isFileSystemAccessSupported,
  readDataFromFile,
  writeDataToFile,
  getActiveFileHandle,
  setActiveFileHandle,
  exportDataAsJSON,
} from "../lib/persistence";

export function useTrackerData() {
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [storageMode, setStorageMode] = useState<"file" | "local" | "uninitialized">("uninitialized");
  const [fileName, setFileName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fileSupport = isFileSystemAccessSupported();

  // Ref to prevent initial blank write during state initialization
  const isInitialLoad = useRef(true);
  // Ref to hold the current data for debounced saving
  const currentDataRef = useRef<AppData>(INITIAL_DATA);
  currentDataRef.current = data;

  // Initialize: Check if we have standard localStorage backup or can auto-load
  useEffect(() => {
    const initStorage = () => {
      try {
        const localDataString = localStorage.getItem("jira_tracker_local_data");
        if (localDataString) {
          const parsed = JSON.parse(localDataString);
          const validated: AppData = {
            projects: Array.isArray(parsed.projects) ? parsed.projects : [],
            sprints: Array.isArray(parsed.sprints) ? parsed.sprints : [],
            stories: Array.isArray(parsed.stories) ? parsed.stories : [],
            comments: Array.isArray(parsed.comments) ? parsed.comments : [],
          };
          setData(validated);
          setStorageMode("local");
          setFileName("browser_storage");
        } else {
          // Keep uninitialized to show the landing/picker modal
          setStorageMode("uninitialized");
        }
      } catch (err) {
        console.error("Failed to load local storage content:", err);
        setStorageMode("uninitialized");
      } finally {
        setLoading(false);
      }
    };
    initStorage();
  }, []);

  // Debounced auto-save effect
  useEffect(() => {
    if (storageMode === "uninitialized" || loading) {
      return;
    }

    // Skip the very first run which happens on component mount/initial load
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    const saveData = async () => {
      try {
        if (storageMode === "local") {
          localStorage.setItem("jira_tracker_local_data", JSON.stringify(currentDataRef.current));
        } else if (storageMode === "file") {
          const handle = getActiveFileHandle();
          if (handle) {
            await writeDataToFile(handle, currentDataRef.current);
          } else {
            // File handle lost? Fallback to local
            setStorageMode("local");
            setFileName("browser_storage");
            localStorage.setItem("jira_tracker_local_data", JSON.stringify(currentDataRef.current));
            setError("Active file handle lost. Reverted to browser storage.");
          }
        }
      } catch (err: any) {
        console.error("Auto-save failed:", err);
        setError(`Auto-save failed: ${err.message || "Unknown error"}`);
      }
    };

    const debounceTimer = setTimeout(() => {
      saveData();
    }, 500); // 500ms debounce as requested

    return () => clearTimeout(debounceTimer);
  }, [data, storageMode, loading]);

  // Actions
  const createNewFile = useCallback(async () => {
    setError(null);
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: "jira-tracker-data.json",
        types: [
          {
            description: "JSON File",
            accept: {
              "application/json": [".json"],
            },
          },
        ],
      });
      setActiveFileHandle(handle);
      setFileName(handle.name);
      setData(INITIAL_DATA);
      setStorageMode("file");
      isInitialLoad.current = true; // resets initial load skip
      await writeDataToFile(handle, INITIAL_DATA);
    } catch (err: any) {
      console.warn("File creation cancelled or failed:", err);
      if (err.name !== "AbortError") {
        setError(`Could not create file: ${err.message || "Access denied in iframe"}`);
      }
    }
  }, []);

  const selectExistingFile = useCallback(async () => {
    setError(null);
    try {
      const [handle] = await (window as any).showOpenFilePicker({
        types: [
          {
            description: "JSON File",
            accept: {
              "application/json": [".json"],
            },
          },
        ],
      });
      setActiveFileHandle(handle);
      setFileName(handle.name);
      setLoading(true);
      const loadedData = await readDataFromFile(handle);
      setData(loadedData);
      setStorageMode("file");
      isInitialLoad.current = true; // resets initial load skip
    } catch (err: any) {
      console.warn("File selection cancelled or failed:", err);
      if (err.name !== "AbortError") {
        setError(`Could not open file: ${err.message || "Access denied in iframe"}`);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const useBrowserStorage = useCallback(() => {
    setError(null);
    setLoading(true);
    try {
      const localDataString = localStorage.getItem("jira_tracker_local_data");
      if (localDataString) {
        const parsed = JSON.parse(localDataString);
        setData({
          projects: Array.isArray(parsed.projects) ? parsed.projects : [],
          sprints: Array.isArray(parsed.sprints) ? parsed.sprints : [],
          stories: Array.isArray(parsed.stories) ? parsed.stories : [],
          comments: Array.isArray(parsed.comments) ? parsed.comments : [],
        });
      } else {
        setData(INITIAL_DATA);
        localStorage.setItem("jira_tracker_local_data", JSON.stringify(INITIAL_DATA));
      }
      setStorageMode("local");
      setFileName("browser_storage");
      isInitialLoad.current = true; // resets initial load skip
    } catch (err) {
      console.error("Local storage trigger error:", err);
      setError("Failed to initialize browser storage.");
    } finally {
      setLoading(false);
    }
  }, []);

  const addProject = useCallback((name: string) => {
    if (!name.trim()) return;
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      projects: [...prev.projects, newProject],
    }));
    return newProject;
  }, []);

  const updateProject = useCallback((projectId: string, name: string) => {
    if (!name.trim()) return;
    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((project) =>
        project.id === projectId ? { ...project, name: name.trim() } : project
      ),
    }));
  }, []);

  const deleteProject = useCallback((projectId: string) => {
    setData((prev) => {
      // Find all sprint IDs associated with this project
      const projectSprintIds = prev.sprints
        .filter((sprint) => sprint.projectId === projectId)
        .map((sprint) => sprint.id);

      // Find all story IDs in those sprints
      const projectStoryIds = prev.stories
        .filter((story) => projectSprintIds.includes(story.sprintId))
        .map((story) => story.id);

      return {
        ...prev,
        projects: prev.projects.filter((project) => project.id !== projectId),
        sprints: prev.sprints.filter((sprint) => sprint.projectId !== projectId),
        stories: prev.stories.filter((story) => !projectSprintIds.includes(story.sprintId)),
        comments: prev.comments.filter((comment) => !projectStoryIds.includes(comment.storyId)),
      };
    });
  }, []);

  const addSprint = useCallback((projectId: string, name: string, startDate?: string, endDate?: string) => {
    if (!name.trim()) return;
    const newSprint: Sprint = {
      id: crypto.randomUUID(),
      projectId,
      name: name.trim(),
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      sprints: [...prev.sprints, newSprint],
    }));
    return newSprint;
  }, []);

  const updateSprint = useCallback((sprintId: string, updates: Partial<Sprint>) => {
    setData((prev) => ({
      ...prev,
      sprints: prev.sprints.map((sprint) =>
        sprint.id === sprintId
          ? {
              ...sprint,
              ...updates,
              name: updates.name ? updates.name.trim() : sprint.name,
            }
          : sprint
      ),
    }));
  }, []);

  const deleteSprint = useCallback((sprintId: string) => {
    setData((prev) => {
      // Find all story IDs associated with this sprint
      const sprintStoryIds = prev.stories
        .filter((story) => story.sprintId === sprintId)
        .map((story) => story.id);

      return {
        ...prev,
        sprints: prev.sprints.filter((sprint) => sprint.id !== sprintId),
        stories: prev.stories.filter((story) => story.sprintId !== sprintId),
        comments: prev.comments.filter((comment) => !sprintStoryIds.includes(comment.storyId)),
      };
    });
  }, []);

  const addStory = useCallback((
    sprintId: string,
    title: string,
    jiraLink: string,
    description: string = "",
    status: StoryStatus = "todo"
  ) => {
    if (!title.trim() || !jiraLink.trim()) return;
    const newStory: Story = {
      id: crypto.randomUUID(),
      sprintId,
      title: title.trim(),
      jiraLink: jiraLink.trim(),
      description: description.trim(),
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      stories: [...prev.stories, newStory],
    }));
    return newStory;
  }, []);

  const updateStory = useCallback((storyId: string, updates: Partial<Story>) => {
    setData((prev) => ({
      ...prev,
      stories: prev.stories.map((story) =>
        story.id === storyId
          ? { ...story, ...updates, updatedAt: new Date().toISOString() }
          : story
      ),
    }));
  }, []);

  const deleteStory = useCallback((storyId: string) => {
    setData((prev) => ({
      ...prev,
      stories: prev.stories.filter((story) => story.id !== storyId),
      comments: prev.comments.filter((comment) => comment.storyId !== storyId),
    }));
  }, []);

  const addComment = useCallback((storyId: string, text: string) => {
    if (!text.trim()) return;
    const newComment: Comment = {
      id: crypto.randomUUID(),
      storyId,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      comments: [...prev.comments, newComment],
    }));
    return newComment;
  }, []);

  const moveStory = useCallback((storyId: string, targetStatus: StoryStatus) => {
    setData((prev) => ({
      ...prev,
      stories: prev.stories.map((story) =>
        story.id === storyId
          ? { ...story, status: targetStatus, updatedAt: new Date().toISOString() }
          : story
      ),
    }));
  }, []);

  const importBackupData = useCallback((newData: AppData) => {
    setData(newData);
    setError(null);
    // Writes will automatically follow due to data dependencies
  }, []);

  const exportBackupData = useCallback(() => {
    exportDataAsJSON(currentDataRef.current, "jira-tracker-backup.json");
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
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
  };
}
