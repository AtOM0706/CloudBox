package com.cloudbox.file;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FolderRepository extends JpaRepository<Folder, Long> {

    Optional<Folder> findByIdAndOwnerId(Long id, Long ownerId);

    // Active (non-trashed) listing
    List<Folder> findByOwnerIdAndParentFolderIdAndDeletedAtIsNullOrderByNameAsc(Long ownerId, Long parentFolderId);

    List<Folder> findByOwnerIdAndParentFolderIdIsNullAndDeletedAtIsNullOrderByNameAsc(Long ownerId);

    // Flat list of every active folder (for move pickers / Folders view)
    List<Folder> findByOwnerIdAndDeletedAtIsNullOrderByNameAsc(Long ownerId);

    // Views
    List<Folder> findByOwnerIdAndStarredTrueAndDeletedAtIsNullOrderByNameAsc(Long ownerId);

    List<Folder> findByOwnerIdAndDeletedAtIsNotNullOrderByDeletedAtDesc(Long ownerId);

    List<Folder> findByOwnerIdAndDeletedAtIsNullAndNameContainingIgnoreCaseOrderByNameAsc(Long ownerId, String name);
}
