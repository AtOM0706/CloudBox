package com.cloudbox.file.dto;

import jakarta.validation.constraints.Size;

/** Partial update: rename, move (parentId), and/or star. Null fields are ignored. */
public record UpdateFolderRequest(
        @Size(max = 255) String name,
        Long parentId,
        Boolean starred
) {
}
