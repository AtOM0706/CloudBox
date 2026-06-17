package com.cloudbox.storage;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "storage")
public record StorageProperties(
        /** Internal endpoint the backend uses for S3 operations (e.g. http://minio:9000). */
        String endpoint,
        /**
         * Browser-reachable endpoint used when signing URLs for preview/download.
         * Must be an address the user's browser can hit (e.g. http://localhost:9000 in dev).
         */
        String publicEndpoint,
        String accessKey,
        String secretKey,
        String bucket,
        String region,
        long quotaBytes
) {
    /** Falls back to the internal endpoint if no public endpoint is configured. */
    public String effectivePublicEndpoint() {
        return (publicEndpoint == null || publicEndpoint.isBlank()) ? endpoint : publicEndpoint;
    }
}
