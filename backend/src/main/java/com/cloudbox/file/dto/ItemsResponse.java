package com.cloudbox.file.dto;

import java.util.List;

/** Generic bundle of folders + files, used by search, trash, and starred views. */
public record ItemsResponse(
        List<FolderResponse> folders,
        List<FileResponse> files
) {
}
