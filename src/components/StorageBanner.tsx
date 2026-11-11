//@ts-nocheck
import { useRef, ChangeEvent } from "react";
import { AppData } from "../types";
import { parseImportedJSON } from "../lib/persistence";
import {
  Database,
  FileJson,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
} from "lucide-react";

interface StorageBannerProps {
  storageMode: "file" | "local" | "uninitialized";
  fileName: string;
  fileSupport: boolean;
  needsFilePermission?: boolean;
  onSelectFile: () => void;
  onCreateFile: () => void;
  onUseLocalStorage: () => void;
  onReconnectFile?: () => void;
  onExport: () => void;
  onImport: (data: AppData) => void;
}

export function StorageBanner({
  storageMode,
  fileName,
  fileSupport,
  needsFilePermission = false,
  onSelectFile,
  onCreateFile,
  onUseLocalStorage,
  onReconnectFile,
  onExport,
  onImport,
}: StorageBannerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const importedData = parseImportedJSON(text);
        if (confirm("Are you sure you want to import this data? It will completely overwrite your current workflow state.")) {
          onImport(importedData);
        }
      } catch (err: any) {
        alert(`Failed to import JSON file. Please make sure it is a valid backup.\nError: ${err.message}`);
      }
    };
    reader.readAsText(file);
    // Reset file input value
    e.target.value = "";
  };

  const openAppInNewTab = () => {
    window.open(window.location.href, "_blank");
  };

  return (
    <div className="bg-slate-100 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 px-4 py-3 text-slate-700 dark:text-slate-300" id="storage-banner">
      <div className="max-w-[1800px] mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs font-sans">
        {/* Left Side Status */}
        <div className="flex items-center gap-2">
          {storageMode === "file" ? (
            needsFilePermission ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex items-center gap-2 text-amber-850 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-200/60 dark:border-amber-500/30">
                  <FileJson className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>
                    File saved: <strong className="font-mono text-slate-900 dark:text-slate-100 font-bold">{fileName}</strong> — reconnect to resume saving
                  </span>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                </div>
                {onReconnectFile && (
                  <button
                    onClick={onReconnectFile}
                    className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg font-semibold border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-1.5 transition self-start"
                    id="reconnect-file-btn"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Reconnect File
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-500/30">
                <FileJson className="w-4 h-4 shrink-0 text-indigo-500" />
                <span>
                  Connected to file: <strong className="font-mono text-slate-900 dark:text-slate-100 font-bold">{fileName}</strong>
                </span>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              </div>
            )
          ) : storageMode === "local" ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex items-center gap-2 text-amber-850 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-200/60 dark:border-amber-500/30">
                <Database className="w-4 h-4 shrink-0 text-amber-600" />
                <span>
                  Using browser storage (<strong className="font-mono text-slate-900 dark:text-slate-100 font-bold">localStorage</strong>)
                </span>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              </div>
              <span className="text-slate-500 dark:text-slate-400">
                {!fileSupport ? (
                  "File System API not supported in this browser."
                ) : (
                  <span className="flex items-center gap-1">
                    Iframe sandbox may block disk saving.
                    <button
                      onClick={openAppInNewTab}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 underline font-semibold flex items-center gap-0.5"
                      id="open-new-tab-btn"
                    >
                      Open in standard tab
                      <ExternalLink className="w-3 h-3" />
                    </button>
                    to use local file storage.
                  </span>
                )}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Database className="w-4 h-4 animate-pulse text-slate-400" />
              <span>Initializing storage...</span>
            </div>
          )}
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* File System Picker Trigger (only if supported) */}
          {fileSupport && (
            <>
              <button
                onClick={onSelectFile}
                className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg font-semibold border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-1.5 transition"
                title="Select a local JSON file to read and write directly"
                id="select-file-btn"
              >
                <FileJson className="w-3.5 h-3.5 text-slate-500" />
                Open JSON File
              </button>
              <button
                onClick={onCreateFile}
                className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg font-semibold border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-1.5 transition"
                title="Create a new local JSON file"
                id="create-file-btn"
              >
                Create JSON File
              </button>
            </>
          )}

          {storageMode === "file" && (
            <button
              onClick={onUseLocalStorage}
              className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg font-semibold border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-1.5 transition"
              title="Switch back to standard browser storage"
              id="switch-local-btn"
            >
              <Database className="w-3.5 h-3.5 text-slate-500" />
              Use Browser Storage
            </button>
          )}

          <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

          {/* Backup Import/Export triggers (always active) */}
          <button
            onClick={onExport}
            className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg font-semibold border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-1.5 transition"
            title="Download full backup file to your computer"
            id="export-backup-btn"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            Backup JSON
          </button>

          <button
            onClick={handleImportClick}
            className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg font-semibold border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-1.5 transition"
            title="Load workspace data from a downloaded backup file"
            id="import-backup-btn"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-600" />
            Restore JSON
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileChange}
            id="hidden-import-file-input"
          />
        </div>
      </div>
    </div>
  );
}
