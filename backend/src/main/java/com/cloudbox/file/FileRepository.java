package com.cloudbox.file;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FileRepository extends JpaRepository<FileEntity, Long> {

    Optional<FileEntity> findByIdAndOwnerId(Long id, Long ownerId);

    // Active (non-trashed) listing
    List<FileEntity> findByOwnerIdAndFolderIdAndDeletedAtIsNullOrderByNameAsc(Long ownerId, Long folderId);

    List<FileEntity> findByOwnerIdAndFolderIdIsNullAndDeletedAtIsNullOrderByNameAsc(Long ownerId);

    // Views
    List<FileEntity> findByOwnerIdAndStarredTrueAndDeletedAtIsNullOrderByNameAsc(Long ownerId);

    List<FileEntity> findByOwnerIdAndDeletedAtIsNotNullOrderByDeletedAtDesc(Long ownerId);

    List<FileEntity> findTop50ByOwnerIdAndDeletedAtIsNullOrderByUpdatedAtDesc(Long ownerId);

    List<FileEntity> findByOwnerIdAndDeletedAtIsNullAndContentTypeStartingWithIgnoreCaseOrderByUpdatedAtDesc(
            Long ownerId, String contentTypePrefix);

    List<FileEntity> findByOwnerIdAndDeletedAtIsNullAndNameContainingIgnoreCaseOrderByNameAsc(Long ownerId, String name);
}
