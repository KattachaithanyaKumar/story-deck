import { useState, useEffect, useRef, useCallback } from "react";
import { AppData, INITIAL_DATA, Project, Sprint, Story, Comment, StoryStatus } from "../types";
import {
  isFileSystemAccessSupported,
  readDataFromFile,
  writeDataToFile,
  getActiveFileHandle,
  setActiveFileHandle,
  exportDataAsJSON,
  saveFileHandle,
  loadFileHandle,
  clearFileHandle,
  verifyFilePermission,
} from "../lib/persistence";

const STORAGE_MODE_KEY = "jira_tracker_storage_mode";
const FILE_CACHE_KEY = "jira_tracker_file_cache_data";

function validateAppData(parsed: any): AppData {
  return {
    projects: Array.isArray(parsed?.projects) ? parsed.projects : [],
    sprints: Array.isArray(parsed?.sprints) ? parsed.sprints : [],
    stories: Array.isArray(parsed?.stories) ? parsed.stories : [],
    comments: Array.isArray(parsed?.comments) ? parsed.comments : [],
  };
}

export function useTrackerData() {
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [storageMode, setStorageMode] = useState<"file" | "local" | "uninitialized">("uninitialized");
  const [fileName, setFileName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [needsFilePermission, setNeedsFilePermission] = useState<boolean>(false);

  const fileSupport = isFileSystemAccessSupported();

  // Ref to prevent initial blank write during state initialization
  const isInitialLoad = useRef(true);
  // Ref to hold the current data for debounced saving
  const currentDataRef = useRef<AppData>(INITIAL_DATA);
  currentDataRef.current = data;
  // Whether the current data came from the browser-side file cache
  const hadFileCacheRef = useRef<boolean>(false);
  // Prevent overlapping permission requests
  const reconnectingRef = useRef<boolean>(false);

  // Initialize: restore the previously connected file (or local storage backup)
  useEffect(() => {
    const initStorage = async () => {
      try {
        const savedMode = localStorage.getItem(STORAGE_MODE_KEY);

        if (savedMode === "file") {
          const handle = await loadFileHandle();

          if (handle) {
            setActiveFileHandle(handle);
            setFileName(handle.name);
            setStorageMode("file");

            // Load the cached copy immediately so the UI never appears empty.
            const cached = localStorage.getItem(FILE_CACHE_KEY);
            if (cached) {
              try {
                setData(validateAppData(JSON.parse(cached)));
                hadFileCacheRef.current = true;
              } catch {
                // Ignore corrupt cache.
              }
            }

            const granted = await verifyFilePermission(handle, false);
            if (granted) {
              try {
                const loadedData = await readDataFromFile(handle);
                setData(loadedData);
                localStorage.setItem(FILE_CACHE_KEY, JSON.stringify(loadedData));
                hadFileCacheRef.current = false;
                setNeedsFilePermission(false);
              } catch (readErr) {
                console.warn("Could not read restored file:", readErr);
                setNeedsFilePermission(true);
              }
            } else {
              // Browsers require a user gesture to re-grant file access after reload.
              setNeedsFilePermission(true);
            }
            return;
          }

          // Saved file handle is gone; fall back to local storage.
          localStorage.setItem(STORAGE_MODE_KEY, "local");
        }

        const localDataString = localStorage.getItem("jira_tracker_local_data");
        if (localDataString) {
          setData(validateAppData(JSON.parse(localDataString)));
          setStorageMode("local");
          setFileName("browser_storage");
        } else {
          // Keep uninitialized to show the landing/picker modal
          setStorageMode("uninitialized");
        }
      } catch (err) {
        console.error("Failed to initialize storage:", err);
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
          // Always keep a browser-side mirror so nothing is lost while file
          // permission is being re-granted after a refresh.
          localStorage.setItem(FILE_CACHE_KEY, JSON.stringify(currentDataRef.current));

          const handle = getActiveFileHandle();
          if (handle) {
            await writeDataToFile(handle, currentDataRef.current);
            setNeedsFilePermission(false);
          } else {
            // File handle lost? Fallback to local
            localStorage.setItem(STORAGE_MODE_KEY, "local");
            setStorageMode("local");
            setFileName("browser_storage");
            localStorage.setItem("jira_tracker_local_data", JSON.stringify(currentDataRef.current));
            setError("Active file handle lost. Reverted to browser storage.");
          }
        }
      } catch (err: any) {
        console.error("Auto-save failed:", err);
        if (err?.name === "NotAllowedError") {
          // Permission must be re-granted from a user gesture.
          setNeedsFilePermission(true);
        } else {
          setError(`Auto-save failed: ${err.message || "Unknown error"}`);
        }
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
      await saveFileHandle(handle);
      localStorage.setItem(STORAGE_MODE_KEY, "file");
      localStorage.setItem(FILE_CACHE_KEY, JSON.stringify(INITIAL_DATA));
      hadFileCacheRef.current = false;
      setFileName(handle.name);
      setData(INITIAL_DATA);
      setStorageMode("file");
      setNeedsFilePermission(false);
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
      await saveFileHandle(handle);
      localStorage.setItem(STORAGE_MODE_KEY, "file");
      setFileName(handle.name);
      setLoading(true);
      const loadedData = await readDataFromFile(handle);
      localStorage.setItem(FILE_CACHE_KEY, JSON.stringify(loadedData));
      hadFileCacheRef.current = false;
      setData(loadedData);
      setStorageMode("file");
      setNeedsFilePermission(false);
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
      localStorage.setItem(STORAGE_MODE_KEY, "local");
      clearFileHandle();
      setActiveFileHandle(null);
      hadFileCacheRef.current = false;
      setStorageMode("local");
      setFileName("browser_storage");
      setNeedsFilePermission(false);
      isInitialLoad.current = true; // resets initial load skip
    } catch (err) {
      console.error("Local storage trigger error:", err);
      setError("Failed to initialize browser storage.");
    } finally {
      setLoading(false);
    }
  }, []);

  const reconnectFile = useCallback(async () => {
    if (reconnectingRef.current) return;
    reconnectingRef.current = true;
    setError(null);
    const handle = getActiveFileHandle();
    if (!handle) {
      setError("No saved file connection found. Please open or create a JSON file.");
      reconnectingRef.current = false;
      return;
    }

    try {
      const granted = await verifyFilePermission(handle, true);
      if (!granted) {
        setError("File access was not granted. Please try reconnecting again.");
        return;
      }

      setLoading(true);
      if (hadFileCacheRef.current) {
        // Write the current (cached) data back to the file so edits made while
        // permission was pending are not lost.
        await writeDataToFile(handle, currentDataRef.current);
        localStorage.setItem(FILE_CACHE_KEY, JSON.stringify(currentDataRef.current));
        hadFileCacheRef.current = false;
      } else {
        // No cached copy exists; read the file instead of overwriting it.
        const loadedData = await readDataFromFile(handle);
        localStorage.setItem(FILE_CACHE_KEY, JSON.stringify(loadedData));
        setData(loadedData);
      }
      localStorage.setItem(STORAGE_MODE_KEY, "file");
      setStorageMode("file");
      setFileName(handle.name);
      setNeedsFilePermission(false);
      isInitialLoad.current = true;
    } catch (err: any) {
      console.error("File reconnect failed:", err);
      setError(`Could not reconnect file: ${err.message || "Unknown error"}`);
      setNeedsFilePermission(true);
    } finally {
      reconnectingRef.current = false;
      setLoading(false);
    }
  }, []);

  // After a refresh, browsers need a user gesture to re-grant file access.
  // Try reconnecting automatically on the first interaction.
  useEffect(() => {
    if (!needsFilePermission) return;

    const handleFirstInteraction = () => {
      reconnectFile();
    };

    window.addEventListener("pointerdown", handleFirstInteraction, { once: true });
    return () => window.removeEventListener("pointerdown", handleFirstInteraction);
  }, [needsFilePermission, reconnectFile]);

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
    if (!title.trim()) return;
    const newStory: Story = {
      id: crypto.randomUUID(),
      sprintId,
      title: title.trim(),
      jiraLink: jiraLink?.trim() || "",
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
  };
}
