package com.cloudbox.auth;

import com.cloudbox.AbstractIntegrationTest;
import com.cloudbox.auth.dto.AuthResponse;
import com.cloudbox.auth.dto.LoginRequest;
import com.cloudbox.auth.dto.RegisterRequest;
import com.cloudbox.user.dto.UserResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

class AuthControllerTest extends AbstractIntegrationTest {

    @Autowired
    private TestRestTemplate rest;

    @Test
    void registerLoginAndFetchCurrentUser() {
        String email = "alice+" + System.nanoTime() + "@example.com";

        // register
        ResponseEntity<AuthResponse> register = rest.postForEntity(
                "/api/auth/register",
                new RegisterRequest(email, "password123", "Alice"),
                AuthResponse.class);
        assertThat(register.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(register.getBody()).isNotNull();
        assertThat(register.getBody().token()).isNotBlank();

        // login
        ResponseEntity<AuthResponse> login = rest.postForEntity(
                "/api/auth/login",
                new LoginRequest(email, "password123"),
                AuthResponse.class);
        assertThat(login.getStatusCode()).isEqualTo(HttpStatus.OK);
        String token = login.getBody().token();
        assertThat(token).isNotBlank();

        // /me with the token
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        ResponseEntity<UserResponse> me = rest.exchange(
                "/api/auth/me", HttpMethod.GET, new HttpEntity<>(headers), UserResponse.class);
        assertThat(me.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(me.getBody().email()).isEqualTo(email);
    }

    @Test
    void meRequiresAuthentication() {
        ResponseEntity<String> me = rest.getForEntity("/api/auth/me", String.class);
        assertThat(me.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void rejectsDuplicateEmail() {
        String email = "dup+" + System.nanoTime() + "@example.com";
        RegisterRequest req = new RegisterRequest(email, "password123", "Dup");
        rest.postForEntity("/api/auth/register", req, AuthResponse.class);
        ResponseEntity<String> second = rest.postForEntity("/api/auth/register", req, String.class);
        assertThat(second.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }
}
