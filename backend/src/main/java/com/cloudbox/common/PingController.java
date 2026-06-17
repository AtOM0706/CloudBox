package com.cloudbox.common;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api")
@Tag(name = "Health", description = "Service liveness")
public class PingController {

    @GetMapping("/ping")
    @Operation(summary = "Liveness check", description = "Returns ok + server time")
    public Map<String, Object> ping() {
        return Map.of(
                "status", "ok",
                "service", "cloudbox",
                "time", Instant.now().toString()
        );
    }
}
