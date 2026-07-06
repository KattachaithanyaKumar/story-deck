import { AppData, INITIAL_DATA } from "../types";

// Keep track of the active FileSystemFileHandle in-memory
let fileHandle: FileSystemFileHandle | null = null;

export function getActiveFileHandle(): FileSystemFileHandle | null {
  return fileHandle;
}

export function setActiveFileHandle(handle: FileSystemFileHandle | null) {
  fileHandle = handle;
}

/**
 * Checks if the browser supports the File System Access API.
 */
export function isFileSystemAccessSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "showOpenFilePicker" in window &&
    "showSaveFilePicker" in window
  );
}

/**
 * Read and parse data from a FileSystemFileHandle
 */
export async function readDataFromFile(handle: FileSystemFileHandle): Promise<AppData> {
  const file = await handle.getFile();
  const text = await file.text();
  if (!text.trim()) {
    return INITIAL_DATA;
  }
  const parsed = JSON.parse(text);
  // Simple validation to ensure it has correct properties
  return {
    projects: Array.isArray(parsed.projects) ? parsed.projects : [],
    sprints: Array.isArray(parsed.sprints) ? parsed.sprints : [],
    stories: Array.isArray(parsed.stories) ? parsed.stories : [],
    comments: Array.isArray(parsed.comments) ? parsed.comments : [],
  };
}

/**
 * Write data back to a FileSystemFileHandle
 */
export async function writeDataToFile(handle: FileSystemFileHandle, data: AppData): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(JSON.stringify(data, null, 2));
  await writable.close();
}

/**
 * Trigger manual backup export by downloading a JSON file in the browser
 */
export function exportDataAsJSON(data: AppData, fileName: string = "jira-tracker-backup.json") {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parse uploaded JSON file text into AppData
 */
export function parseImportedJSON(text: string): AppData {
  const parsed = JSON.parse(text);
  return {
    projects: Array.isArray(parsed.projects) ? parsed.projects : [],
    sprints: Array.isArray(parsed.sprints) ? parsed.sprints : [],
    stories: Array.isArray(parsed.stories) ? parsed.stories : [],
    comments: Array.isArray(parsed.comments) ? parsed.comments : [],
  };
}
