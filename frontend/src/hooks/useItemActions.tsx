import { useState } from "react";
import { toast } from "sonner";
import { errorMessage } from "../api/client";
import {
  fetchPreviewUrl,
  useBulkAction,
  useDeleteItem,
  usePermanentDelete,
  useRestoreItem,
  useUpdateItem,
} from "../api/hooks";
import type { AnyItem, FileItem } from "../api/types";
import type { ItemHandlers } from "../components/BrowserItem";
import MoveToFolderDialog from "../components/MoveToFolderDialog";
import PreviewModal from "../components/PreviewModal";
import RenameDialog from "../components/RenameDialog";
import ShareModal from "../components/ShareModal";

export function useItemActions(opts: {
  onOpenFolder: (id: number) => void;
  trashMode?: boolean;
}) {
  const update = useUpdateItem();
  const del = useDeleteItem();
  const restore = useRestoreItem();
  const permanent = usePermanentDelete();
  const bulk = useBulkAction();

  const [renameTarget, setRenameTarget] = useState<AnyItem | null>(null);
  const [shareTarget, setShareTarget] = useState<AnyItem | null>(null);
  const [moveTarget, setMoveTarget] = useState<AnyItem | null>(null);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  async function download(item: AnyItem) {
    if (item.type !== "file") return;
    try {
      const url = await fetchPreviewUrl(item.id, true);
      window.open(url, "_blank");
    } catch (e) {
      toast.error(errorMessage(e, "Download failed"));
    }
  }

  const handlers: ItemHandlers = {
    trashMode: opts.trashMode,
    onOpen: (item) => {
      if (item.type === "folder") opts.onOpenFolder(item.id);
      else setPreviewFile(item);
    },
    onStar: (item) =>
      update.mutate({
        kind: item.type,
        id: item.id,
        body: { starred: !item.starred },
      }),
    onRename: (item) => setRenameTarget(item),
    onShare: (item) => setShareTarget(item),
    onMove: (item) => setMoveTarget(item),
    onMoveInto: (source, targetFolderId) =>
      bulk.mutate(
        {
          action: "MOVE",
          fileIds: source.type === "file" ? [source.id] : [],
          folderIds: source.type === "folder" ? [source.id] : [],
          targetFolderId,
        },
        {
          onSuccess: () => toast.success("Moved"),
          onError: (e) => toast.error(errorMessage(e)),
        }
      ),
    onDownload: (item) => download(item),
    onTrash: (item) =>
      del.mutate(
        { kind: item.type, id: item.id },
        {
          onSuccess: () => toast.success("Moved to trash"),
          onError: (e) => toast.error(errorMessage(e)),
        }
      ),
    onRestore: (item) =>
      restore.mutate(
        { kind: item.type, id: item.id },
        { onSuccess: () => toast.success("Restored") }
      ),
    onDeleteForever: (item) =>
      permanent.mutate(
        { id: item.id },
        { onSuccess: () => toast.success("Deleted permanently") }
      ),
  };

  const dialogs = (
    <>
      {renameTarget && (
        <RenameDialog
          open={!!renameTarget}
          onOpenChange={(o) => !o && setRenameTarget(null)}
          kind={renameTarget.type}
          id={renameTarget.id}
          currentName={renameTarget.name}
        />
      )}
      {shareTarget && (
        <ShareModal
          open={!!shareTarget}
          onOpenChange={(o) => !o && setShareTarget(null)}
          kind={shareTarget.type}
          id={shareTarget.id}
          name={shareTarget.name}
        />
      )}
      {moveTarget && (
        <MoveToFolderDialog
          open={!!moveTarget}
          onOpenChange={(o) => !o && setMoveTarget(null)}
          item={moveTarget}
        />
      )}
      <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </>
  );

  return { handlers, dialogs };
}
