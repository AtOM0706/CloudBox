import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Image as ImageIcon } from "lucide-react";
import { fetchPreviewUrl, usePhotos } from "../api/hooks";
import EmptyState from "../components/EmptyState";
import { useItemActions } from "../hooks/useItemActions";
import type { FileItem } from "../api/types";

function PhotoTile({ file, onOpen }: { file: FileItem; onOpen: () => void }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPreviewUrl(file.id).then((u) => !cancelled && setUrl(u));
    return () => {
      cancelled = true;
    };
  }, [file.id]);

  return (
    <button
      onClick={onOpen}
      className="group card card-hover relative aspect-square overflow-hidden rounded-2xl"
      title={file.name}
    >
      {url ? (
        <img
          src={url}
          alt={file.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <ImageIcon className="h-8 w-8 text-brand/40" />
        </div>
      )}
      <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5 text-left text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
        {file.name}
      </span>
    </button>
  );
}

export default function PhotosPage() {
  const navigate = useNavigate();
  const { data, isLoading } = usePhotos();
  const { handlers, dialogs } = useItemActions({
    onOpenFolder: (id) => navigate(`/folder/${id}`),
  });

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-1 text-2xl font-bold text-slate-800 dark:text-slate-100">Photos</h1>
      <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">All your image files in one place.</p>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="glass aspect-square animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : (data ?? []).length === 0 ? (
        <EmptyState icon={ImageIcon} title="No photos yet" hint="Upload some images to see them here" />
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {(data ?? []).map((file) => (
            <PhotoTile key={file.id} file={file} onOpen={() => handlers.onOpen(file)} />
          ))}
        </div>
      )}
      {dialogs}
    </div>
  );
}
