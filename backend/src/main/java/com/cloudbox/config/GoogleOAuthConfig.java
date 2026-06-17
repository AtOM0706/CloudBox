package com.cloudbox.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Condition;
import org.springframework.context.annotation.ConditionContext;
import org.springframework.context.annotation.Conditional;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.type.AnnotatedTypeMetadata;
import org.springframework.security.config.oauth2.client.CommonOAuth2Provider;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.util.StringUtils;
import org.springframework.beans.factory.annotation.Value;

/**
 * Registers a Google OAuth client ONLY when google.client-id is set. This avoids
 * Spring Boot's property-driven OAuth auto-config, which fails startup on a blank
 * client id — so the app runs fine with Google sign-in simply turned off.
 */
@Configuration
public class GoogleOAuthConfig {

    /** Matches only when a non-blank google.client-id is present. */
    static class GoogleConfigured implements Condition {
        @Override
        public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
            return StringUtils.hasText(context.getEnvironment().getProperty("google.client-id"));
        }
    }

    @Bean
    @Conditional(GoogleConfigured.class)
    public ClientRegistrationRepository clientRegistrationRepository(
            @Value("${google.client-id}") String clientId,
            @Value("${google.client-secret}") String clientSecret) {
        ClientRegistration google = CommonOAuth2Provider.GOOGLE
                .getBuilder("google")
                .clientId(clientId)
                .clientSecret(clientSecret)
                .build();
        return new InMemoryClientRegistrationRepository(google);
    }
}
