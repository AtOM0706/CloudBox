package com.cloudbox.storage;

import java.io.InputStream;
import java.time.Duration;

/**
 * Storage abstraction for file bytes. The S3/MinIO implementation is the default;
 * the interface keeps the backend swappable (e.g. real AWS S3, Cloudflare R2).
 */
public interface StorageService {

    /** Stores an object and returns nothing; the caller owns the key. */
    void upload(String key, InputStream data, long size, String contentType);

    /** Opens a stream to read an object's bytes. Caller must close it. */
    InputStream download(String key);

    /** Removes an object. No-op if it does not exist. */
    void delete(String key);

    /**
     * Generates a short-lived presigned GET URL so the browser can fetch the
     * object directly from storage (used for previews and downloads).
     *
     * @param downloadFilename if non-null, forces a Content-Disposition attachment
     */
    String presignedGetUrl(String key, Duration ttl, String downloadFilename);
}
