import { CheckCircle2, Loader2, X, XCircle } from "lucide-react";
import { useAppUi } from "./appUi";

export default function UploadTray() {
  const { uploads, dismissUpload } = useAppUi();
  if (uploads.length === 0) return null;

  return (
    <div className="glass-strong fixed bottom-4 right-4 z-50 w-80 rounded-2xl p-3 animate-scale-in">
      <div className="mb-2 px-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
        Uploading {uploads.length} item{uploads.length > 1 ? "s" : ""}
      </div>
      <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
        {uploads.map((u) => (
          <div key={u.id} className="rounded-xl bg-white/60 p-2.5 dark:bg-white/10">
            <div className="flex items-center gap-2">
              {u.status === "uploading" && (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-brand" />
              )}
              {u.status === "done" && (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
              )}
              {u.status === "error" && (
                <XCircle className="h-4 w-4 shrink-0 text-red-600" />
              )}
              <span className="flex-1 truncate text-sm text-slate-700 dark:text-slate-200">{u.name}</span>
              <button onClick={() => dismissUpload(u.id)} aria-label="Dismiss">
                <X className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>
            {u.status === "uploading" && (
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-brand transition-all"
                  style={{ width: `${u.progress}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
