package com.cloudbox.file;

import com.cloudbox.common.ApiException;
import com.cloudbox.file.dto.BulkActionRequest;
import com.cloudbox.file.dto.FileResponse;
import com.cloudbox.file.dto.UpdateFileRequest;
import com.cloudbox.storage.StorageService;
import com.cloudbox.user.User;
import com.cloudbox.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileService {

    private static final Duration PRESIGN_TTL = Duration.ofMinutes(15);

    private final FileRepository fileRepository;
    private final FolderRepository folderRepository;
    private final FolderService folderService;
    private final UserRepository userRepository;
    private final StorageService storageService;

    @Transactional(readOnly = true)
    public FileEntity requireOwned(Long fileId, Long ownerId) {
        return fileRepository.findByIdAndOwnerId(fileId, ownerId)
                .orElseThrow(() -> ApiException.notFound("File not found"));
    }

    @Transactional
    public FileResponse upload(Long ownerId, Long folderId, MultipartFile multipart) {
        if (multipart == null || multipart.isEmpty()) {
            throw ApiException.badRequest("No file provided");
        }
        if (folderId != null) {
            folderRepository.findByIdAndOwnerId(folderId, ownerId)
                    .orElseThrow(() -> ApiException.notFound("Target folder not found"));
        }

        User user = userRepository.findById(ownerId)
                .orElseThrow(() -> ApiException.notFound("User not found"));
        long size = multipart.getSize();
        if (user.getStorageUsed() + size > user.getStorageQuota()) {
            throw new ApiException(org.springframework.http.HttpStatus.PAYLOAD_TOO_LARGE,
                    "Storage quota exceeded");
        }

        String objectKey = ownerId + "/" + UUID.randomUUID();
        String contentType = multipart.getContentType() != null
                ? multipart.getContentType() : "application/octet-stream";

        try (InputStream in = multipart.getInputStream()) {
            storageService.upload(objectKey, in, size, contentType);
        } catch (IOException e) {
            throw ApiException.badRequest("Could not read uploaded file");
        }

        FileEntity file = FileEntity.builder()
                .ownerId(ownerId)
                .folderId(folderId)
                .name(sanitizeName(multipart.getOriginalFilename()))
                .objectKey(objectKey)
                .size(size)
                .contentType(contentType)
                .starred(false)
                .build();
        file = fileRepository.save(file);

        user.setStorageUsed(user.getStorageUsed() + size);
        userRepository.save(user);

        return FileResponse.from(file);
    }

    private String sanitizeName(String original) {
        if (original == null || original.isBlank()) return "untitled";
        // strip any path components a browser might send
        String name = original.replace("\\", "/");
        int slash = name.lastIndexOf('/');
        return slash >= 0 ? name.substring(slash + 1) : name;
    }

    /** Opens a stream for download. Caller is responsible for closing it. */
    @Transactional(readOnly = true)
    public InputStream openStream(Long ownerId, Long fileId) {
        FileEntity file = requireOwned(fileId, ownerId);
        return storageService.download(file.getObjectKey());
    }

    @Transactional(readOnly = true)
    public String presignedUrl(Long ownerId, Long fileId, boolean asAttachment) {
        FileEntity file = requireOwned(fileId, ownerId);
        return storageService.presignedGetUrl(
                file.getObjectKey(), PRESIGN_TTL, asAttachment ? file.getName() : null);
    }

    @Transactional
    public FileResponse update(Long ownerId, Long fileId, UpdateFileRequest req) {
        FileEntity file = requireOwned(fileId, ownerId);
        if (req.name() != null && !req.name().isBlank()) {
            file.setName(req.name().trim());
        }
        if (req.starred() != null) {
            file.setStarred(req.starred());
        }
        if (req.folderId() != null) {
            folderRepository.findByIdAndOwnerId(req.folderId(), ownerId)
                    .orElseThrow(() -> ApiException.notFound("Target folder not found"));
            file.setFolderId(req.folderId());
        }
        return FileResponse.from(fileRepository.save(file));
    }

    @Transactional
    public void softDelete(Long ownerId, Long fileId) {
        FileEntity file = requireOwned(fileId, ownerId);
        file.setDeletedAt(Instant.now());
        fileRepository.save(file);
    }

    @Transactional
    public FileResponse restore(Long ownerId, Long fileId) {
        FileEntity file = requireOwned(fileId, ownerId);
        file.setDeletedAt(null);
        // if parent folder is trashed, restore to root
        if (file.getFolderId() != null) {
            folderRepository.findByIdAndOwnerId(file.getFolderId(), ownerId)
                    .filter(f -> f.getDeletedAt() != null)
                    .ifPresent(f -> file.setFolderId(null));
        }
        return FileResponse.from(fileRepository.save(file));
    }

    /** Permanently removes the object from storage and the metadata row; frees quota. */
    @Transactional
    public void permanentDelete(Long ownerId, Long fileId) {
        FileEntity file = requireOwned(fileId, ownerId);
        storageService.delete(file.getObjectKey());
        fileRepository.delete(file);
        userRepository.findById(ownerId).ifPresent(u -> {
            u.setStorageUsed(Math.max(0, u.getStorageUsed() - file.getSize()));
            userRepository.save(u);
        });
    }

    @Transactional(readOnly = true)
    public List<FileResponse> recent(Long ownerId) {
        return fileRepository.findTop50ByOwnerIdAndDeletedAtIsNullOrderByUpdatedAtDesc(ownerId)
                .stream().map(FileResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<FileResponse> starred(Long ownerId) {
        return fileRepository.findByOwnerIdAndStarredTrueAndDeletedAtIsNullOrderByNameAsc(ownerId)
                .stream().map(FileResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<FileResponse> photos(Long ownerId) {
        return fileRepository
                .findByOwnerIdAndDeletedAtIsNullAndContentTypeStartingWithIgnoreCaseOrderByUpdatedAtDesc(ownerId, "image/")
                .stream().map(FileResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<FileResponse> trash(Long ownerId) {
        return fileRepository.findByOwnerIdAndDeletedAtIsNotNullOrderByDeletedAtDesc(ownerId)
                .stream().map(FileResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<FileResponse> search(Long ownerId, String q) {
        return fileRepository.findByOwnerIdAndDeletedAtIsNullAndNameContainingIgnoreCaseOrderByNameAsc(ownerId, q)
                .stream().map(FileResponse::from).toList();
    }

    @Transactional
    public void bulk(Long ownerId, BulkActionRequest req) {
        switch (req.action()) {
            case DELETE -> {
                req.safeFileIds().forEach(id -> softDelete(ownerId, id));
                req.safeFolderIds().forEach(id -> folderService.softDelete(ownerId, id));
            }
            case RESTORE -> {
                req.safeFileIds().forEach(id -> restore(ownerId, id));
                req.safeFolderIds().forEach(id -> folderService.restore(ownerId, id));
            }
            case MOVE -> {
                if (req.targetFolderId() != null) {
                    folderRepository.findByIdAndOwnerId(req.targetFolderId(), ownerId)
                            .orElseThrow(() -> ApiException.notFound("Target folder not found"));
                }
                req.safeFileIds().forEach(id -> {
                    FileEntity f = requireOwned(id, ownerId);
                    f.setFolderId(req.targetFolderId());
                    fileRepository.save(f);
                });
                req.safeFolderIds().forEach(id -> {
                    Folder folder = folderService.requireOwned(id, ownerId);
                    folderService.moveFolder(ownerId, folder, req.targetFolderId());
                    folderRepository.save(folder);
                });
            }
        }
    }
}
