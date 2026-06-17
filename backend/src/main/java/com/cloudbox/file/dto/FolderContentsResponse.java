package com.cloudbox.file.dto;

import java.util.List;

public record FolderContentsResponse(
        Long folderId,
        List<Breadcrumb> breadcrumbs,
        List<FolderResponse> folders,
        List<FileResponse> files
) {
}
