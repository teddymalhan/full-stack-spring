package com.richwavelet.backend.api;

import com.richwavelet.backend.dto.MatchRequest;
import com.richwavelet.backend.dto.MatchResponse;
import com.richwavelet.backend.service.AdMatchingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/protected/match")
public class AdMatchingController {

    private static final Logger logger = LoggerFactory.getLogger(AdMatchingController.class);

    private final AdMatchingService adMatchingService;

    public AdMatchingController(AdMatchingService adMatchingService) {
        this.adMatchingService = adMatchingService;
    }

    /**
     * Match ads to a YouTube video and generate playback schedule
     * POST /api/protected/match
     */
    @PostMapping
    public ResponseEntity<?> matchAdsToVideo(
            @RequestBody MatchRequest request,
            Authentication authentication) {

        String userId = getUserId(authentication);
        logger.info("Matching {} ads to video for user: {}",
                   request.adIds() != null ? request.adIds().size() : 0, userId);

        // Validate request
        if (request.youtubeUrl() == null || request.youtubeUrl().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("YouTube URL is required");
        }

        if (request.adIds() == null || request.adIds().isEmpty()) {
            return ResponseEntity.badRequest().body("At least one ad ID is required");
        }

        try {
            MatchResponse response = adMatchingService.matchAdsToVideo(
                    request.youtubeUrl(),
                    request.adIds(),
                    request.maxAds()
            );

            logger.info("Successfully matched ads, generated schedule with {} items",
                       response.schedule().size());
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            logger.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Invalid request: " + e.getMessage());

        } catch (IllegalStateException e) {
            logger.warn("State error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());

        } catch (Exception e) {
            logger.error("Error matching ads to video: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error matching ads to video: " + e.getMessage());
        }
    }

    private String getUserId(Authentication authentication) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        return jwt.getSubject();
    }
}
