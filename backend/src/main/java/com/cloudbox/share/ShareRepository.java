package com.cloudbox.share;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ShareRepository extends JpaRepository<Share, Long> {

    Optional<Share> findByToken(String token);

    Optional<Share> findByIdAndCreatedBy(Long id, Long createdBy);

    List<Share> findByCreatedByOrderByCreatedAtDesc(Long createdBy);

    List<Share> findByFileId(Long fileId);

    List<Share> findByFolderId(Long folderId);
}
