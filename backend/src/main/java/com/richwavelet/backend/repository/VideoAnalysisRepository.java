package com.richwavelet.backend.repository;

import com.richwavelet.backend.model.VideoAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VideoAnalysisRepository extends JpaRepository<VideoAnalysis, Long> {
    Optional<VideoAnalysis> findByVideoId(String videoId);
    boolean existsByVideoId(String videoId);
    void deleteByVideoId(String videoId);
}
