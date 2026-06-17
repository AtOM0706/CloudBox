import { useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { fetchPreviewUrl } from "../api/hooks";
import {
  iconForFile,
  isPreviewableImage,
  isPreviewablePdf,
  isPreviewableText,
} from "../lib/fileIcon";
import { formatBytes } from "../lib/format";
import type { FileItem } from "../api/types";
import Modal from "./Modal";

export default function PreviewModal({
  file,
  onClose,
}: {
  file: FileItem | null;
  onClose: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setUrl(null);
    setTextContent(null);
    if (!file) return;
    setLoading(true);
    fetchPreviewUrl(file.id)
      .then(async (u) => {
        if (cancelled) return;
        setUrl(u);
        if (isPreviewableText(file.contentType, file.name)) {
          const text = await fetch(u).then((r) => r.text());
          if (!cancelled) setTextContent(text.slice(0, 20000));
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [file]);

  async function download() {
    if (!file) return;
    const u = await fetchPreviewUrl(file.id, true);
    window.open(u, "_blank");
  }

  if (!file) return null;
  const Icon = iconForFile(file.contentType, file.name);

  return (
    <Modal open={!!file} onOpenChange={(o) => !o && onClose()} title={file.name} className="max-w-3xl">
      <div className="flex min-h-[200px] flex-col gap-4">
        <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <span>{formatBytes(file.size)}</span>
          <button className="btn-primary" onClick={download}>
            <Download className="h-4 w-4" />
            Download
          </button>
        </div>

        <div className="flex max-h-[60vh] items-center justify-center overflow-auto rounded-2xl bg-white/50 p-3 dark:bg-black/20">
          {loading && <Loader2 className="h-8 w-8 animate-spin text-brand" />}
          {!loading && url && isPreviewableImage(file.contentType, file.name) && (
            <img src={url} alt={file.name} className="max-h-[55vh] rounded-xl object-contain" />
          )}
          {!loading && url && isPreviewablePdf(file.contentType, file.name) && (
            <iframe src={url} title={file.name} className="h-[55vh] w-full rounded-xl" />
          )}
          {!loading && textContent !== null && (
            <pre className="w-full whitespace-pre-wrap break-words text-left text-sm text-slate-700 dark:text-slate-200">
              {textContent}
            </pre>
          )}
          {!loading &&
            url &&
            !isPreviewableImage(file.contentType, file.name) &&
            !isPreviewablePdf(file.contentType, file.name) &&
            textContent === null && (
              <div className="flex flex-col items-center gap-2 py-10 text-slate-500 dark:text-slate-400">
                <Icon className="h-12 w-12 text-brand/70" />
                <p className="text-sm">No preview available for this file type.</p>
              </div>
            )}
        </div>
      </div>
    </Modal>
  );
}
