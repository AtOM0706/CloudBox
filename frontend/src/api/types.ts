export interface UserResponse {
  id: number;
  email: string;
  displayName: string;
  storageUsed: number;
  storageQuota: number;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  expiresInMs: number;
  user: UserResponse;
}

export interface FileItem {
  id: number;
  type: "file";
  name: string;
  size: number;
  contentType: string | null;
  folderId: number | null;
  starred: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FolderItem {
  id: number;
  type: "folder";
  name: string;
  parentFolderId: number | null;
  starred: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AnyItem = FileItem | FolderItem;

export interface Breadcrumb {
  id: number;
  name: string;
}

export interface FolderContents {
  folderId: number | null;
  breadcrumbs: Breadcrumb[];
  folders: FolderItem[];
  files: FileItem[];
}

export interface Items {
  folders: FolderItem[];
  files: FileItem[];
}

export type SharePermission = "VIEW" | "EDIT";

export interface ShareResponse {
  id: number;
  token: string;
  permission: SharePermission;
  expiresAt: string | null;
  fileId: number | null;
  folderId: number | null;
  createdAt: string;
}

export interface PublicShare {
  type: "file" | "folder";
  permission: SharePermission;
  expiresAt: string | null;
  file: FileItem | null;
  downloadUrl: string | null;
  folder: FolderItem | null;
  contents: Items | null;
}
