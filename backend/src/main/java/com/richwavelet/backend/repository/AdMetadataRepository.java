package com.richwavelet.backend.repository;

import com.richwavelet.backend.model.AdMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AdMetadataRepository extends JpaRepository<AdMetadata, Long> {
    Optional<AdMetadata> findByAdId(String adId);
    boolean existsByAdId(String adId);
    void deleteByAdId(String adId);
}
