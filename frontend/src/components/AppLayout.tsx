import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, errorMessage } from "../api/client";
import { AppUiContext, type UploadTask, type ViewMode } from "./appUi";
import SideNav from "./SideNav";
import Topbar from "./Topbar";
import UploadTray from "./UploadTray";

export default function AppLayout() {
  const qc = useQueryClient();
  const [view, setView] = useState<ViewMode>(
    (localStorage.getItem("cloudbox.view") as ViewMode) || "grid"
  );
  const [search, setSearch] = useState("");
  const [uploads, setUploads] = useState<UploadTask[]>([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  function setViewPersist(v: ViewMode) {
    localStorage.setItem("cloudbox.view", v);
    setView(v);
  }

  function dismissUpload(id: string) {
    setUploads((u) => u.filter((t) => t.id !== id));
  }

  function startUpload(files: File[], folderId: number | null) {
    files.forEach((file) => {
      const id = `${file.name}-${Date.now()}-${Math.random()}`;
      setUploads((u) => [
        ...u,
        { id, name: file.name, progress: 0, status: "uploading" },
      ]);

      const form = new FormData();
      form.append("file", file);
      if (folderId != null) form.append("folderId", String(folderId));

      api
        .post("/files", form, {
          onUploadProgress: (e) => {
            const pct = e.total ? Math.round((e.loaded / e.total) * 100) : 0;
            setUploads((u) =>
              u.map((t) => (t.id === id ? { ...t, progress: pct } : t))
            );
          },
        })
        .then(() => {
          setUploads((u) =>
            u.map((t) => (t.id === id ? { ...t, progress: 100, status: "done" } : t))
          );
          qc.invalidateQueries({ queryKey: ["contents"] });
          qc.invalidateQueries({ queryKey: ["me"] });
          qc.invalidateQueries({ queryKey: ["recent"] });
          setTimeout(() => dismissUpload(id), 2500);
        })
        .catch((err) => {
          setUploads((u) =>
            u.map((t) => (t.id === id ? { ...t, status: "error" } : t))
          );
          toast.error(`${file.name}: ${errorMessage(err, "Upload failed")}`);
        });
    });
  }

  return (
    <AppUiContext.Provider
      value={{ view, setView: setViewPersist, search, setSearch, uploads, startUpload, dismissUpload }}
    >
      <div className="flex h-screen overflow-hidden">
        <SideNav mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onOpenNav={() => setMobileNavOpen(true)} />
          <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
            <Outlet />
          </main>
        </div>
      </div>
      <UploadTray />
    </AppUiContext.Provider>
  );
}
