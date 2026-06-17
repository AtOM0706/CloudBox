package com.cloudbox.share.dto;

import com.cloudbox.share.Share;
import com.cloudbox.share.SharePermission;

import java.time.Instant;

public record ShareResponse(
        Long id,
        String token,
        SharePermission permission,
        Instant expiresAt,
        Long fileId,
        Long folderId,
        Instant createdAt
) {
    public static ShareResponse from(Share s) {
        return new ShareResponse(
                s.getId(), s.getToken(), s.getPermission(), s.getExpiresAt(),
                s.getFileId(), s.getFolderId(), s.getCreatedAt());
    }
}
