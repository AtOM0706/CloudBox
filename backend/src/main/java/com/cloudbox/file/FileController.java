package com.cloudbox.file;

import com.cloudbox.auth.AppUserDetails;
import com.cloudbox.auth.CurrentUser;
import com.cloudbox.file.dto.BulkActionRequest;
import com.cloudbox.file.dto.FileResponse;
import com.cloudbox.file.dto.UpdateFileRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Files", description = "Upload, download, organize, trash")
public class FileController {

    private final FileService fileService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Upload a file (optionally into a folder)")
    public FileResponse upload(@CurrentUser AppUserDetails user,
                              @RequestParam("file") MultipartFile file,
                              @RequestParam(value = "folderId", required = false) Long folderId) {
        return fileService.upload(user.getId(), folderId, file);
    }

    @GetMapping("/{id}/download")
    @Operation(summary = "Stream a file's bytes for download")
    public ResponseEntity<InputStreamResource> download(@CurrentUser AppUserDetails user,
                                                        @PathVariable Long id) {
        FileEntity meta = fileService.requireOwned(id, user.getId());
        MediaType contentType = meta.getContentType() != null
                ? MediaType.parseMediaType(meta.getContentType())
                : MediaType.APPLICATION_OCTET_STREAM;
        InputStreamResource body = new InputStreamResource(fileService.openStream(user.getId(), id));
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + meta.getName().replace("\"", "") + "\"")
                .contentType(contentType)
                .contentLength(meta.getSize())
                .body(body);
    }

    @GetMapping("/{id}/preview-url")
    @Operation(summary = "Get a short-lived presigned URL for preview/download")
    public Map<String, String> previewUrl(@CurrentUser AppUserDetails user,
                                           @PathVariable Long id,
                                           @RequestParam(value = "download", defaultValue = "false") boolean download) {
        return Map.of("url", fileService.presignedUrl(user.getId(), id, download));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Rename, move, or star a file")
    public FileResponse update(@CurrentUser AppUserDetails user,
                              @PathVariable Long id,
                              @Valid @RequestBody UpdateFileRequest req) {
        return fileService.update(user.getId(), id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Move a file to trash")
    public void delete(@CurrentUser AppUserDetails user, @PathVariable Long id) {
        fileService.softDelete(user.getId(), id);
    }

    @PostMapping("/{id}/restore")
    @Operation(summary = "Restore a file from trash")
    public FileResponse restore(@CurrentUser AppUserDetails user, @PathVariable Long id) {
        return fileService.restore(user.getId(), id);
    }

    @DeleteMapping("/{id}/permanent")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Permanently delete a file (frees storage)")
    public void permanentDelete(@CurrentUser AppUserDetails user, @PathVariable Long id) {
        fileService.permanentDelete(user.getId(), id);
    }

    @GetMapping("/recent")
    @Operation(summary = "Recently modified files")
    public List<FileResponse> recent(@CurrentUser AppUserDetails user) {
        return fileService.recent(user.getId());
    }

    @GetMapping("/starred")
    @Operation(summary = "Starred files")
    public List<FileResponse> starred(@CurrentUser AppUserDetails user) {
        return fileService.starred(user.getId());
    }

    @GetMapping("/photos")
    @Operation(summary = "All image files")
    public List<FileResponse> photos(@CurrentUser AppUserDetails user) {
        return fileService.photos(user.getId());
    }

    @PostMapping("/bulk")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Bulk delete / restore / move files and folders")
    public void bulk(@CurrentUser AppUserDetails user, @Valid @RequestBody BulkActionRequest req) {
        fileService.bulk(user.getId(), req);
    }
}
