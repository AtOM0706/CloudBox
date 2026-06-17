package com.cloudbox.file;

import com.cloudbox.AbstractIntegrationTest;
import com.cloudbox.auth.dto.AuthResponse;
import com.cloudbox.auth.dto.RegisterRequest;
import com.cloudbox.file.dto.FileResponse;
import com.cloudbox.file.dto.FolderContentsResponse;
import com.cloudbox.file.dto.ItemsResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.testcontainers.containers.MinIOContainer;
import org.testcontainers.junit.jupiter.Container;

import static org.assertj.core.api.Assertions.assertThat;

class FileWorkflowTest extends AbstractIntegrationTest {

    @Container
    static final MinIOContainer MINIO = new MinIOContainer("minio/minio:latest");

    @DynamicPropertySource
    static void storageProps(DynamicPropertyRegistry registry) {
        registry.add("storage.endpoint", MINIO::getS3URL);
        registry.add("storage.access-key", MINIO::getUserName);
        registry.add("storage.secret-key", MINIO::getPassword);
        registry.add("storage.bucket", () -> "cloudbox-test");
    }

    @Autowired
    private TestRestTemplate rest;

    private HttpHeaders authHeaders() {
        String email = "file+" + System.nanoTime() + "@example.com";
        AuthResponse auth = rest.postForEntity("/api/auth/register",
                new RegisterRequest(email, "password123", "Filer"), AuthResponse.class).getBody();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(auth.token());
        return headers;
    }

    @Test
    void uploadListDownloadAndTrash() {
        HttpHeaders auth = authHeaders();

        // upload
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new ByteArrayResource("hello cloudbox".getBytes()) {
            @Override
            public String getFilename() {
                return "note.txt";
            }
        });
        HttpHeaders uploadHeaders = new HttpHeaders();
        uploadHeaders.setBearerAuth(auth.getFirst(HttpHeaders.AUTHORIZATION).substring("Bearer ".length()));
        uploadHeaders.setContentType(MediaType.MULTIPART_FORM_DATA);

        ResponseEntity<FileResponse> upload = rest.postForEntity(
                "/api/files", new HttpEntity<>(body, uploadHeaders), FileResponse.class);
        assertThat(upload.getStatusCode().is2xxSuccessful()).isTrue();
        FileResponse file = upload.getBody();
        assertThat(file).isNotNull();
        assertThat(file.name()).isEqualTo("note.txt");
        assertThat(file.size()).isEqualTo(14);

        // list root
        ResponseEntity<FolderContentsResponse> root = rest.exchange(
                "/api/folders", HttpMethod.GET, new HttpEntity<>(auth), FolderContentsResponse.class);
        assertThat(root.getBody().files()).extracting(FileResponse::name).contains("note.txt");

        // download
        ResponseEntity<byte[]> download = rest.exchange(
                "/api/files/" + file.id() + "/download", HttpMethod.GET, new HttpEntity<>(auth), byte[].class);
        assertThat(new String(download.getBody())).isEqualTo("hello cloudbox");

        // trash
        rest.exchange("/api/files/" + file.id(), HttpMethod.DELETE, new HttpEntity<>(auth), Void.class);
        ResponseEntity<ItemsResponse> trash = rest.exchange(
                "/api/trash", HttpMethod.GET, new HttpEntity<>(auth), ItemsResponse.class);
        assertThat(trash.getBody().files()).extracting(FileResponse::name).contains("note.txt");

        // restore
        rest.postForEntity("/api/files/" + file.id() + "/restore", new HttpEntity<>(auth), FileResponse.class);
        ResponseEntity<FolderContentsResponse> rootAgain = rest.exchange(
                "/api/folders", HttpMethod.GET, new HttpEntity<>(auth), FolderContentsResponse.class);
        assertThat(rootAgain.getBody().files()).extracting(FileResponse::name).contains("note.txt");
    }
}
