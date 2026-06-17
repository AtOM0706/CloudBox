import { Copy, FileIcon, Folder as FolderIcon, Link2, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { useRevokeShare, useShares } from "../api/hooks";
import EmptyState from "../components/EmptyState";
import { formatDate } from "../lib/format";

function shareUrl(token: string) {
  return `${window.location.origin}/s/${token}`;
}

export default function SharedPage() {
  const { data, isLoading } = useShares();
  const revoke = useRevokeShare();

  const shares = data ?? [];

  function copy(token: string) {
    navigator.clipboard.writeText(shareUrl(token));
    toast.success("Link copied to clipboard");
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-1 text-2xl font-bold text-slate-800 dark:text-slate-100">Shared</h1>
      <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
        Links you've created. Anyone with a link can access that item.
      </p>

      {isLoading ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">Loading…</p>
      ) : shares.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nothing shared yet"
          hint="Use the Share action on a file or folder to create a link"
        />
      ) : (
        <div className="glass flex flex-col gap-2 rounded-2xl p-3">
          {shares.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-xl bg-white/60 px-3 py-2.5 dark:bg-white/10">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand dark:bg-brand/20 dark:text-brand-100">
                {s.folderId ? (
                  <FolderIcon className="h-5 w-5" fill="currentColor" />
                ) : (
                  <FileIcon className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                  <Link2 className="h-3.5 w-3.5 text-slate-400" />
                  {shareUrl(s.token)}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500">
                  {s.folderId ? "Folder" : "File"} ·{" "}
                  {s.permission === "EDIT" ? "Can edit" : "Can view"} ·{" "}
                  {s.expiresAt ? `expires ${formatDate(s.expiresAt)}` : "no expiry"}
                </div>
              </div>
              <button
                className="rounded-lg p-2 text-slate-500 hover:bg-white/70 dark:text-slate-300 dark:hover:bg-white/10"
                onClick={() => copy(s.token)}
                aria-label="Copy link"
              >
                <Copy className="h-4 w-4" />
              </button>
              <button
                className="rounded-lg p-2 text-red-500 hover:bg-white/70 dark:hover:bg-white/10"
                onClick={() => revoke.mutate(s.id, { onSuccess: () => toast.success("Link revoked") })}
                aria-label="Revoke link"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
