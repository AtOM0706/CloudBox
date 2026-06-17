package com.cloudbox.file.dto;

import com.cloudbox.file.Folder;

import java.time.Instant;

public record FolderResponse(
        Long id,
        String type,
        String name,
        Long parentFolderId,
        boolean starred,
        Instant deletedAt,
        Instant createdAt,
        Instant updatedAt
) {
    public static FolderResponse from(Folder f) {
        return new FolderResponse(
                f.getId(), "folder", f.getName(), f.getParentFolderId(),
                f.isStarred(), f.getDeletedAt(), f.getCreatedAt(), f.getUpdatedAt());
    }
}
