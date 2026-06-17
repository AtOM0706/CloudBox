import { useQuery } from "@tanstack/react-query";
import { Cloud, Download, FileText, Folder as FolderIcon } from "lucide-react";
import { useParams } from "react-router-dom";
import { api, errorMessage } from "../api/client";
import { iconForFile } from "../lib/fileIcon";
import { formatBytes, formatDate } from "../lib/format";
import type { PublicShare } from "../api/types";

export default function PublicSharePage() {
  const { token } = useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-share", token],
    queryFn: async () => (await api.get<PublicShare>(`/shares/${token}`)).data,
    retry: false,
  });

  return (
    <div className="flex min-h-screen flex-col items-center p-4">
      <header className="mt-8 flex items-center gap-2">
        <Cloud className="h-7 w-7 text-brand" fill="currentColor" />
        <span className="text-xl font-bold text-slate-800 dark:text-slate-100">CloudBox</span>
      </header>

      <main className="mt-8 w-full max-w-2xl">
        {isLoading && (
          <div className="glass-strong flex justify-center rounded-3xl p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="glass-strong rounded-3xl p-10 text-center">
            <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">Link unavailable</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {errorMessage(error, "This share link is invalid or has expired.")}
            </p>
          </div>
        )}

        {data?.type === "file" && data.file && (
          <div className="glass-strong rounded-3xl p-10 text-center">
            {(() => {
              const Icon = iconForFile(data.file.contentType, data.file.name);
              return (
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-50 text-brand dark:bg-brand/20 dark:text-brand-100">
                  <Icon className="h-10 w-10" />
                </div>
              );
            })()}
            <h1 className="mt-4 text-xl font-bold text-slate-800 dark:text-slate-100">{data.file.name}</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{formatBytes(data.file.size)}</p>
            {data.downloadUrl && (
              <a className="btn-primary mt-6 inline-flex" href={data.downloadUrl}>
                <Download className="h-4 w-4" />
                Download
              </a>
            )}
          </div>
        )}

        {data?.type === "folder" && data.folder && (
          <div className="glass-strong rounded-3xl p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-500 dark:bg-amber-400/20 dark:text-amber-300">
                <FolderIcon className="h-6 w-6" fill="currentColor" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">{data.folder.name}</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Shared folder</p>
              </div>
            </div>
            <div className="flex flex-col divide-y divide-white/50 dark:divide-white/10">
              {data.contents?.folders.map((f) => (
                <div key={`f-${f.id}`} className="flex items-center gap-3 py-2.5">
                  <FolderIcon className="h-5 w-5 text-amber-500" fill="currentColor" />
                  <span className="flex-1 text-sm text-slate-700 dark:text-slate-200">{f.name}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">{formatDate(f.updatedAt)}</span>
                </div>
              ))}
              {data.contents?.files.map((file) => {
                const Icon = iconForFile(file.contentType, file.name);
                return (
                  <div key={`x-${file.id}`} className="flex items-center gap-3 py-2.5">
                    <Icon className="h-5 w-5 text-brand dark:text-brand-100" />
                    <span className="flex-1 text-sm text-slate-700 dark:text-slate-200">{file.name}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{formatBytes(file.size)}</span>
                  </div>
                );
              })}
              {!data.contents?.folders.length && !data.contents?.files.length && (
                <div className="flex items-center gap-2 py-6 text-sm text-slate-400 dark:text-slate-500">
                  <FileText className="h-4 w-4" />
                  This folder is empty.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
