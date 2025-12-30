package com.richwavelet.backend.repository;

import com.richwavelet.backend.model.ProcessingStatus;
import com.richwavelet.backend.model.ProcessingStage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProcessingStatusRepository extends JpaRepository<ProcessingStatus, String> {
    List<ProcessingStatus> findByUserId(String userId);
    Optional<ProcessingStatus> findFirstByUserIdOrderByStartedAtDesc(String userId);
    List<ProcessingStatus> findByUserIdAndStage(String userId, ProcessingStage stage);
    List<ProcessingStatus> findByStage(ProcessingStage stage);
}
