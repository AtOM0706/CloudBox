import { useMemo, useState } from "react";
import { Folder as FolderIcon, Home, Search } from "lucide-react";
import { toast } from "sonner";
import { errorMessage } from "../api/client";
import { useAllFolders, useBulkAction } from "../api/hooks";
import type { AnyItem } from "../api/types";
import { cn } from "../lib/cn";
import Modal from "./Modal";

export default function MoveToFolderDialog({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  item: AnyItem | null;
}) {
  const { data: folders = [], isLoading } = useAllFolders();
  const bulk = useBulkAction();
  const [query, setQuery] = useState("");

  // The folder this item currently lives in (so we can flag it as the current location).
  const currentParentId =
    item?.type === "file" ? item.folderId : item?.parentFolderId ?? null;

  const choices = useMemo(() => {
    const q = query.trim().toLowerCase();
    return folders
      // A folder can't be moved into itself.
      .filter((f) => !(item?.type === "folder" && f.id === item.id))
      .filter((f) => (q ? f.name.toLowerCase().includes(q) : true));
  }, [folders, query, item]);

  function move(targetFolderId: number | null) {
    if (!item) return;
    if (targetFolderId === currentParentId) {
      onOpenChange(false);
      return; // already there — nothing to do
    }
    bulk.mutate(
      {
        action: "MOVE",
        fileIds: item.type === "file" ? [item.id] : [],
        folderIds: item.type === "folder" ? [item.id] : [],
        targetFolderId,
      },
      {
        onSuccess: () => {
          toast.success(`Moved “${item.name}”`);
          onOpenChange(false);
        },
        onError: (e) => toast.error(errorMessage(e)),
      }
    );
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={item ? `Move “${item.name}” to…` : "Move to folder"}
    >
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search folders…"
            className="input pl-9"
          />
        </div>

        <div className="flex max-h-72 flex-col gap-1 overflow-y-auto">
          {/* Home (root) target */}
          <FolderButton
            label="Home"
            icon={<Home className="h-[18px] w-[18px] text-brand" />}
            current={currentParentId === null}
            disabled={bulk.isPending}
            onClick={() => move(null)}
          />

          {isLoading ? (
            <p className="px-3 py-4 text-sm text-slate-400">Loading folders…</p>
          ) : choices.length === 0 ? (
            <p className="px-3 py-4 text-sm text-slate-400">
              {query ? "No matching folders" : "You don't have any folders yet"}
            </p>
          ) : (
            choices.map((f) => (
              <FolderButton
                key={f.id}
                label={f.name}
                icon={
                  <FolderIcon
                    className="h-[18px] w-[18px] text-amber-500"
                    fill="currentColor"
                  />
                }
                current={currentParentId === f.id}
                disabled={bulk.isPending}
                onClick={() => move(f.id)}
              />
            ))
          )}
        </div>

        <div className="flex justify-end">
          <button type="button" className="btn-ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

function FolderButton({
  label,
  icon,
  current,
  disabled,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  current: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled || current}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
        current
          ? "cursor-default text-slate-400 dark:text-slate-500"
          : "text-slate-700 hover:bg-white/60 dark:text-slate-200 dark:hover:bg-white/10"
      )}
    >
      {icon}
      <span className="flex-1 truncate">{label}</span>
      {current && <span className="text-xs text-slate-400">Current</span>}
    </button>
  );
}
