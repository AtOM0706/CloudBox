import { createContext, useContext } from "react";

export type ViewMode = "grid" | "list";

export interface UploadTask {
  id: string;
  name: string;
  progress: number; // 0..100
  status: "uploading" | "done" | "error";
}

export interface AppUi {
  view: ViewMode;
  setView: (v: ViewMode) => void;
  search: string;
  setSearch: (q: string) => void;
  uploads: UploadTask[];
  startUpload: (files: File[], folderId: number | null) => void;
  dismissUpload: (id: string) => void;
}

export const AppUiContext = createContext<AppUi | undefined>(undefined);

export function useAppUi(): AppUi {
  const ctx = useContext(AppUiContext);
  if (!ctx) throw new Error("useAppUi must be used within AppLayout");
  return ctx;
}
