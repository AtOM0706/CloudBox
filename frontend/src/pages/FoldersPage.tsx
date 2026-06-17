import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FolderPlus, FolderOpen } from "lucide-react";
import { useAllFolders } from "../api/hooks";
import { useAppUi } from "../components/appUi";
import EmptyState from "../components/EmptyState";
import ItemCollection from "../components/ItemCollection";
import NewFolderDialog from "../components/NewFolderDialog";
import { useItemActions } from "../hooks/useItemActions";

export default function FoldersPage() {
  const { view, search } = useAppUi();
  const navigate = useNavigate();
  const { data: folders = [], isLoading } = useAllFolders();
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const { handlers, dialogs } = useItemActions({
    onOpenFolder: (id) => navigate(`/folder/${id}`),
  });

  const q = search.trim().toLowerCase();
  const visible = q
    ? folders.filter((f) => f.name.toLowerCase().includes(q))
    : folders;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Folders
          {!isLoading && (
            <span className="ml-2 text-base font-normal text-slate-400">
              {visible.length}
            </span>
          )}
        </h1>
        <button className="btn-primary" onClick={() => setNewFolderOpen(true)}>
          <FolderPlus className="h-4 w-4" />
          New folder
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">Loading…</p>
      ) : (
        <ItemCollection
          folders={visible}
          files={[]}
          handlers={handlers}
          view={view}
          empty={
            <EmptyState
              icon={FolderOpen}
              title={q ? "No matching folders" : "No folders yet"}
              hint={q ? undefined : "Create a folder to organize your files"}
            />
          }
        />
      )}

      <NewFolderDialog open={newFolderOpen} onOpenChange={setNewFolderOpen} parentId={null} />
      {dialogs}
    </div>
  );
}
