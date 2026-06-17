import type { ReactNode } from "react";
import type { FileItem, FolderItem } from "../api/types";
import type { ViewMode } from "./appUi";
import { ItemCard, ItemRow, LargeItemCard, type ItemHandlers } from "./BrowserItem";

export default function ItemCollection({
  folders,
  files,
  handlers,
  view,
  empty,
  cardSize = "default",
}: {
  folders: FolderItem[];
  files: FileItem[];
  handlers: ItemHandlers;
  view: ViewMode;
  empty: ReactNode;
  cardSize?: "default" | "large";
}) {
  const isEmpty = folders.length === 0 && files.length === 0;
  if (isEmpty) return <>{empty}</>;

  if (view === "grid") {
    if (cardSize === "large") {
      return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {folders.map((f) => (
            <LargeItemCard key={`folder-${f.id}`} item={f} h={handlers} />
          ))}
          {files.map((f) => (
            <LargeItemCard key={`file-${f.id}`} item={f} h={handlers} />
          ))}
        </div>
      );
    }
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {folders.map((f) => (
          <ItemCard key={`folder-${f.id}`} item={f} h={handlers} />
        ))}
        {files.map((f) => (
          <ItemCard key={`file-${f.id}`} item={f} h={handlers} />
        ))}
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-2">
      <div className="flex items-center gap-3 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        <span className="h-9 w-9" />
        <span className="flex-1">Name</span>
        <span className="hidden w-28 text-right sm:block">Modified</span>
        <span className="hidden w-20 text-right sm:block">Size</span>
        <span className="w-7" />
      </div>
      <div className="flex flex-col">
        {folders.map((f) => (
          <ItemRow key={`folder-${f.id}`} item={f} h={handlers} />
        ))}
        {files.map((f) => (
          <ItemRow key={`file-${f.id}`} item={f} h={handlers} />
        ))}
      </div>
    </div>
  );
}
