import { Trash2 } from "lucide-react";
import { useTrash } from "../api/hooks";
import { useAppUi } from "../components/appUi";
import EmptyState from "../components/EmptyState";
import ItemCollection from "../components/ItemCollection";
import { useItemActions } from "../hooks/useItemActions";

export default function TrashPage() {
  const { view } = useAppUi();
  const { data, isLoading } = useTrash();
  const { handlers, dialogs } = useItemActions({
    onOpenFolder: () => {},
    trashMode: true,
  });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-slate-800 dark:text-slate-100">Deleted files</h1>
      <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
        Restore deleted files, or delete them permanently to free up storage.
      </p>
      {isLoading ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">Loading…</p>
      ) : (
        <ItemCollection
          folders={data?.folders ?? []}
          files={data?.files ?? []}
          handlers={handlers}
          view={view}
          empty={<EmptyState icon={Trash2} title="Trash is empty" />}
        />
      )}
      {dialogs}
    </div>
  );
}
