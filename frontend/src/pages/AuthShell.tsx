import { Cloud } from "lucide-react";
import type { ReactNode } from "react";

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="glass-strong grid w-full max-w-4xl overflow-hidden rounded-3xl md:grid-cols-2">
        {/* Brand panel */}
        <div className="hidden flex-col justify-between bg-gradient-to-br from-brand to-indigo-600 p-10 text-white md:flex">
          <div className="flex items-center gap-2">
            <Cloud className="h-8 w-8" fill="currentColor" />
            <span className="text-2xl font-bold">CloudBox</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold leading-tight">
              Your files, everywhere.
            </h2>
            <p className="mt-3 text-white/80">
              Upload, organize, preview, and share — all in one beautifully simple
              place.
            </p>
          </div>
          <p className="text-xs text-white/60">
            Spring Boot · React · MinIO · Docker
          </p>
        </div>

        {/* Form panel */}
        <div className="p-8 sm:p-10">
          <div className="mb-6 flex items-center gap-2 md:hidden">
            <Cloud className="h-7 w-7 text-brand" fill="currentColor" />
            <span className="text-xl font-bold text-slate-800 dark:text-slate-100">CloudBox</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{title}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          <div className="mt-6">{children}</div>
          <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">{footer}</div>
        </div>
      </div>
    </div>
  );
}
