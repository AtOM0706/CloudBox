package com.cloudbox.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    /** Null for accounts created via an external provider (e.g. Google). */
    @Column(name = "password_hash")
    private String passwordHash;

    /** Google "sub" id for accounts linked to Google; null otherwise. */
    @Column(name = "google_id", unique = true)
    private String googleId;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @Column(name = "storage_used", nullable = false)
    private long storageUsed;

    @Column(name = "storage_quota", nullable = false)
    private long storageQuota;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
