package com.cloudbox.share;

import com.cloudbox.common.ApiException;
import com.cloudbox.file.FileEntity;
import com.cloudbox.file.FileRepository;
import com.cloudbox.file.Folder;
import com.cloudbox.file.FolderRepository;
import com.cloudbox.file.dto.FileResponse;
import com.cloudbox.file.dto.FolderResponse;
import com.cloudbox.file.dto.ItemsResponse;
import com.cloudbox.share.dto.CreateShareRequest;
import com.cloudbox.share.dto.PublicShareResponse;
import com.cloudbox.share.dto.ShareResponse;
import com.cloudbox.storage.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ShareService {

    private static final Duration PRESIGN_TTL = Duration.ofMinutes(15);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final ShareRepository shareRepository;
    private final FileRepository fileRepository;
    private final FolderRepository folderRepository;
    private final StorageService storageService;

    @Transactional
    public ShareResponse create(Long ownerId, CreateShareRequest req) {
        boolean hasFile = req.fileId() != null;
        boolean hasFolder = req.folderId() != null;
        if (hasFile == hasFolder) {
            throw ApiException.badRequest("Provide exactly one of fileId or folderId");
        }

        if (hasFile) {
            fileRepository.findByIdAndOwnerId(req.fileId(), ownerId)
                    .orElseThrow(() -> ApiException.notFound("File not found"));
        } else {
            folderRepository.findByIdAndOwnerId(req.folderId(), ownerId)
                    .orElseThrow(() -> ApiException.notFound("Folder not found"));
        }

        Share share = Share.builder()
                .fileId(req.fileId())
                .folderId(req.folderId())
                .token(generateToken())
                .permission(req.permission() != null ? req.permission() : SharePermission.VIEW)
                .expiresAt(req.expiresAt())
                .createdBy(ownerId)
                .build();
        return ShareResponse.from(shareRepository.save(share));
    }

    @Transactional(readOnly = true)
    public List<ShareResponse> listMine(Long ownerId) {
        return shareRepository.findByCreatedByOrderByCreatedAtDesc(ownerId)
                .stream().map(ShareResponse::from).toList();
    }

    @Transactional
    public void revoke(Long ownerId, Long shareId) {
        Share share = shareRepository.findByIdAndCreatedBy(shareId, ownerId)
                .orElseThrow(() -> ApiException.notFound("Share not found"));
        shareRepository.delete(share);
    }

    /** Public resolution of a share token — no authentication required. */
    @Transactional(readOnly = true)
    public PublicShareResponse resolve(String token) {
        Share share = shareRepository.findByToken(token)
                .orElseThrow(() -> ApiException.notFound("Share link not found"));
        if (share.isExpired()) {
            throw new ApiException(org.springframework.http.HttpStatus.GONE, "This share link has expired");
        }

        if (share.getFileId() != null) {
            FileEntity file = fileRepository.findById(share.getFileId())
                    .filter(f -> f.getDeletedAt() == null)
                    .orElseThrow(() -> ApiException.notFound("Shared file no longer exists"));
            String url = storageService.presignedGetUrl(file.getObjectKey(), PRESIGN_TTL, file.getName());
            return PublicShareResponse.forFile(
                    share.getPermission(), share.getExpiresAt(), FileResponse.from(file), url);
        }

        Folder folder = folderRepository.findById(share.getFolderId())
                .filter(f -> f.getDeletedAt() == null)
                .orElseThrow(() -> ApiException.notFound("Shared folder no longer exists"));
        Long ownerId = folder.getOwnerId();
        List<FolderResponse> subfolders = folderRepository
                .findByOwnerIdAndParentFolderIdAndDeletedAtIsNullOrderByNameAsc(ownerId, folder.getId())
                .stream().map(FolderResponse::from).toList();
        List<FileResponse> files = fileRepository
                .findByOwnerIdAndFolderIdAndDeletedAtIsNullOrderByNameAsc(ownerId, folder.getId())
                .stream().map(FileResponse::from).toList();
        return PublicShareResponse.forFolder(
                share.getPermission(), share.getExpiresAt(),
                FolderResponse.from(folder), new ItemsResponse(subfolders, files));
    }

    private String generateToken() {
        byte[] bytes = new byte[24];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
