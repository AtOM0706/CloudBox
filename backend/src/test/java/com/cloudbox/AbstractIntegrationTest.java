package com.cloudbox;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Base class for integration tests. Spins up a real PostgreSQL via Testcontainers
 * and wires it into Spring Boot through @ServiceConnection. Flyway runs against it.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
public abstract class AbstractIntegrationTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES =
            new PostgreSQLContainer<>("postgres:16-alpine");

    /**
     * Disable real object-storage wiring during tests that don't need it.
     * (Storage tests in M3 start their own MinIO container.)
     */
    @DynamicPropertySource
    static void props(DynamicPropertyRegistry registry) {
        registry.add("storage.endpoint", () -> "http://localhost:9000");
    }
}
