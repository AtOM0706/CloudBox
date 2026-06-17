package com.cloudbox.file.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record BulkActionRequest(
        @NotNull Action action,
        List<Long> fileIds,
        List<Long> folderIds,
        /** Target folder for MOVE (null = root). */
        Long targetFolderId
) {
    public enum Action {
        DELETE,   // soft-delete to trash
        RESTORE,  // restore from trash
        MOVE      // move into targetFolderId
    }

    public List<Long> safeFileIds() {
        return fileIds == null ? List.of() : fileIds;
    }

    public List<Long> safeFolderIds() {
        return folderIds == null ? List.of() : folderIds;
    }
}
