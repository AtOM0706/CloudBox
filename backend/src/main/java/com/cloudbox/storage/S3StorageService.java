package com.cloudbox.storage;

import com.cloudbox.common.ApiException;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.io.InputStream;
import java.time.Duration;

@Service
@RequiredArgsConstructor
@Slf4j
public class S3StorageService implements StorageService {

    private final S3Client s3;
    private final S3Presigner presigner;
    private final StorageProperties props;

    /** Make sure the bucket exists at startup (it is also created by minio-init). */
    @PostConstruct
    void ensureBucket() {
        try {
            s3.headBucket(HeadBucketRequest.builder().bucket(props.bucket()).build());
        } catch (NoSuchBucketException e) {
            log.info("Bucket '{}' not found — creating it", props.bucket());
            s3.createBucket(CreateBucketRequest.builder().bucket(props.bucket()).build());
        } catch (Exception e) {
            log.warn("Could not verify bucket '{}' at startup: {}", props.bucket(), e.getMessage());
        }
    }

    @Override
    public void upload(String key, InputStream data, long size, String contentType) {
        try {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(props.bucket())
                    .key(key)
                    .contentType(contentType)
                    .build();
            s3.putObject(request, RequestBody.fromInputStream(data, size));
        } catch (Exception e) {
            throw new ApiException(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to store file: " + e.getMessage());
        }
    }

    @Override
    public InputStream download(String key) {
        GetObjectRequest request = GetObjectRequest.builder()
                .bucket(props.bucket())
                .key(key)
                .build();
        return s3.getObject(request);
    }

    @Override
    public void delete(String key) {
        try {
            s3.deleteObject(DeleteObjectRequest.builder()
                    .bucket(props.bucket())
                    .key(key)
                    .build());
        } catch (Exception e) {
            log.warn("Failed to delete object '{}': {}", key, e.getMessage());
        }
    }

    @Override
    public String presignedGetUrl(String key, Duration ttl, String downloadFilename) {
        GetObjectRequest.Builder getReq = GetObjectRequest.builder()
                .bucket(props.bucket())
                .key(key);
        if (downloadFilename != null) {
            getReq.responseContentDisposition(
                    "attachment; filename=\"" + downloadFilename.replace("\"", "") + "\"");
        }
        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(ttl)
                .getObjectRequest(getReq.build())
                .build();
        return presigner.presignGetObject(presignRequest).url().toString();
    }
}
