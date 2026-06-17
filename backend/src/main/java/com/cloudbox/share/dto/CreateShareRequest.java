package com.cloudbox.share.dto;

import com.cloudbox.share.SharePermission;

import java.time.Instant;

/** Create a share for exactly one of fileId / folderId. */
public record CreateShareRequest(
        Long fileId,
        Long folderId,
        SharePermission permission,
        Instant expiresAt
) {
}
