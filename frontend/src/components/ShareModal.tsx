import { useState } from "react";
import { Copy, Link2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { errorMessage } from "../api/client";
import { useCreateShare, useRevokeShare, useShares } from "../api/hooks";
import { cn } from "../lib/cn";
import { formatDate } from "../lib/format";
import type { SharePermission } from "../api/types";
import Modal from "./Modal";

function shareUrl(token: string) {
  return `${window.location.origin}/s/${token}`;
}

export default function ShareModal({
  open,
  onOpenChange,
  kind,
  id,
  name,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  kind: "file" | "folder";
  id: number;
  name: string;
}) {
  const [permission, setPermission] = useState<SharePermission>("VIEW");
  const [expiresAt, setExpiresAt] = useState("");
  const create = useCreateShare();
  const revoke = useRevokeShare();
  const { data: allShares } = useShares();

  const shares = (allShares ?? []).filter((s) =>
    kind === "file" ? s.fileId === id : s.folderId === id
  );

  function copy(token: string) {
    navigator.clipboard.writeText(shareUrl(token));
    toast.success("Link copied to clipboard");
  }

  function createLink() {
    create.mutate(
      {
        ...(kind === "file" ? { fileId: id } : { folderId: id }),
        permission,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      },
      {
        onSuccess: (s) => {
          copy(s.token);
          toast.success("Share link created");
        },
        onError: (err) => toast.error(errorMessage(err)),
      }
    );
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={`Share "${name}"`}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            Permission
            <div className="flex rounded-xl border border-black/5 bg-white/60 p-0.5 text-sm dark:border-white/10 dark:bg-white/5">
              {(["VIEW", "EDIT"] as SharePermission[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPermission(p)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 font-medium transition-colors",
                    permission === p
                      ? "bg-brand text-white shadow-sm"
                      : "text-slate-600 hover:bg-white/60 dark:text-slate-300 dark:hover:bg-white/10"
                  )}
                >
                  {p === "VIEW" ? "Can view" : "Can edit"}
                </button>
              ))}
            </div>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            Expires (optional)
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="input w-44"
            />
          </label>
          <button className="btn-primary" onClick={createLink} disabled={create.isPending}>
            <Link2 className="h-4 w-4" />
            Create link
          </button>
        </div>

        <div className="border-t border-white/50 pt-3 dark:border-white/10">
          <p className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">Active links</p>
          {shares.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">No share links yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {shares.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-2 rounded-xl bg-white/60 px-3 py-2 dark:bg-white/10"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-slate-700 dark:text-slate-200">
                      {shareUrl(s.token)}
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500">
                      {s.permission === "EDIT" ? "Can edit" : "Can view"}
                      {s.expiresAt ? ` · expires ${formatDate(s.expiresAt)}` : " · no expiry"}
                    </div>
                  </div>
                  <button
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-white/70 dark:text-slate-300 dark:hover:bg-white/10"
                    onClick={() => copy(s.token)}
                    aria-label="Copy link"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    className="rounded-lg p-1.5 text-red-500 hover:bg-white/70 dark:hover:bg-white/10"
                    onClick={() =>
                      revoke.mutate(s.id, {
                        onSuccess: () => toast.success("Link revoked"),
                      })
                    }
                    aria-label="Revoke link"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
