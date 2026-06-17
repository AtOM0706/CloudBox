import {
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  FileSpreadsheet,
  File as FileGeneric,
  type LucideIcon,
} from "lucide-react";

export function isPreviewableImage(contentType: string | null, name: string): boolean {
  if (contentType?.startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(name);
}

export function isPreviewablePdf(contentType: string | null, name: string): boolean {
  return contentType === "application/pdf" || /\.pdf$/i.test(name);
}

export function isPreviewableText(contentType: string | null, name: string): boolean {
  if (contentType?.startsWith("text/")) return true;
  return /\.(txt|md|json|csv|log|xml|ya?ml)$/i.test(name);
}

export function iconForFile(contentType: string | null, name: string): LucideIcon {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (isPreviewableImage(contentType, name)) return FileImage;
  if (contentType?.startsWith("video/") || /\.(mp4|mov|webm|mkv|avi)$/i.test(name))
    return FileVideo;
  if (contentType?.startsWith("audio/") || /\.(mp3|wav|flac|ogg|m4a)$/i.test(name))
    return FileAudio;
  if (/\.(zip|rar|7z|tar|gz)$/i.test(name)) return FileArchive;
  if (/\.(csv|xlsx?|tsv)$/i.test(name)) return FileSpreadsheet;
  if (["js", "ts", "tsx", "jsx", "java", "py", "go", "rs", "c", "cpp", "html", "css", "json", "xml", "yml", "yaml", "sh"].includes(ext))
    return FileCode;
  if (isPreviewablePdf(contentType, name) || isPreviewableText(contentType, name))
    return FileText;
  return FileGeneric;
}
