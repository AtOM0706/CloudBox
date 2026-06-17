import { useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";
import { useRecent } from "../api/hooks";
import { useAppUi } from "../components/appUi";
import EmptyState from "../components/EmptyState";
import ItemCollection from "../components/ItemCollection";
import { useItemActions } from "../hooks/useItemActions";

export default function RecentPage() {
  const { view } = useAppUi();
  const navigate = useNavigate();
  const { data, isLoading } = useRecent();
  const { handlers, dialogs } = useItemActions({
    onOpenFolder: (id) => navigate(`/folder/${id}`),
  });

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold text-slate-800 dark:text-slate-100">Recent</h1>
      {isLoading ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">Loading…</p>
      ) : (
        <ItemCollection
          folders={[]}
          files={data ?? []}
          handlers={handlers}
          view={view}
          empty={<EmptyState icon={Clock} title="No recent files" hint="Upload something to get started" />}
        />
      )}
      {dialogs}
    </div>
  );
}
