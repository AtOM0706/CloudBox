import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Activity as ActivityIcon,
  Clock,
  Cloud,
  Files,
  FolderOpen,
  Folder as FolderIcon,
  Home as HomeIcon,
  Image,
  LogOut,
  MoreHorizontal,
  Star,
  Trash2,
  Upload,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useFolderContents } from "../api/hooks";
import { useAuth } from "../auth/AuthContext";
import { cn } from "../lib/cn";
import { useAppUi } from "./appUi";
import StorageMeter from "./StorageMeter";

type GroupKey = "home" | "folders" | "activity" | "more";

interface RailItem {
  key: GroupKey;
  label: string;
  icon: LucideIcon;
  route?: string; // navigate here when the rail icon is clicked
}

const RAIL: RailItem[] = [
  { key: "home", label: "Home", icon: HomeIcon, route: "/" },
  { key: "folders", label: "Folders", icon: FolderOpen, route: "/folders" },
  { key: "activity", label: "Activity", icon: ActivityIcon, route: "/recent" },
  { key: "more", label: "More", icon: MoreHorizontal },
];

export default function SideNav({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const [active, setActive] = useState<GroupKey>("home");
  const navigate = useNavigate();

  function onRailClick(item: RailItem) {
    setActive(item.key);
    if (item.route) navigate(item.route);
  }

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex gap-2.5 p-2.5 transition-transform md:static md:translate-x-0 md:my-3 md:ml-3 md:p-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* ---- Narrow floating icon rail (main nav) ---- */}
        <nav className="glass-strong flex w-[68px] flex-col items-center gap-2 rounded-[28px] py-4">
          <Cloud className="mb-3 h-7 w-7 text-brand" fill="currentColor" />
          {RAIL.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onRailClick(item)}
                className="group flex w-full flex-col items-center gap-1 py-1"
              >
                <span
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full transition-all",
                    isActive
                      ? "bg-white/90 text-brand shadow-md scale-105 ring-1 ring-black/5 dark:bg-white/15 dark:text-brand-100 dark:ring-white/10"
                      : "text-slate-500 group-hover:bg-white/60 dark:text-slate-400 dark:group-hover:bg-white/10"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span
                  className={cn(
                    "text-[11px] font-medium",
                    isActive ? "text-brand dark:text-brand-100" : "text-slate-500 dark:text-slate-400"
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* ---- Wider contextual sub-panel (separate floating glass) ---- */}
        <div className="glass-strong flex w-60 flex-col gap-3 rounded-[28px] p-4">
          <div className="flex items-center justify-between">
            <h2 className="px-1 text-lg font-bold text-slate-800 dark:text-slate-100">
              {RAIL.find((r) => r.key === active)?.label}
            </h2>
            <button className="md:hidden" onClick={onClose} aria-label="Close menu">
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <SubPanel group={active} onNavigate={onClose} />
          </div>

          <div className="border-t border-white/50 pt-3">
            <StorageMeter />
          </div>
        </div>
      </div>
    </>
  );
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
    isActive
      ? "bg-white/90 text-brand shadow-sm ring-1 ring-black/5 dark:bg-white/15 dark:text-brand-100 dark:ring-white/10"
      : "text-slate-600 hover:bg-white/55 dark:text-slate-300 dark:hover:bg-white/10"
  );

function SubPanel({ group, onNavigate }: { group: GroupKey; onNavigate: () => void }) {
  switch (group) {
    case "home":
      return <HomePanel onNavigate={onNavigate} />;
    case "folders":
      return <FoldersPanel onNavigate={onNavigate} />;
    case "activity":
      return <ActivityPanel onNavigate={onNavigate} />;
    case "more":
      return <MorePanel />;
  }
}

function HomePanel({ onNavigate }: { onNavigate: () => void }) {
  const { startUpload } = useAppUi();
  return (
    <div className="flex flex-col gap-1">
      <UploadButton onPick={(files) => startUpload(files, null)} onDone={onNavigate} />
      <NavLink to="/" end onClick={onNavigate} className={navLinkClass}>
        <Files className="h-[18px] w-[18px]" /> All files
      </NavLink>
      <NavLink to="/photos" onClick={onNavigate} className={navLinkClass}>
        <Image className="h-[18px] w-[18px]" /> Photos
      </NavLink>
      <NavLink to="/shared" onClick={onNavigate} className={navLinkClass}>
        <Users className="h-[18px] w-[18px]" /> Shared
      </NavLink>
      <NavLink to="/trash" onClick={onNavigate} className={navLinkClass}>
        <Trash2 className="h-[18px] w-[18px]" /> Deleted files
      </NavLink>

      <p className="mt-4 px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        Quick access
      </p>
      <NavLink to="/starred" onClick={onNavigate} className={navLinkClass}>
        <Star className="h-[18px] w-[18px]" /> Starred
      </NavLink>
    </div>
  );
}

function FoldersPanel({ onNavigate }: { onNavigate: () => void }) {
  const { data } = useFolderContents(null);
  const folders = data?.folders ?? [];
  return (
    <div className="flex flex-col gap-1">
      <NavLink to="/" end onClick={onNavigate} className={navLinkClass}>
        <Files className="h-[18px] w-[18px]" /> All files
      </NavLink>
      <p className="mt-4 px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        Your folders
      </p>
      {folders.length === 0 ? (
        <p className="px-3 text-sm text-slate-400 dark:text-slate-500">No folders yet</p>
      ) : (
        folders.map((f) => (
          <NavLink key={f.id} to={`/folder/${f.id}`} onClick={onNavigate} className={navLinkClass}>
            <FolderIcon className="h-[18px] w-[18px] text-amber-500" fill="currentColor" />
            <span className="truncate">{f.name}</span>
          </NavLink>
        ))
      )}
    </div>
  );
}

function ActivityPanel({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="flex flex-col gap-1">
      <NavLink to="/recent" onClick={onNavigate} className={navLinkClass}>
        <Clock className="h-[18px] w-[18px]" /> Recent
      </NavLink>
      <NavLink to="/starred" onClick={onNavigate} className={navLinkClass}>
        <Star className="h-[18px] w-[18px]" /> Starred
      </NavLink>
    </div>
  );
}

function MorePanel() {
  const { user, logout } = useAuth();
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl bg-white/60 p-3 dark:bg-white/10">
        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
          {user?.displayName}
        </p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
      </div>
      <a
        href="http://localhost:8080/swagger-ui.html"
        target="_blank"
        rel="noreferrer"
        className={navLinkClass({ isActive: false })}
      >
        API docs
      </a>
      <button onClick={logout} className="btn-ghost justify-start !text-red-600">
        <LogOut className="h-4 w-4" /> Log out
      </button>
    </div>
  );
}

function UploadButton({
  onPick,
  onDone,
}: {
  onPick: (files: File[]) => void;
  onDone: () => void;
}) {
  let input: HTMLInputElement | null = null;
  return (
    <>
      <button
        className="btn-primary mb-2 w-full"
        onClick={() => input?.click()}
      >
        <Upload className="h-4 w-4" /> Upload
      </button>
      <input
        ref={(el) => (input = el)}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) {
            onPick(Array.from(e.target.files));
            e.target.value = "";
            onDone();
          }
        }}
      />
    </>
  );
}
