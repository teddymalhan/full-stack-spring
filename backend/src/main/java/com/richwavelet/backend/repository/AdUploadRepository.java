package com.richwavelet.backend.repository;

import com.richwavelet.backend.model.AdUpload;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdUploadRepository extends JpaRepository<AdUpload, String> {
    List<AdUpload> findByUserId(String userId);
    List<AdUpload> findByUserIdOrderByUploadedAtDesc(String userId);
}
