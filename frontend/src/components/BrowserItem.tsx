import { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Download,
  Folder as FolderIcon,
  FolderInput,
  MoreVertical,
  Pencil,
  RotateCcw,
  Share2,
  Star,
  Trash2,
} from "lucide-react";
import { cn } from "../lib/cn";
import { iconForFile } from "../lib/fileIcon";
import { formatBytes, formatDate } from "../lib/format";
import type { AnyItem } from "../api/types";

export interface ItemHandlers {
  onOpen: (item: AnyItem) => void;
  onStar?: (item: AnyItem) => void;
  onRename?: (item: AnyItem) => void;
  onShare?: (item: AnyItem) => void;
  onDownload?: (item: AnyItem) => void;
  onTrash?: (item: AnyItem) => void;
  onRestore?: (item: AnyItem) => void;
  onDeleteForever?: (item: AnyItem) => void;
  /** Opens the "Move to folder" picker for this item. */
  onMove?: (item: AnyItem) => void;
  /** Drag-and-drop: move a dragged item into the target folder. */
  onMoveInto?: (
    source: { id: number; type: "file" | "folder" },
    targetFolderId: number
  ) => void;
  selected?: boolean;
  onToggleSelect?: (item: AnyItem) => void;
  trashMode?: boolean;
}

const DND_MIME = "application/x-cloudbox-item";

/** Wires native drag-and-drop: any item is draggable; folders accept drops to move items in. */
function useItemDnd(item: AnyItem, h: ItemHandlers) {
  const [dropActive, setDropActive] = useState(false);
  const canMove = !h.trashMode && !!h.onMoveInto;
  const isFolder = item.type === "folder";

  const dragProps = canMove
    ? {
        draggable: true,
        onDragStart: (e: React.DragEvent) => {
          e.dataTransfer.setData(
            DND_MIME,
            JSON.stringify({ id: item.id, type: item.type })
          );
          e.dataTransfer.effectAllowed = "move";
        },
      }
    : {};

  const dropProps =
    canMove && isFolder
      ? {
          onDragOver: (e: React.DragEvent) => {
            if (!e.dataTransfer.types.includes(DND_MIME)) return;
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = "move";
            setDropActive(true);
          },
          onDragLeave: () => setDropActive(false),
          onDrop: (e: React.DragEvent) => {
            const raw = e.dataTransfer.getData(DND_MIME);
            setDropActive(false);
            if (!raw) return; // external (OS) file drop — let it bubble to the uploader
            e.preventDefault();
            e.stopPropagation();
            const src = JSON.parse(raw) as { id: number; type: "file" | "folder" };
            if (src.type === item.type && src.id === item.id) return; // dropped onto itself
            h.onMoveInto!(src, item.id);
          },
        }
      : {};

  return { dropActive, dragProps, dropProps };
}

function MenuItem({
  icon: Icon,
  label,
  onSelect,
  danger,
}: {
  icon: typeof Star;
  label: string;
  onSelect: () => void;
  danger?: boolean;
}) {
  return (
    <DropdownMenu.Item
      onSelect={onSelect}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none hover:bg-white/70 dark:hover:bg-white/10",
        danger ? "text-red-600 dark:text-red-400" : "text-slate-700 dark:text-slate-200"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </DropdownMenu.Item>
  );
}

function MenuSeparator() {
  return (
    <DropdownMenu.Separator className="my-1 h-px bg-black/10 dark:bg-white/10" />
  );
}

function ActionsMenu({ item, h }: { item: AnyItem; h: ItemHandlers }) {
  const isFile = item.type === "file";
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className="rounded-lg p-1.5 text-slate-500 opacity-0 transition-opacity hover:bg-white/70 group-hover:opacity-100 data-[state=open]:opacity-100 dark:text-slate-300 dark:hover:bg-white/10"
          aria-label="Actions"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          onClick={(e) => e.stopPropagation()}
          className="glass-strong z-50 min-w-44 rounded-xl p-1.5 animate-scale-in"
        >
          {h.trashMode ? (
            <>
              {h.onRestore && (
                <MenuItem icon={RotateCcw} label="Restore" onSelect={() => h.onRestore!(item)} />
              )}
              {isFile && h.onDeleteForever && (
                <>
                  <MenuSeparator />
                  <MenuItem
                    icon={Trash2}
                    label="Delete forever"
                    danger
                    onSelect={() => h.onDeleteForever!(item)}
                  />
                </>
              )}
            </>
          ) : (
            <>
              {/* Group 1 — get the file out */}
              {isFile && h.onDownload && (
                <MenuItem icon={Download} label="Download" onSelect={() => h.onDownload!(item)} />
              )}

              {/* Group 2 — sharing */}
              {(isFile && h.onDownload) && <MenuSeparator />}
              {h.onShare && (
                <MenuItem icon={Share2} label="Share" onSelect={() => h.onShare!(item)} />
              )}
              {h.onStar && (
                <MenuItem
                  icon={Star}
                  label={item.starred ? "Unstar" : "Star"}
                  onSelect={() => h.onStar!(item)}
                />
              )}

              {/* Group 3 — organize */}
              {(h.onRename || h.onMove) && <MenuSeparator />}
              {h.onRename && (
                <MenuItem icon={Pencil} label="Rename" onSelect={() => h.onRename!(item)} />
              )}
              {h.onMove && (
                <MenuItem
                  icon={FolderInput}
                  label="Move to folder"
                  onSelect={() => h.onMove!(item)}
                />
              )}

              {/* Group 4 — destructive */}
              {h.onTrash && (
                <>
                  <MenuSeparator />
                  <MenuItem icon={Trash2} label="Move to trash" danger onSelect={() => h.onTrash!(item)} />
                </>
              )}
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function ItemCard({ item, h }: { item: AnyItem; h: ItemHandlers }) {
  const isFile = item.type === "file";
  const Icon = isFile ? iconForFile(item.contentType, item.name) : FolderIcon;
  const { dropActive, dragProps, dropProps } = useItemDnd(item, h);
  return (
    <div
      {...dragProps}
      {...dropProps}
      onClick={() => h.onOpen(item)}
      className={cn(
        "group card card-hover relative flex cursor-pointer flex-col gap-3 rounded-2xl p-4",
        h.selected && "ring-2 ring-brand",
        dropActive && "ring-2 ring-brand ring-offset-2 scale-[1.02]"
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl",
            isFile
            ? "bg-brand-50 text-brand dark:bg-brand/20 dark:text-brand-100"
            : "bg-amber-100 text-amber-500 dark:bg-amber-400/20 dark:text-amber-300"
          )}
        >
          <Icon className="h-6 w-6" fill={isFile ? "none" : "currentColor"} />
        </div>
        <div className="flex items-center gap-1">
          {item.starred && <Star className="h-4 w-4 fill-amber-400 text-amber-400" />}
          <ActionsMenu item={item} h={h} />
        </div>
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{item.name}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {isFile ? formatBytes(item.size) : "Folder"} · {formatDate(item.updatedAt)}
        </p>
      </div>
    </div>
  );
}

/** Large tile with a big thumbnail area (Dropbox-style grid). */
export function LargeItemCard({ item, h }: { item: AnyItem; h: ItemHandlers }) {
  const isFile = item.type === "file";
  const Icon = isFile ? iconForFile(item.contentType, item.name) : FolderIcon;
  const { dropActive, dragProps, dropProps } = useItemDnd(item, h);
  return (
    <div
      {...dragProps}
      {...dropProps}
      onClick={() => h.onOpen(item)}
      className={cn(
        "group card card-hover relative flex cursor-pointer flex-col overflow-hidden rounded-2xl",
        h.selected && "ring-2 ring-brand",
        dropActive && "ring-2 ring-brand ring-offset-2 scale-[1.01]"
      )}
    >
      {/* Big thumbnail area */}
      <div
        className={cn(
          "flex h-36 items-center justify-center",
          isFile
            ? "bg-brand-50/60 dark:bg-brand/10"
            : "bg-amber-50 dark:bg-amber-400/10"
        )}
      >
        <Icon
          className={cn(
            "h-16 w-16",
            isFile ? "text-brand/80 dark:text-brand-100" : "text-amber-400 dark:text-amber-300"
          )}
          fill={isFile ? "none" : "currentColor"}
        />
      </div>
      {/* Footer: name + meta + actions */}
      <div className="flex items-center justify-between gap-2 p-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
            {item.name}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {isFile ? formatBytes(item.size) : "Folder"} · {formatDate(item.updatedAt)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {item.starred && <Star className="h-4 w-4 fill-amber-400 text-amber-400" />}
          <ActionsMenu item={item} h={h} />
        </div>
      </div>
    </div>
  );
}

export function ItemRow({ item, h }: { item: AnyItem; h: ItemHandlers }) {
  const isFile = item.type === "file";
  const Icon = isFile ? iconForFile(item.contentType, item.name) : FolderIcon;
  const { dropActive, dragProps, dropProps } = useItemDnd(item, h);
  return (
    <div
      {...dragProps}
      {...dropProps}
      onClick={() => h.onOpen(item)}
      className={cn(
        "group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/60 dark:hover:bg-white/10",
        h.selected && "bg-brand-50 dark:bg-brand/20",
        dropActive && "ring-2 ring-brand bg-brand-50/70 dark:bg-brand/20"
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          isFile
            ? "bg-brand-50 text-brand dark:bg-brand/20 dark:text-brand-100"
            : "bg-amber-100 text-amber-500 dark:bg-amber-400/20 dark:text-amber-300"
        )}
      >
        <Icon className="h-5 w-5" fill={isFile ? "none" : "currentColor"} />
      </div>
      <span className="flex-1 truncate text-sm font-medium text-slate-800 dark:text-slate-100">
        {item.name}
        {item.starred && (
          <Star className="ml-2 inline h-3.5 w-3.5 fill-amber-400 text-amber-400" />
        )}
      </span>
      <span className="hidden w-28 text-right text-xs text-slate-400 dark:text-slate-500 sm:block">
        {formatDate(item.updatedAt)}
      </span>
      <span className="hidden w-20 text-right text-xs text-slate-400 dark:text-slate-500 sm:block">
        {isFile ? formatBytes(item.size) : "—"}
      </span>
      <ActionsMenu item={item} h={h} />
    </div>
  );
}
