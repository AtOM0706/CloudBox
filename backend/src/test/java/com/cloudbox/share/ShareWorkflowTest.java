package com.cloudbox.share;

import com.cloudbox.AbstractIntegrationTest;
import com.cloudbox.auth.dto.AuthResponse;
import com.cloudbox.auth.dto.RegisterRequest;
import com.cloudbox.file.dto.CreateFolderRequest;
import com.cloudbox.file.dto.FolderResponse;
import com.cloudbox.share.dto.CreateShareRequest;
import com.cloudbox.share.dto.PublicShareResponse;
import com.cloudbox.share.dto.ShareResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

class ShareWorkflowTest extends AbstractIntegrationTest {

    @Autowired
    private TestRestTemplate rest;

    private HttpHeaders authHeaders() {
        String email = "share+" + System.nanoTime() + "@example.com";
        AuthResponse auth = rest.postForEntity("/api/auth/register",
                new RegisterRequest(email, "password123", "Sharer"), AuthResponse.class).getBody();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(auth.token());
        return headers;
    }

    @Test
    void createResolveAndRevokeFolderShare() {
        HttpHeaders auth = authHeaders();

        // create a folder
        ResponseEntity<FolderResponse> folder = rest.exchange(
                "/api/folders", HttpMethod.POST,
                new HttpEntity<>(new CreateFolderRequest("Shared Docs", null), auth),
                FolderResponse.class);
        Long folderId = folder.getBody().id();

        // create a share link
        ResponseEntity<ShareResponse> share = rest.exchange(
                "/api/shares", HttpMethod.POST,
                new HttpEntity<>(new CreateShareRequest(null, folderId, SharePermission.VIEW, null), auth),
                ShareResponse.class);
        assertThat(share.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        String token = share.getBody().token();
        Long shareId = share.getBody().id();
        assertThat(token).isNotBlank();

        // resolve publicly (no auth header)
        ResponseEntity<PublicShareResponse> resolved = rest.getForEntity(
                "/api/shares/" + token, PublicShareResponse.class);
        assertThat(resolved.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(resolved.getBody().type()).isEqualTo("folder");
        assertThat(resolved.getBody().folder().name()).isEqualTo("Shared Docs");

        // revoke
        rest.exchange("/api/shares/" + shareId, HttpMethod.DELETE, new HttpEntity<>(auth), Void.class);

        // now resolving 404s
        ResponseEntity<String> after = rest.getForEntity("/api/shares/" + token, String.class);
        assertThat(after.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }
}
