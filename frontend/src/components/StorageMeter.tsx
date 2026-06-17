import { useCurrentUser } from "../api/hooks";
import { formatBytes, formatPercent } from "../lib/format";

export default function StorageMeter() {
  const { data: user } = useCurrentUser();
  if (!user) return null;

  const pct = formatPercent(user.storageUsed, user.storageQuota);
  const nearFull = pct >= 90;

  return (
    <div className="px-2">
      <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>Storage</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/10">
        <div
          className={`h-full rounded-full transition-all ${
            nearFull ? "bg-red-500" : "bg-brand"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
        {formatBytes(user.storageUsed)} of {formatBytes(user.storageQuota)} used
      </div>
    </div>
  );
}
