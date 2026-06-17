package com.cloudbox.file.dto;

import jakarta.validation.constraints.Size;

/** Partial update: rename, move (folderId), and/or star. Null fields are ignored. */
public record UpdateFileRequest(
        @Size(max = 255) String name,
        Long folderId,
        Boolean starred
) {
}
