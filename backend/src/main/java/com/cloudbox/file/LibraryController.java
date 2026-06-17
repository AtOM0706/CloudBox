package com.cloudbox.file;

import com.cloudbox.auth.AppUserDetails;
import com.cloudbox.auth.CurrentUser;
import com.cloudbox.file.dto.ItemsResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Library", description = "Search, trash, and starred views")
public class LibraryController {

    private final FileService fileService;
    private final FolderService folderService;

    @GetMapping("/search")
    @Operation(summary = "Search files and folders by name")
    public ItemsResponse search(@CurrentUser AppUserDetails user, @RequestParam("q") String q) {
        if (q == null || q.isBlank()) {
            return new ItemsResponse(List.of(), List.of());
        }
        return new ItemsResponse(
                folderService.search(user.getId(), q.trim()),
                fileService.search(user.getId(), q.trim()));
    }

    @GetMapping("/trash")
    @Operation(summary = "List trashed files and folders")
    public ItemsResponse trash(@CurrentUser AppUserDetails user) {
        return new ItemsResponse(
                folderService.trash(user.getId()),
                fileService.trash(user.getId()));
    }

    @GetMapping("/starred")
    @Operation(summary = "List starred files and folders")
    public ItemsResponse starred(@CurrentUser AppUserDetails user) {
        return new ItemsResponse(
                folderService.starred(user.getId()),
                fileService.starred(user.getId()));
    }
}
