import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { useStarred } from "../api/hooks";
import { useAppUi } from "../components/appUi";
import EmptyState from "../components/EmptyState";
import ItemCollection from "../components/ItemCollection";
import { useItemActions } from "../hooks/useItemActions";

export default function StarredPage() {
  const { view } = useAppUi();
  const navigate = useNavigate();
  const { data, isLoading } = useStarred();
  const { handlers, dialogs } = useItemActions({
    onOpenFolder: (id) => navigate(`/folder/${id}`),
  });

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold text-slate-800 dark:text-slate-100">Starred</h1>
      {isLoading ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">Loading…</p>
      ) : (
        <ItemCollection
          folders={data?.folders ?? []}
          files={data?.files ?? []}
          handlers={handlers}
          view={view}
          empty={<EmptyState icon={Star} title="Nothing starred yet" hint="Star files and folders for quick access" />}
        />
      )}
      {dialogs}
    </div>
  );
}
