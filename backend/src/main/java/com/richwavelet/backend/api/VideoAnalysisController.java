package com.richwavelet.backend.api;

import com.richwavelet.backend.dto.AnalyzeVideoRequest;
import com.richwavelet.backend.dto.VideoAnalysisResult;
import com.richwavelet.backend.service.YouTubeAnalysisService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/protected/video")
public class VideoAnalysisController {

    private static final Logger logger = LoggerFactory.getLogger(VideoAnalysisController.class);

    private final YouTubeAnalysisService youTubeAnalysisService;

    public VideoAnalysisController(YouTubeAnalysisService youTubeAnalysisService) {
        this.youTubeAnalysisService = youTubeAnalysisService;
    }

    /**
     * Analyze a YouTube video and return content analysis with ad break suggestions
     * POST /api/protected/video/analyze
     */
    @PostMapping("/analyze")
    public ResponseEntity<?> analyzeVideo(
            @RequestBody AnalyzeVideoRequest request,
            Authentication authentication) {

        String userId = getUserId(authentication);
        logger.info("Analyzing YouTube video for user: {}", userId);

        // Validate request
        if (request.youtubeUrl() == null || request.youtubeUrl().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("YouTube URL is required");
        }

        try {
            VideoAnalysisResult result = youTubeAnalysisService.analyze(request.youtubeUrl());
            logger.info("Video analysis completed: {} ({})", result.title(), result.videoId());
            return ResponseEntity.ok(result);

        } catch (IllegalArgumentException e) {
            logger.warn("Invalid YouTube URL: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Invalid YouTube URL: " + e.getMessage());

        } catch (Exception e) {
            logger.error("Error analyzing video: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error analyzing video: " + e.getMessage());
        }
    }

    /**
     * Get cached analysis for a YouTube video by video ID
     * GET /api/protected/video/analysis/{videoId}
     */
    @GetMapping("/analysis/{videoId}")
    public ResponseEntity<?> getCachedAnalysis(
            @PathVariable String videoId,
            Authentication authentication) {

        String userId = getUserId(authentication);
        logger.info("Fetching cached analysis for video: {} (user: {})", videoId, userId);

        try {
            Optional<VideoAnalysisResult> result = youTubeAnalysisService.getCachedAnalysis(videoId);

            if (result.isPresent()) {
                logger.info("Returning cached analysis for video: {}", videoId);
                return ResponseEntity.ok(result.get());
            } else {
                logger.info("No cached analysis found for video: {}", videoId);
                return ResponseEntity.notFound().build();
            }

        } catch (Exception e) {
            logger.error("Error fetching cached analysis: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching cached analysis: " + e.getMessage());
        }
    }

    private String getUserId(Authentication authentication) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        return jwt.getSubject();
    }
}