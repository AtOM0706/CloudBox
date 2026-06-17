import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  FolderPlus,
  Home,
  Star,
  Upload,
  UploadCloud,
} from "lucide-react";
import { useFolderContents, useRecent, useSearch } from "../api/hooks";
import type { AnyItem, FileItem } from "../api/types";
import { useAppUi } from "../components/appUi";
import ItemCollection from "../components/ItemCollection";
import NewFolderDialog from "../components/NewFolderDialog";
import { useItemActions } from "../hooks/useItemActions";
import { iconForFile } from "../lib/fileIcon";
import { formatBytes } from "../lib/format";

export default function FilesPage() {
  const { id } = useParams();
  const folderId = id ? Number(id) : null;
  const navigate = useNavigate();
  const { view, search, startUpload } = useAppUi();
  const [dragging, setDragging] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [sortAsc, setSortAsc] = useState(true);
  const fileInput = useRef<HTMLInputElement>(null);

  const searching = search.trim().length > 0;
  const contents = useFolderContents(searching ? null : folderId);
  const searchResults = useSearch(search.trim());

  const { handlers, dialogs } = useItemActions({
    onOpenFolder: (fid) => navigate(`/folder/${fid}`),
  });

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) {
      startUpload(Array.from(e.dataTransfer.files), folderId);
    }
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) {
      startUpload(Array.from(e.target.files), folderId);
      e.target.value = "";
    }
  }

  const rawFolders = searching ? searchResults.data?.folders ?? [] : contents.data?.folders ?? [];
  const rawFiles = searching ? searchResults.data?.files ?? [] : contents.data?.files ?? [];
  const breadcrumbs = contents.data?.breadcrumbs ?? [];
  const loading = searching ? searchResults.isLoading : contents.isLoading;
  const isEmpty = rawFolders.length === 0 && rawFiles.length === 0;

  const dir = sortAsc ? 1 : -1;
  const byName = <T extends { name: string }>(arr: T[]) =>
    [...arr].sort((a, b) => a.name.localeCompare(b.name) * dir);
  const folders = byName(rawFolders);
  const files = byName(rawFiles);
  const isRootHome = !searching && folderId == null;

  return (
    <div className="mx-auto max-w-6xl">
      {/* Title + New + view toggle */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {searching ? (
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Search results for “{search.trim()}”
          </h1>
        ) : (
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {folderId == null
              ? "All files"
              : breadcrumbs[breadcrumbs.length - 1]?.name ?? "Files"}
          </h1>
        )}

        {!searching && (
          <div className="flex items-center gap-2">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="btn-glass">
                  <Upload className="h-4 w-4" />
                  Upload
                  <ChevronDown className="h-4 w-4 opacity-70" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={6}
                  className="glass-strong z-50 min-w-48 rounded-xl p-1.5 animate-scale-in"
                >
                  <DropdownMenu.Item
                    onSelect={() => fileInput.current?.click()}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none hover:bg-white/70 dark:text-slate-200 dark:hover:bg-white/10"
                  >
                    <Upload className="h-4 w-4" />
                    Upload files
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
            <button className="btn-primary" onClick={() => setNewFolderOpen(true)}>
              <FolderPlus className="h-4 w-4" />
              New folder
            </button>
          </div>
        )}
      </div>

      {/* Breadcrumb + quick chips */}
      {!searching && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <nav className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-white/60 dark:hover:bg-white/10"
            >
              <Home className="h-4 w-4" />
              Home
            </button>
            {breadcrumbs.map((b) => (
              <span key={b.id} className="flex items-center gap-1">
                <ChevronRight className="h-4 w-4 text-slate-300" />
                <button
                  onClick={() => navigate(`/folder/${b.id}`)}
                  className="rounded-lg px-2 py-1 font-medium text-slate-700 hover:bg-white/60 dark:text-slate-200 dark:hover:bg-white/10"
                >
                  {b.name}
                </button>
              </span>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/recent")} className="btn-glass !py-1.5 text-sm">
              <Clock className="h-4 w-4" />
              Recents
            </button>
            <button onClick={() => navigate("/starred")} className="btn-glass !py-1.5 text-sm">
              <Star className="h-4 w-4" />
              Starred
            </button>
          </div>
        </div>
      )}

      {isRootHome && <SuggestedRow onOpen={handlers.onOpen} />}

      <input ref={fileInput} type="file" multiple className="hidden" onChange={onPick} />

      {/* Drop-zone content area */}
      <div
        onDragOver={(e) => {
          // Only react to files dragged in from the OS, not internal item-move drags.
          if (!e.dataTransfer.types.includes("Files")) return;
          e.preventDefault();
          if (!searching) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative min-h-[60vh] rounded-3xl border-2 border-dashed p-4 transition-colors sm:p-6 ${
          dragging
            ? "border-brand bg-brand-50/60 dark:bg-brand/15"
            : "border-white/60 bg-white/30 dark:border-white/10 dark:bg-white/5"
        }`}
      >
        {loading ? (
          <SkeletonGrid />
        ) : isEmpty ? (
          <EmptyDropZone
            searching={searching}
            onUpload={() => fileInput.current?.click()}
            onNewFolder={() => setNewFolderOpen(true)}
          />
        ) : (
          <>
            {view === "grid" && (
              <div className="mb-3 border-b border-white/50 pb-2 dark:border-white/10">
                <button
                  onClick={() => setSortAsc((v) => !v)}
                  className="flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100"
                >
                  Name
                  {sortAsc ? (
                    <ArrowUp className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowDown className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            )}
            <ItemCollection
              folders={folders}
              files={files}
              handlers={handlers}
              view={view}
              cardSize="large"
              empty={null}
            />
          </>
        )}

        {dragging && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-brand-50/70 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2 text-brand">
              <UploadCloud className="h-12 w-12" />
              <p className="text-lg font-semibold">Drop files to upload</p>
            </div>
          </div>
        )}
      </div>

      <NewFolderDialog open={newFolderOpen} onOpenChange={setNewFolderOpen} parentId={folderId} />
      {dialogs}
    </div>
  );
}

function EmptyDropZone({
  searching,
  onUpload,
  onNewFolder,
}: {
  searching: boolean;
  onUpload: () => void;
  onNewFolder: () => void;
}) {
  if (searching) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-center text-slate-500 dark:text-slate-400">
        <UploadCloud className="h-10 w-10 text-brand/60" />
        <p className="text-base font-semibold text-slate-700 dark:text-slate-200">No matches found</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="glass flex h-24 w-24 items-center justify-center rounded-3xl">
        <UploadCloud className="h-11 w-11 text-brand/70" />
      </div>
      <div>
        <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
          Drop anything here to upload
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          or use the buttons below to get started
        </p>
      </div>
      <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
        <button onClick={onUpload} className="btn-primary">
          <Upload className="h-4 w-4" />
          Upload files
        </button>
        <button onClick={onNewFolder} className="btn-glass">
          <FolderPlus className="h-4 w-4" />
          Create a folder
        </button>
      </div>
    </div>
  );
}

function SuggestedRow({ onOpen }: { onOpen: (item: AnyItem) => void }) {
  const { data: recent = [] } = useRecent();
  const scroller = useRef<HTMLDivElement>(null);
  const items: FileItem[] = recent.slice(0, 12);
  if (items.length === 0) return null;

  const scroll = (dx: number) =>
    scroller.current?.scrollBy({ left: dx, behavior: "smooth" });

  return (
    <section className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
          <Eye className="h-4 w-4" />
          Suggested for you
        </h2>
        <div className="flex gap-1">
          <button
            onClick={() => scroll(-320)}
            aria-label="Scroll left"
            className="rounded-full p-1.5 text-slate-500 hover:bg-white/60 dark:text-slate-400 dark:hover:bg-white/10"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll(320)}
            aria-label="Scroll right"
            className="rounded-full p-1.5 text-slate-500 hover:bg-white/60 dark:text-slate-400 dark:hover:bg-white/10"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div ref={scroller} className="flex gap-3 overflow-x-auto pb-1">
        {items.map((f) => {
          const Icon = iconForFile(f.contentType, f.name);
          return (
            <button
              key={f.id}
              onClick={() => onOpen(f)}
              className="card card-hover flex w-60 shrink-0 items-center gap-3 rounded-2xl p-3 text-left"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand dark:bg-brand/20 dark:text-brand-100">
                <Icon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                  {f.name}
                </p>
                <p className="truncate text-xs text-slate-400 dark:text-slate-500">
                  {formatBytes(f.size)} · File
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="glass h-28 animate-pulse rounded-2xl" />
      ))}
    </div>
  );
}
