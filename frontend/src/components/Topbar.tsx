import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { LayoutGrid, List, LogOut, Menu, Moon, Search, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../theme/ThemeProvider";
import { cn } from "../lib/cn";
import { useAppUi } from "./appUi";

export default function Topbar({ onOpenNav }: { onOpenNav: () => void }) {
  const { view, setView, search, setSearch } = useAppUi();
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const initials = (user?.displayName || user?.email || "?")
    .slice(0, 1)
    .toUpperCase();

  return (
    <header className="glass m-3 mb-0 flex items-center gap-3 rounded-2xl px-3 py-2.5 md:px-4">
      <button className="md:hidden" onClick={onOpenNav} aria-label="Open menu">
        <Menu className="h-5 w-5 text-slate-600 dark:text-slate-300" />
      </button>

      <div className="relative flex-1 max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (e.target.value) navigate("/");
          }}
          placeholder="Search files and folders…"
          className="input pl-9"
        />
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggle}
        className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-white/60 dark:text-slate-300 dark:hover:bg-white/10"
        aria-label="Toggle dark mode"
        title={theme === "dark" ? "Switch to light" : "Switch to dark"}
      >
        {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      <div className="flex items-center gap-1 rounded-xl border border-white/50 bg-white/40 p-1 dark:border-white/10 dark:bg-white/5">
        <button
          onClick={() => setView("grid")}
          className={cn(
            "rounded-lg p-1.5 transition-colors",
            view === "grid"
              ? "bg-white text-brand shadow-sm dark:bg-white/15"
              : "text-slate-500 dark:text-slate-400"
          )}
          aria-label="Grid view"
        >
          <LayoutGrid className="h-4 w-4" />
        </button>
        <button
          onClick={() => setView("list")}
          className={cn(
            "rounded-lg p-1.5 transition-colors",
            view === "list"
              ? "bg-white text-brand shadow-sm dark:bg-white/15"
              : "text-slate-500 dark:text-slate-400"
          )}
          aria-label="List view"
        >
          <List className="h-4 w-4" />
        </button>
      </div>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white shadow-md outline-none"
            aria-label="Account menu"
          >
            {initials}
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={8}
            className="glass-strong z-50 min-w-52 rounded-xl p-1.5 animate-scale-in"
          >
            <div className="px-3 py-2">
              <div className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                {user?.displayName}
              </div>
              <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                {user?.email}
              </div>
            </div>
            <DropdownMenu.Separator className="my-1 h-px bg-white/60 dark:bg-white/10" />
            <DropdownMenu.Item
              onSelect={logout}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 outline-none hover:bg-white/70 dark:text-red-400 dark:hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </header>
  );
}
