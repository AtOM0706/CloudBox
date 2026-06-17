package com.cloudbox.auth;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Public auth configuration")
public class AuthConfigController {

    private final ObjectProvider<ClientRegistrationRepository> clientRegistrationRepository;

    @GetMapping("/config")
    @Operation(summary = "Which login providers are enabled")
    public Map<String, Boolean> config() {
        boolean googleEnabled = false;
        ClientRegistrationRepository repo = clientRegistrationRepository.getIfAvailable();
        if (repo != null) {
            googleEnabled = repo.findByRegistrationId("google") != null;
        }
        return Map.of("googleEnabled", googleEnabled);
    }
}
