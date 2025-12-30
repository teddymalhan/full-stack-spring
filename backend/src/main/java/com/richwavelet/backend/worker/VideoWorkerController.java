package com.richwavelet.backend.worker;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.richwavelet.backend.dto.AdInsertionPoint;
import com.richwavelet.backend.dto.GeminiAnalysisResult;
import com.richwavelet.backend.dto.WorkerPayload;
import com.richwavelet.backend.model.*;
import com.richwavelet.backend.repository.AdUploadRepository;
import com.richwavelet.backend.repository.ProcessedVideoRepository;
import com.richwavelet.backend.repository.VideoUploadRepository;
import com.richwavelet.backend.service.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Path;
import java.security.GeneralSecurityException;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tasks")
public class VideoWorkerController {

    private static final Logger logger = LoggerFactory.getLogger(VideoWorkerController.class);

    @Value("${gcp.worker-base-url}")
    private String workerBaseUrl;

    @Value("${gcp.service-account}")
    private String serviceAccount;

    private final VideoUploadRepository videoUploadRepository;
    private final AdUploadRepository adUploadRepository;
    private final ProcessedVideoRepository processedVideoRepository;
    private final StorageService storageService;
    private final GeminiService geminiService;
    private final VideoProcessingService videoProcessingService;
    private final ProcessingStatusService statusService;

    public VideoWorkerController(
            VideoUploadRepository videoUploadRepository,
            AdUploadRepository adUploadRepository,
            ProcessedVideoRepository processedVideoRepository,
            StorageService storageService,
            GeminiService geminiService,
            VideoProcessingService videoProcessingService,
            ProcessingStatusService statusService) {
        this.videoUploadRepository = videoUploadRepository;
        this.adUploadRepository = adUploadRepository;
        this.processedVideoRepository = processedVideoRepository;
        this.storageService = storageService;
        this.geminiService = geminiService;
        this.videoProcessingService = videoProcessingService;
        this.statusService = statusService;
    }

    @PostMapping("/process-video-worker")
    public ResponseEntity<Map<String, Object>> processVideo(
            @RequestHeader(name = "Authorization", required = false) String authHeader,
            @RequestBody WorkerPayload payload) {

        String jobId = payload.jobId();
        String userId = payload.userId();

        logger.info("[worker] Processing video - jobId: {}, userId: {}, videoId: {}, style: {}",
                jobId, userId, payload.videoId(), payload.shaderStyle());

        // Verify OIDC token from Cloud Tasks
        if (!verifyOidcToken(authHeader)) {
            logger.error("OIDC token verification failed for job: {}", jobId);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Path workDir = null;

        try {
            // Parse shader style
            ShaderStyle style = ShaderStyle.valueOf(payload.shaderStyle());

            // Update status: DOWNLOADING
            statusService.updateStatus(jobId, userId, ProcessingStage.DOWNLOADING,
                    "Downloading video files from storage...", 5);

            // Create work directory
            workDir = videoProcessingService.createWorkDir(userId);

            // Get video and ad uploads from database
            VideoUpload mainVideo = videoUploadRepository.findById(payload.videoId())
                    .orElseThrow(() -> new IllegalArgumentException("Video not found: " + payload.videoId()));

            List<AdUpload> ads = new ArrayList<>();
            if (payload.adIds() != null && !payload.adIds().isEmpty()) {
                ads = adUploadRepository.findAllById(payload.adIds());
            }

            // Download main video
            Path mainVideoPath = workDir.resolve("main-" + UUID.randomUUID() + ".mp4");
            storageService.downloadFile(mainVideo.getFileUrl(), mainVideoPath);
            logger.info("Downloaded main video to: {}", mainVideoPath);

            // Download ads
            List<Path> adPaths = new ArrayList<>();
            for (AdUpload ad : ads) {
                Path adPath = workDir.resolve("ad-" + ad.getId() + "-" + UUID.randomUUID() + ".mp4");
                storageService.downloadFile(ad.getFileUrl(), adPath);
                adPaths.add(adPath);
                logger.info("Downloaded ad {} to: {}", ad.getId(), adPath);
            }

            // Update status: ANALYZING
            statusService.updateStatus(jobId, userId, ProcessingStage.ANALYZING,
                    "Uploading video to Gemini for analysis...", 15);

            // Upload to Gemini and analyze
            String geminiFileUri = geminiService.uploadVideo(mainVideoPath, mainVideo.getFileName());

            statusService.updateStatus(jobId, userId, ProcessingStage.ANALYZING,
                    "Analyzing video for scene breaks and ad insertion points...", 25);

            GeminiAnalysisResult analysis = geminiService.analyzeVideo(geminiFileUri, style);
            logger.info("Gemini analysis complete: {} scene breaks, {} ad insertion points",
                    analysis.sceneBreaks().size(), analysis.adInsertionPoints().size());

            // Update status: APPLYING_EFFECTS
            statusService.updateStatus(jobId, userId, ProcessingStage.APPLYING_EFFECTS,
                    "Applying " + style.name() + " shader effects...", 40);

            // Apply shader effects
            Path shadedVideo = videoProcessingService.applyShaderEffects(mainVideoPath, style, workDir);
            logger.info("Applied shader effects, output: {}", shadedVideo);

            // Update status: INSERTING_ADS
            Path videoWithAds = shadedVideo;
            if (!adPaths.isEmpty() && !analysis.adInsertionPoints().isEmpty()) {
                statusService.updateStatus(jobId, userId, ProcessingStage.INSERTING_ADS,
                        "Inserting ads at optimal points...", 55);

                // Get top insertion points (limit to number of ads available)
                List<String> insertionTimestamps = analysis.adInsertionPoints().stream()
                        .limit(adPaths.size())
                        .map(AdInsertionPoint::timestamp)
                        .collect(Collectors.toList());

                videoWithAds = videoProcessingService.insertAds(shadedVideo, adPaths, insertionTimestamps, workDir);
                logger.info("Inserted {} ads, output: {}", insertionTimestamps.size(), videoWithAds);
            } else {
                logger.info("No ads to insert, skipping ad insertion step");
            }

            // Update status: ADDING_AUDIO_EFFECTS
            statusService.updateStatus(jobId, userId, ProcessingStage.ADDING_AUDIO_EFFECTS,
                    "Adding vintage crackly audio effects...", 70);

            Path finalVideo = videoProcessingService.addAudioEffects(videoWithAds, workDir);
            logger.info("Added audio effects, final output: {}", finalVideo);

            // Update status: UPLOADING
            statusService.updateStatus(jobId, userId, ProcessingStage.UPLOADING,
                    "Uploading processed video to storage...", 85);

            // Upload final video to Supabase
            String outputFileName = "retro-" + style.name().toLowerCase() + "-" + UUID.randomUUID() + ".mp4";
            String storagePath = storageService.uploadProcessedVideo(userId, finalVideo, outputFileName);
            String publicUrl = storageService.getPublicUrl("processed-videos", storagePath);

            logger.info("Uploaded processed video to: {}", publicUrl);

            // Save to database
            ProcessedVideo processed = new ProcessedVideo();
            processed.setUserId(userId);
            processed.setSourceVideoId(payload.videoId());
            processed.setShaderStyle(style);
            processed.setFileName(outputFileName);
            processed.setFileUrl(publicUrl);
            processed.setStoragePath(storagePath);
            processed.setAdInsertionPoints(formatAdInsertionPoints(analysis.adInsertionPoints()));
            processed.setVideoSummary(analysis.videoSummary());
            processed.setProcessedAt(OffsetDateTime.now());

            processedVideoRepository.save(processed);
            logger.info("Saved processed video record with ID: {}", processed.getId());

            // Update status: COMPLETED
            statusService.markCompleted(jobId, userId);

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "jobId", jobId,
                    "processedVideoId", processed.getId(),
                    "fileUrl", publicUrl
            ));

        } catch (Exception e) {
            logger.error("Error processing video for job {}: {}", jobId, e.getMessage(), e);
            statusService.markFailed(jobId, userId, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "status", "error",
                            "jobId", jobId,
                            "error", e.getMessage()
                    ));
        } finally {
            // Clean up temp files
            if (workDir != null) {
                videoProcessingService.cleanupWorkDir(workDir);
            }
        }
    }

    /**
     * Verify the OIDC token from Cloud Tasks
     */
    private boolean verifyOidcToken(String authHeader) {
        // Allow requests without auth in local development
        if (workerBaseUrl == null || workerBaseUrl.isEmpty()) {
            logger.warn("Worker base URL not configured, skipping OIDC verification (development mode)");
            return true;
        }

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            logger.error("Missing or invalid Authorization header");
            return false;
        }

        try {
            String jwt = authHeader.substring(7);
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier
                    .Builder(new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(workerBaseUrl))
                    .build();

            GoogleIdToken idToken = verifier.verify(jwt);
            if (idToken == null) {
                logger.error("Invalid ID token");
                return false;
            }

            String tokenEmail = idToken.getPayload().getEmail();
            if (tokenEmail == null || !tokenEmail.equals(serviceAccount)) {
                logger.error("Unexpected OIDC email claim: {}", tokenEmail);
                return false;
            }

            logger.info("OIDC token verified successfully for: {}", tokenEmail);
            return true;

        } catch (GeneralSecurityException | IOException e) {
            logger.error("Error verifying OIDC token: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Format ad insertion points as a string for storage
     */
    private String formatAdInsertionPoints(List<AdInsertionPoint> points) {
        return points.stream()
                .map(p -> p.timestamp() + " (priority: " + p.priority() + ")")
                .collect(Collectors.joining(", "));
    }
}
