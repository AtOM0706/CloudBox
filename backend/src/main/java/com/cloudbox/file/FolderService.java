package com.cloudbox.file;

import com.cloudbox.common.ApiException;
import com.cloudbox.file.dto.Breadcrumb;
import com.cloudbox.file.dto.CreateFolderRequest;
import com.cloudbox.file.dto.FileResponse;
import com.cloudbox.file.dto.FolderContentsResponse;
import com.cloudbox.file.dto.FolderResponse;
import com.cloudbox.file.dto.UpdateFolderRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FolderService {

    private final FolderRepository folderRepository;
    private final FileRepository fileRepository;

    @Transactional(readOnly = true)
    public Folder requireOwned(Long folderId, Long ownerId) {
        return folderRepository.findByIdAndOwnerId(folderId, ownerId)
                .orElseThrow(() -> ApiException.notFound("Folder not found"));
    }

    @Transactional
    public FolderResponse create(Long ownerId, CreateFolderRequest req) {
        if (req.parentId() != null) {
            requireOwned(req.parentId(), ownerId); // validate parent ownership/existence
        }
        Folder folder = Folder.builder()
                .ownerId(ownerId)
                .parentFolderId(req.parentId())
                .name(req.name().trim())
                .starred(false)
                .build();
        return FolderResponse.from(folderRepository.save(folder));
    }

    /** Lists the active contents of a folder (null id = root) with breadcrumbs. */
    @Transactional(readOnly = true)
    public FolderContentsResponse contents(Long ownerId, Long folderId) {
        List<Folder> folders;
        List<FileEntity> files;
        List<Breadcrumb> breadcrumbs = new ArrayList<>();

        if (folderId == null) {
            folders = folderRepository.findByOwnerIdAndParentFolderIdIsNullAndDeletedAtIsNullOrderByNameAsc(ownerId);
            files = fileRepository.findByOwnerIdAndFolderIdIsNullAndDeletedAtIsNullOrderByNameAsc(ownerId);
        } else {
            requireOwned(folderId, ownerId);
            folders = folderRepository.findByOwnerIdAndParentFolderIdAndDeletedAtIsNullOrderByNameAsc(ownerId, folderId);
            files = fileRepository.findByOwnerIdAndFolderIdAndDeletedAtIsNullOrderByNameAsc(ownerId, folderId);
            breadcrumbs = buildBreadcrumbs(folderId, ownerId);
        }

        return new FolderContentsResponse(
                folderId,
                breadcrumbs,
                folders.stream().map(FolderResponse::from).toList(),
                files.stream().map(FileResponse::from).toList());
    }

    private List<Breadcrumb> buildBreadcrumbs(Long folderId, Long ownerId) {
        Deque<Breadcrumb> trail = new ArrayDeque<>();
        Long current = folderId;
        int guard = 0;
        while (current != null && guard++ < 100) {
            Folder f = folderRepository.findByIdAndOwnerId(current, ownerId).orElse(null);
            if (f == null) break;
            trail.addFirst(new Breadcrumb(f.getId(), f.getName()));
            current = f.getParentFolderId();
        }
        return new ArrayList<>(trail);
    }

    @Transactional
    public FolderResponse update(Long ownerId, Long folderId, UpdateFolderRequest req) {
        Folder folder = requireOwned(folderId, ownerId);

        if (req.name() != null && !req.name().isBlank()) {
            folder.setName(req.name().trim());
        }
        if (req.starred() != null) {
            folder.setStarred(req.starred());
        }
        // PATCH with a non-null parentId moves the folder; moving to root uses the bulk MOVE action.
        if (req.parentId() != null) {
            moveFolder(ownerId, folder, req.parentId());
        }
        return FolderResponse.from(folderRepository.save(folder));
    }

    /** Moves a folder under newParentId (null = root), guarding against cycles. Used by PATCH and bulk MOVE. */
    @Transactional
    public void moveFolder(Long ownerId, Folder folder, Long newParentId) {
        if (newParentId != null) {
            Folder target = requireOwned(newParentId, ownerId);
            if (target.getId().equals(folder.getId()) || isDescendant(ownerId, target.getId(), folder.getId())) {
                throw ApiException.badRequest("Cannot move a folder into itself or one of its descendants");
            }
        }
        folder.setParentFolderId(newParentId);
    }

    /** True if candidate is a descendant of ancestorId. */
    private boolean isDescendant(Long ownerId, Long candidateId, Long ancestorId) {
        Long current = candidateId;
        int guard = 0;
        while (current != null && guard++ < 100) {
            Folder f = folderRepository.findByIdAndOwnerId(current, ownerId).orElse(null);
            if (f == null) return false;
            if (ancestorId.equals(f.getParentFolderId())) return true;
            current = f.getParentFolderId();
        }
        return false;
    }

    @Transactional
    public void softDelete(Long ownerId, Long folderId) {
        Folder folder = requireOwned(folderId, ownerId);
        Instant now = Instant.now();
        cascadeDelete(ownerId, folder, now);
    }

    private void cascadeDelete(Long ownerId, Folder folder, Instant when) {
        folder.setDeletedAt(when);
        folderRepository.save(folder);
        // files directly inside
        fileRepository.findByOwnerIdAndFolderIdAndDeletedAtIsNullOrderByNameAsc(ownerId, folder.getId())
                .forEach(f -> {
                    f.setDeletedAt(when);
                    fileRepository.save(f);
                });
        // subfolders
        folderRepository.findByOwnerIdAndParentFolderIdAndDeletedAtIsNullOrderByNameAsc(ownerId, folder.getId())
                .forEach(child -> cascadeDelete(ownerId, child, when));
    }

    @Transactional
    public FolderResponse restore(Long ownerId, Long folderId) {
        Folder folder = folderRepository.findByIdAndOwnerId(folderId, ownerId)
                .orElseThrow(() -> ApiException.notFound("Folder not found"));
        folder.setDeletedAt(null);
        // If the parent is trashed, restore to root to avoid an orphan in a deleted tree.
        if (folder.getParentFolderId() != null) {
            Folder parent = folderRepository.findByIdAndOwnerId(folder.getParentFolderId(), ownerId).orElse(null);
            if (parent != null && parent.getDeletedAt() != null) {
                folder.setParentFolderId(null);
            }
        }
        return FolderResponse.from(folderRepository.save(folder));
    }

    /** Flat list of all the user's active folders (used by move pickers and the Folders view). */
    @Transactional(readOnly = true)
    public List<FolderResponse> allFolders(Long ownerId) {
        return folderRepository.findByOwnerIdAndDeletedAtIsNullOrderByNameAsc(ownerId)
                .stream().map(FolderResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<FolderResponse> starred(Long ownerId) {
        return folderRepository.findByOwnerIdAndStarredTrueAndDeletedAtIsNullOrderByNameAsc(ownerId)
                .stream().map(FolderResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<FolderResponse> trash(Long ownerId) {
        return folderRepository.findByOwnerIdAndDeletedAtIsNotNullOrderByDeletedAtDesc(ownerId)
                .stream().map(FolderResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<FolderResponse> search(Long ownerId, String q) {
        return folderRepository.findByOwnerIdAndDeletedAtIsNullAndNameContainingIgnoreCaseOrderByNameAsc(ownerId, q)
                .stream().map(FolderResponse::from).toList();
    }
}
