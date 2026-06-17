package com.cloudbox.file.dto;

import com.cloudbox.file.FileEntity;

import java.time.Instant;

public record FileResponse(
        Long id,
        String type,
        String name,
        long size,
        String contentType,
        Long folderId,
        boolean starred,
        Instant deletedAt,
        Instant createdAt,
        Instant updatedAt
) {
    public static FileResponse from(FileEntity f) {
        return new FileResponse(
                f.getId(), "file", f.getName(), f.getSize(), f.getContentType(),
                f.getFolderId(), f.isStarred(), f.getDeletedAt(), f.getCreatedAt(), f.getUpdatedAt());
    }
}
