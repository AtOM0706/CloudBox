package com.cloudbox.share.dto;

import com.cloudbox.file.dto.FileResponse;
import com.cloudbox.file.dto.FolderResponse;
import com.cloudbox.file.dto.ItemsResponse;
import com.cloudbox.share.SharePermission;

import java.time.Instant;

/**
 * Public view of a shared item (no auth required). For a file, {@code downloadUrl}
 * is a short-lived presigned URL. For a folder, {@code contents} lists its items.
 */
public record PublicShareResponse(
        String type,                 // "file" | "folder"
        SharePermission permission,
        Instant expiresAt,
        FileResponse file,
        String downloadUrl,
        FolderResponse folder,
        ItemsResponse contents
) {
    public static PublicShareResponse forFile(SharePermission permission, Instant expiresAt,
                                              FileResponse file, String downloadUrl) {
        return new PublicShareResponse("file", permission, expiresAt, file, downloadUrl, null, null);
    }

    public static PublicShareResponse forFolder(SharePermission permission, Instant expiresAt,
                                                FolderResponse folder, ItemsResponse contents) {
        return new PublicShareResponse("folder", permission, expiresAt, null, null, folder, contents);
    }
}
