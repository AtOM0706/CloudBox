import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "./client";
import type {
  FolderContents,
  FolderItem,
  Items,
  ShareResponse,
  UserResponse,
} from "./types";

export const qk = {
  me: ["me"] as const,
  contents: (folderId: number | null) => ["contents", folderId] as const,
  allFolders: ["folders-all"] as const,
  trash: ["trash"] as const,
  starred: ["starred"] as const,
  recent: ["recent"] as const,
  search: (q: string) => ["search", q] as const,
  shares: ["shares"] as const,
};

// ---- Queries ----

export function useCurrentUser() {
  return useQuery({
    queryKey: qk.me,
    queryFn: async () => (await api.get<UserResponse>("/auth/me")).data,
  });
}

export function useAuthConfig() {
  return useQuery({
    queryKey: ["auth-config"],
    queryFn: async () =>
      (await api.get<{ googleEnabled: boolean }>("/auth/config")).data,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFolderContents(folderId: number | null) {
  return useQuery({
    queryKey: qk.contents(folderId),
    queryFn: async () => {
      const url = folderId == null ? "/folders" : `/folders/${folderId}`;
      return (await api.get<FolderContents>(url)).data;
    },
  });
}

/** Flat list of every folder the user has (for the Folders view and move pickers). */
export function useAllFolders() {
  return useQuery({
    queryKey: qk.allFolders,
    queryFn: async () => (await api.get<FolderItem[]>("/folders/all")).data,
  });
}

export function useTrash() {
  return useQuery({
    queryKey: qk.trash,
    queryFn: async () => (await api.get<Items>("/trash")).data,
  });
}

export function useStarred() {
  return useQuery({
    queryKey: qk.starred,
    queryFn: async () => (await api.get<Items>("/starred")).data,
  });
}

export function useRecent() {
  return useQuery({
    queryKey: qk.recent,
    queryFn: async () => (await api.get<Items["files"]>("/files/recent")).data,
  });
}

export function usePhotos() {
  return useQuery({
    queryKey: ["photos"],
    queryFn: async () => (await api.get<Items["files"]>("/files/photos")).data,
  });
}

export function useSearch(q: string) {
  return useQuery({
    queryKey: qk.search(q),
    queryFn: async () => (await api.get<Items>("/search", { params: { q } })).data,
    enabled: q.trim().length > 0,
  });
}

export function useShares() {
  return useQuery({
    queryKey: qk.shares,
    queryFn: async () => (await api.get<ShareResponse[]>("/shares")).data,
  });
}

// ---- Mutations ----

function useInvalidateAll() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["contents"] });
    qc.invalidateQueries({ queryKey: qk.allFolders });
    qc.invalidateQueries({ queryKey: qk.trash });
    qc.invalidateQueries({ queryKey: qk.starred });
    qc.invalidateQueries({ queryKey: qk.recent });
    qc.invalidateQueries({ queryKey: qk.me });
  };
}

export function useCreateFolder() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async (vars: { name: string; parentId: number | null }) =>
      (await api.post("/folders", vars)).data,
    onSuccess: invalidate,
  });
}

export function useUpdateItem() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async (vars: {
      kind: "file" | "folder";
      id: number;
      body: Record<string, unknown>;
    }) => {
      const base = vars.kind === "file" ? "/files" : "/folders";
      return (await api.patch(`${base}/${vars.id}`, vars.body)).data;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteItem() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async (vars: { kind: "file" | "folder"; id: number }) => {
      const base = vars.kind === "file" ? "/files" : "/folders";
      return (await api.delete(`${base}/${vars.id}`)).data;
    },
    onSuccess: invalidate,
  });
}

export function useRestoreItem() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async (vars: { kind: "file" | "folder"; id: number }) => {
      const base = vars.kind === "file" ? "/files" : "/folders";
      return (await api.post(`${base}/${vars.id}/restore`)).data;
    },
    onSuccess: invalidate,
  });
}

export function usePermanentDelete() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async (vars: { id: number }) =>
      (await api.delete(`/files/${vars.id}/permanent`)).data,
    onSuccess: invalidate,
  });
}

export function useBulkAction() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async (vars: {
      action: "DELETE" | "RESTORE" | "MOVE";
      fileIds: number[];
      folderIds: number[];
      targetFolderId?: number | null;
    }) => (await api.post("/files/bulk", vars)).data,
    onSuccess: invalidate,
  });
}

export function useCreateShare() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      fileId?: number;
      folderId?: number;
      permission: "VIEW" | "EDIT";
      expiresAt?: string | null;
    }) => (await api.post<ShareResponse>("/shares", vars)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.shares }),
  });
}

export function useRevokeShare() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => (await api.delete(`/shares/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.shares }),
  });
}

/** Fetches a short-lived presigned URL for preview/download. */
export async function fetchPreviewUrl(fileId: number, download = false): Promise<string> {
  const res = await api.get<{ url: string }>(`/files/${fileId}/preview-url`, {
    params: { download },
  });
  return res.data.url;
}
