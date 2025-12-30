package com.richwavelet.backend.service;

import com.richwavelet.backend.model.ProcessingStage;
import com.richwavelet.backend.model.ProcessingStatus;
import com.richwavelet.backend.repository.ProcessingStatusRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.Optional;

@Service
public class ProcessingStatusService {

    private static final Logger logger = LoggerFactory.getLogger(ProcessingStatusService.class);

    private final ProcessingStatusRepository statusRepository;

    public ProcessingStatusService(ProcessingStatusRepository statusRepository) {
        this.statusRepository = statusRepository;
    }

    /**
     * Create a new processing status entry
     */
    public ProcessingStatus createStatus(String jobId, String userId, String info) {
        ProcessingStatus status = new ProcessingStatus(jobId, userId, ProcessingStage.QUEUED, info);
        return statusRepository.save(status);
    }

    /**
     * Update the processing status
     */
    public void updateStatus(String jobId, String userId, ProcessingStage stage, String info, Integer progressPercent) {
        Optional<ProcessingStatus> existing = statusRepository.findById(jobId);

        ProcessingStatus status;
        if (existing.isPresent()) {
            status = existing.get();
        } else {
            status = new ProcessingStatus(jobId, userId, stage, info);
        }

        status.setStage(stage);
        status.setInfo(info);
        status.setProgressPercent(progressPercent);
        status.setUpdatedAt(OffsetDateTime.now());

        statusRepository.save(status);
        logger.info("Updated status for job {}: {} - {} ({}%)", jobId, stage, info, progressPercent);
    }

    /**
     * Mark processing as failed
     */
    public void markFailed(String jobId, String userId, String errorMessage) {
        Optional<ProcessingStatus> existing = statusRepository.findById(jobId);

        ProcessingStatus status;
        if (existing.isPresent()) {
            status = existing.get();
        } else {
            status = new ProcessingStatus(jobId, userId, ProcessingStage.FAILED, "Processing failed");
        }

        status.setStage(ProcessingStage.FAILED);
        status.setInfo("Processing failed");
        status.setErrorMessage(errorMessage);
        status.setUpdatedAt(OffsetDateTime.now());
        status.setCompletedAt(OffsetDateTime.now());

        statusRepository.save(status);
        logger.error("Job {} failed: {}", jobId, errorMessage);
    }

    /**
     * Mark processing as completed
     */
    public void markCompleted(String jobId, String userId) {
        Optional<ProcessingStatus> existing = statusRepository.findById(jobId);

        ProcessingStatus status;
        if (existing.isPresent()) {
            status = existing.get();
        } else {
            status = new ProcessingStatus(jobId, userId, ProcessingStage.COMPLETED, "Processing complete");
        }

        status.setStage(ProcessingStage.COMPLETED);
        status.setInfo("Video processing complete!");
        status.setProgressPercent(100);
        status.setUpdatedAt(OffsetDateTime.now());
        status.setCompletedAt(OffsetDateTime.now());

        statusRepository.save(status);
        logger.info("Job {} completed successfully", jobId);
    }

    /**
     * Get the current status for a user
     */
    public Optional<ProcessingStatus> getLatestStatus(String userId) {
        return statusRepository.findFirstByUserIdOrderByStartedAtDesc(userId);
    }

    /**
     * Get status by job ID
     */
    public Optional<ProcessingStatus> getStatus(String jobId) {
        return statusRepository.findById(jobId);
    }

    /**
     * Check if user has any active processing jobs
     */
    public boolean hasActiveJob(String userId) {
        return statusRepository.findByUserId(userId).stream()
                .anyMatch(status ->
                        status.getStage() != ProcessingStage.COMPLETED &&
                        status.getStage() != ProcessingStage.FAILED);
    }
}
