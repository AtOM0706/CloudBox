package com.cloudbox.user.dto;

import com.cloudbox.user.User;

public record UserResponse(
        Long id,
        String email,
        String displayName,
        long storageUsed,
        long storageQuota
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getStorageUsed(),
                user.getStorageQuota());
    }
}
