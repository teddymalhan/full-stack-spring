package com.richwavelet.backend.repository;

import com.richwavelet.backend.model.VideoUpload;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VideoUploadRepository extends JpaRepository<VideoUpload, Long> {
    List<VideoUpload> findByUserId(String userId);
    List<VideoUpload> findByUserIdOrderByUploadedAtDesc(String userId);
}
