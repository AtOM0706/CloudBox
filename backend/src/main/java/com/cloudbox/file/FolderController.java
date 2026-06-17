package com.cloudbox.file;

import com.cloudbox.auth.AppUserDetails;
import com.cloudbox.auth.CurrentUser;
import com.cloudbox.file.dto.CreateFolderRequest;
import com.cloudbox.file.dto.FolderContentsResponse;
import com.cloudbox.file.dto.FolderResponse;
import com.cloudbox.file.dto.UpdateFolderRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/folders")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Folders", description = "Folder tree and contents")
public class FolderController {

    private final FolderService folderService;

    @GetMapping
    @Operation(summary = "List root contents (folders + files) with breadcrumbs")
    public FolderContentsResponse root(@CurrentUser AppUserDetails user) {
        return folderService.contents(user.getId(), null);
    }

    @GetMapping("/all")
    @Operation(summary = "List all of the user's folders (flat, non-trashed)")
    public List<FolderResponse> all(@CurrentUser AppUserDetails user) {
        return folderService.allFolders(user.getId());
    }

    @GetMapping("/{id}")
    @Operation(summary = "List a folder's contents with breadcrumbs")
    public FolderContentsResponse contents(@CurrentUser AppUserDetails user, @PathVariable Long id) {
        return folderService.contents(user.getId(), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a folder")
    public FolderResponse create(@CurrentUser AppUserDetails user,
                                 @Valid @RequestBody CreateFolderRequest req) {
        return folderService.create(user.getId(), req);
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Rename, move, or star a folder")
    public FolderResponse update(@CurrentUser AppUserDetails user,
                                 @PathVariable Long id,
                                 @Valid @RequestBody UpdateFolderRequest req) {
        return folderService.update(user.getId(), id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Move a folder (and its contents) to trash")
    public void delete(@CurrentUser AppUserDetails user, @PathVariable Long id) {
        folderService.softDelete(user.getId(), id);
    }

    @PostMapping("/{id}/restore")
    @Operation(summary = "Restore a folder from trash")
    public FolderResponse restore(@CurrentUser AppUserDetails user, @PathVariable Long id) {
        return folderService.restore(user.getId(), id);
    }
}
