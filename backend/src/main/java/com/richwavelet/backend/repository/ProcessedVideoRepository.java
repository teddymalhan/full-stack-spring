package com.richwavelet.backend.repository;

import com.richwavelet.backend.model.ProcessedVideo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProcessedVideoRepository extends JpaRepository<ProcessedVideo, Long> {
    List<ProcessedVideo> findByUserId(String userId);
    List<ProcessedVideo> findByUserIdOrderByCreatedAtDesc(String userId);
    List<ProcessedVideo> findBySourceVideoId(Long sourceVideoId);
}
