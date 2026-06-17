package com.cloudbox.share;

import com.cloudbox.auth.AppUserDetails;
import com.cloudbox.auth.CurrentUser;
import com.cloudbox.share.dto.CreateShareRequest;
import com.cloudbox.share.dto.PublicShareResponse;
import com.cloudbox.share.dto.ShareResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/shares")
@RequiredArgsConstructor
@Tag(name = "Shares", description = "Share links with permissions and expiry")
public class ShareController {

    private final ShareService shareService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Create a share link for a file or folder")
    public ShareResponse create(@CurrentUser AppUserDetails user,
                                @Valid @RequestBody CreateShareRequest req) {
        return shareService.create(user.getId(), req);
    }

    @GetMapping
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "List the current user's share links")
    public List<ShareResponse> listMine(@CurrentUser AppUserDetails user) {
        return shareService.listMine(user.getId());
    }

    @GetMapping("/{token}")
    @Operation(summary = "Public: resolve a share token (no auth)")
    public PublicShareResponse resolve(@PathVariable String token) {
        return shareService.resolve(token);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Revoke a share link")
    public void revoke(@CurrentUser AppUserDetails user, @PathVariable Long id) {
        shareService.revoke(user.getId(), id);
    }
}
