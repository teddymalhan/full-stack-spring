package com.richwavelet.backend.api;

import com.richwavelet.backend.dto.ProcessVideoRequest;
import com.richwavelet.backend.dto.ProcessVideoResponse;
import com.richwavelet.backend.model.ProcessingStatus;
import com.richwavelet.backend.model.VideoUpload;
import com.richwavelet.backend.repository.AdUploadRepository;
import com.richwavelet.backend.repository.VideoUploadRepository;
import com.richwavelet.backend.service.CloudTasksService;
import com.richwavelet.backend.service.ProcessingStatusService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/protected")
public class ProcessVideoController {

    private static final Logger logger = LoggerFactory.getLogger(ProcessVideoController.class);

    private final CloudTasksService cloudTasksService;
    private final ProcessingStatusService statusService;
    private final VideoUploadRepository videoUploadRepository;
    private final AdUploadRepository adUploadRepository;

    public ProcessVideoController(
            CloudTasksService cloudTasksService,
            ProcessingStatusService statusService,
            VideoUploadRepository videoUploadRepository,
            AdUploadRepository adUploadRepository) {
        this.cloudTasksService = cloudTasksService;
        this.statusService = statusService;
        this.videoUploadRepository = videoUploadRepository;
        this.adUploadRepository = adUploadRepository;
    }

    @PostMapping("/process-video")
    public ResponseEntity<?> processVideo(
            @RequestBody ProcessVideoRequest request,
            Authentication authentication) {

        String userId = getUserId(authentication);
        logger.info("Processing video request for user: {}, videoId: {}", userId, request.videoId());

        // Validate video exists and belongs to user
        Optional<VideoUpload> videoOpt = videoUploadRepository.findById(request.videoId());
        if (videoOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Video not found");
        }

        VideoUpload video = videoOpt.get();
        if (!video.getUserId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
        }

        // Validate ads exist and belong to user
        if (request.adIds() != null && !request.adIds().isEmpty()) {
            for (Long adId : request.adIds()) {
                var adOpt = adUploadRepository.findById(adId);
                if (adOpt.isEmpty() || !adOpt.get().getUserId().equals(userId)) {
                    return ResponseEntity.badRequest().body("Ad not found or access denied: " + adId);
                }
            }
        }

        // Check for existing queued task
        if (cloudTasksService.hasExistingTask(userId)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ProcessVideoResponse(
                            null,
                            "You already have a video being processed. Please wait.",
                            "CONFLICT"
                    ));
        }

        try {
            // Generate job ID
            String jobId = UUID.randomUUID().toString();

            // Create initial status
            statusService.createStatus(jobId, userId, "Video queued for processing...");

            // Create Cloud Task
            String taskName = cloudTasksService.createProcessingTask(request, userId, jobId);

            logger.info("Created processing task: {} for job: {}", taskName, jobId);

            return ResponseEntity.accepted().body(new ProcessVideoResponse(
                    jobId,
                    "Video queued for processing",
                    "QUEUED"
            ));

        } catch (Exception e) {
            logger.error("Error creating processing task: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ProcessVideoResponse(
                            null,
                            "Error queuing video: " + e.getMessage(),
                            "ERROR"
                    ));
        }
    }

    @GetMapping("/processing-status")
    public ResponseEntity<?> getProcessingStatus(Authentication authentication) {
        String userId = getUserId(authentication);
        Optional<ProcessingStatus> status = statusService.getLatestStatus(userId);
        return status.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/processing-status/{jobId}")
    public ResponseEntity<?> getProcessingStatusByJobId(
            @PathVariable String jobId,
            Authentication authentication) {
        String userId = getUserId(authentication);
        Optional<ProcessingStatus> status = statusService.getStatus(jobId);

        if (status.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        // Verify ownership
        if (!status.get().getUserId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(status.get());
    }

    private String getUserId(Authentication authentication) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        return jwt.getSubject();
    }
}
