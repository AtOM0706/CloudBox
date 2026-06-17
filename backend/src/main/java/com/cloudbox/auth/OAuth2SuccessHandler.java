package com.cloudbox.auth;

import com.cloudbox.user.User;
import com.cloudbox.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.time.Instant;

/**
 * After Google authenticates the user, find-or-create the local account, mint a
 * JWT, and redirect the browser to the SPA callback with the token in the query.
 */
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtService jwtService;

    @Value("${app.oauth2.success-redirect}")
    private String successRedirect;

    @Value("${storage.quota-bytes}")
    private long defaultQuota;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();
        String email = oauthUser.getAttribute("email");
        String name = oauthUser.getAttribute("name");
        String sub = oauthUser.getAttribute("sub");

        if (email == null) {
            response.sendRedirect(successRedirect + "?error=no_email");
            return;
        }

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            user = userRepository.save(User.builder()
                    .email(email)
                    .displayName(name != null ? name : email)
                    .googleId(sub)
                    .storageUsed(0)
                    .storageQuota(defaultQuota)
                    .createdAt(Instant.now())
                    .build());
        } else if (user.getGoogleId() == null) {
            // Link the existing email account to Google on first Google login.
            user.setGoogleId(sub);
            userRepository.save(user);
        }

        String token = jwtService.generateToken(user.getId(), user.getEmail());
        String target = UriComponentsBuilder.fromUriString(successRedirect)
                .queryParam("token", token)
                .build().toUriString();
        response.sendRedirect(target);
    }
}
