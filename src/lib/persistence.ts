import { AppData, INITIAL_DATA } from "../types";

// Keep track of the active FileSystemFileHandle in-memory
let fileHandle: FileSystemFileHandle | null = null;

const HANDLE_DB_NAME = "story-deck-storage";
const HANDLE_DB_VERSION = 1;
const HANDLE_STORE_NAME = "handles";
const HANDLE_KEY = "active-file";

export function getActiveFileHandle(): FileSystemFileHandle | null {
  return fileHandle;
}

export function setActiveFileHandle(handle: FileSystemFileHandle | null) {
  fileHandle = handle;
}

function openHandleDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(HANDLE_DB_NAME, HANDLE_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(HANDLE_STORE_NAME)) {
        db.createObjectStore(HANDLE_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Persist the active file handle in IndexedDB so it survives page refreshes.
 * FileSystemFileHandle objects are structured-cloneable and can be stored there.
 */
export async function saveFileHandle(handle: FileSystemFileHandle): Promise<void> {
  try {
    const db = await openHandleDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(HANDLE_STORE_NAME, "readwrite");
      transaction.objectStore(HANDLE_STORE_NAME).put(handle, HANDLE_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
  } catch (err) {
    console.warn("Could not persist file handle:", err);
  }
}

export async function loadFileHandle(): Promise<FileSystemFileHandle | null> {
  try {
    const db = await openHandleDB();
    const handle = await new Promise<FileSystemFileHandle | null>((resolve, reject) => {
      const transaction = db.transaction(HANDLE_STORE_NAME, "readonly");
      const request = transaction.objectStore(HANDLE_STORE_NAME).get(HANDLE_KEY);
      request.onsuccess = () => resolve((request.result as FileSystemFileHandle) || null);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return handle;
  } catch (err) {
    console.warn("Could not load persisted file handle:", err);
    return null;
  }
}

export async function clearFileHandle(): Promise<void> {
  try {
    const db = await openHandleDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(HANDLE_STORE_NAME, "readwrite");
      transaction.objectStore(HANDLE_STORE_NAME).delete(HANDLE_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
  } catch (err) {
    console.warn("Could not clear persisted file handle:", err);
  }
}

/**
 * Check (and optionally request) read/write permission for a stored handle.
 */
export async function verifyFilePermission(
  handle: FileSystemFileHandle,
  requestAccess = false
): Promise<boolean> {
  const permissions = handle as any;
  const options = { mode: "readwrite" as const };

  try {
    if (typeof permissions.queryPermission === "function") {
      if ((await permissions.queryPermission(options)) === "granted") {
        return true;
      }
    }

    if (requestAccess && typeof permissions.requestPermission === "function") {
      return (await permissions.requestPermission(options)) === "granted";
    }
  } catch (err) {
    console.warn("File permission check failed:", err);
  }

  return false;
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
