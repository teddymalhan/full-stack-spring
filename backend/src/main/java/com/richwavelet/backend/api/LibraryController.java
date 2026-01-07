package com.richwavelet.backend.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.richwavelet.backend.service.AdAnalysisService;
import com.richwavelet.backend.service.SupabaseService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/protected/library")
public class LibraryController {

    private static final Logger logger = LoggerFactory.getLogger(LibraryController.class);

    private final SupabaseService supabaseService;
    private final AdAnalysisService adAnalysisService;
    private final ObjectMapper objectMapper;
    private static final String ADS_TABLE = "ads";
    private static final String HISTORY_TABLE = "watch_history";
    private static final String ADS_BUCKET = "ads";
    private static final int SIGNED_URL_EXPIRY_SECONDS = 3600; // 1 hour

    public LibraryController(SupabaseService supabaseService, AdAnalysisService adAnalysisService) {
        this.supabaseService = supabaseService;
        this.adAnalysisService = adAnalysisService;
        this.objectMapper = new ObjectMapper();
    }

    private String getUserId(Jwt jwt) {
        return jwt.getSubject();
    }

    // ==================== ADS ENDPOINTS ====================

    /**
     * List all ads for the current user (with signed URLs for playback)
     * GET /api/protected/library/ads
     */
    @GetMapping("/ads")
    public String listAds(@AuthenticationPrincipal Jwt jwt) throws IOException {
        String userId = getUserId(jwt);
        String result = supabaseService.queryTable(ADS_TABLE, Map.of(
            "select", "*",
            "user_id", "eq." + userId,
            "order", "created_at.desc"
        ));

        // Parse the result and add signed URLs
        List<Map<String, Object>> ads = objectMapper.readValue(result, List.class);
        for (Map<String, Object> ad : ads) {
            String storagePath = (String) ad.get("storage_path");
            if (storagePath != null) {
                try {
                    String signedUrl = supabaseService.createSignedUrl(ADS_BUCKET, storagePath, SIGNED_URL_EXPIRY_SECONDS);
                    ad.put("file_url", signedUrl);
                } catch (IOException e) {
                    // Keep the original file_url if signing fails
                }
            }
        }

        return objectMapper.writeValueAsString(ads);
    }

    /**
     * Get a signed URL for a specific ad
     * GET /api/protected/library/ads/{id}/url
     */
    @GetMapping("/ads/{id}/url")
    public Map<String, String> getAdSignedUrl(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String id
    ) throws IOException {
        String userId = getUserId(jwt);

        // Query the ad to get storage_path
        String result = supabaseService.queryTable(ADS_TABLE, Map.of(
            "select", "storage_path",
            "id", "eq." + id,
            "user_id", "eq." + userId
        ));

        List<Map<String, Object>> ads = objectMapper.readValue(result, List.class);
        if (ads.isEmpty()) {
            throw new IllegalArgumentException("Ad not found or access denied");
        }

        String storagePath = (String) ads.get(0).get("storage_path");
        String signedUrl = supabaseService.createSignedUrl(ADS_BUCKET, storagePath, SIGNED_URL_EXPIRY_SECONDS);

        return Map.of("url", signedUrl, "expiresIn", String.valueOf(SIGNED_URL_EXPIRY_SECONDS));
    }

    /**
     * Upload a new ad file
     * POST /api/protected/library/ads
     */
    @PostMapping("/ads")
    public String uploadAd(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        String userId = getUserId(jwt);
        String originalFilename = file.getOriginalFilename();
        String contentType = file.getContentType();

        // Validate file type
        if (contentType == null || !contentType.startsWith("video/")) {
            throw new IllegalArgumentException("Only video files are allowed");
        }

        // Generate unique storage path (user_id/file_id.ext)
        String fileId = UUID.randomUUID().toString();
        String extension = originalFilename != null && originalFilename.contains(".")
            ? originalFilename.substring(originalFilename.lastIndexOf("."))
            : ".mp4";
        String storagePath = userId + "/" + fileId + extension;

        // Upload file to Supabase Storage
        supabaseService.uploadFile(ADS_BUCKET, storagePath, file.getBytes(), contentType);

        // Generate signed URL for immediate use
        String signedUrl = supabaseService.createSignedUrl(ADS_BUCKET, storagePath, SIGNED_URL_EXPIRY_SECONDS);

        // Save metadata to database
        Map<String, Object> adData = new HashMap<>();
        adData.put("user_id", userId);
        adData.put("file_name", originalFilename != null ? originalFilename : "unknown");
        adData.put("file_url", signedUrl);
        adData.put("storage_path", storagePath);
        adData.put("file_size", file.getSize());
        adData.put("status", "uploaded");
        adData.put("analysis_status", "pending");
        adData.put("created_at", Instant.now().toString());

        String result = supabaseService.insertIntoTable(ADS_TABLE, adData);

        // TODO: Trigger async ad analysis here once integrated
        // For now, analysis can be triggered manually via /api/protected/ads/{id}/analyze

        return result;
    }

    /**
     * Delete an ad (and its storage file)
     * DELETE /api/protected/library/ads/{id}
     */
    @DeleteMapping("/ads/{id}")
    public ResponseEntity<Void> deleteAd(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String id
    ) throws IOException {
        String userId = getUserId(jwt);

        // First, get the storage_path so we can delete the file
        String result = supabaseService.queryTable(ADS_TABLE, Map.of(
            "select", "storage_path",
            "id", "eq." + id,
            "user_id", "eq." + userId
        ));

        List<Map<String, Object>> ads = objectMapper.readValue(result, List.class);
        if (!ads.isEmpty()) {
            String storagePath = (String) ads.get(0).get("storage_path");
            if (storagePath != null) {
                try {
                    supabaseService.deleteFile(ADS_BUCKET, storagePath);
                } catch (IOException e) {
                    // Log but don't fail if storage deletion fails
                    System.err.println("Failed to delete storage file: " + e.getMessage());
                }
            }
        }

        // Delete from database
        supabaseService.deleteFromTable(ADS_TABLE, Map.of(
            "id", "eq." + id,
            "user_id", "eq." + userId
        ));

        return ResponseEntity.noContent().build();
    }

    /**
     * Trigger AI analysis for an ad
     * POST /api/protected/library/ads/{id}/analyze
     */
    @PostMapping("/ads/{id}/analyze")
    public ResponseEntity<Map<String, String>> analyzeAd(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String id
    ) throws IOException {
        String userId = getUserId(jwt);

        // Verify the ad belongs to the user
        String result = supabaseService.queryTable(ADS_TABLE, Map.of(
            "select", "id,storage_path,analysis_status",
            "id", "eq." + id,
            "user_id", "eq." + userId
        ));

        List<Map<String, Object>> ads = objectMapper.readValue(result, List.class);
        if (ads.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Map<String, Object> ad = ads.get(0);
        String currentStatus = (String) ad.get("analysis_status");

        if ("analyzing".equals(currentStatus)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Analysis already in progress"));
        }

        // Update status to analyzing
        supabaseService.updateTable(ADS_TABLE,
            Map.of("id", "eq." + id),
            Map.of("analysis_status", "analyzing")
        );

        // Trigger async analysis
        String storagePath = (String) ad.get("storage_path");
        adAnalysisService.analyzeAdFromStorageAsync(id, storagePath, ADS_BUCKET, ADS_TABLE);

        logger.info("Triggered analysis for ad {} with storage path {}", id, storagePath);

        return ResponseEntity.ok(Map.of(
            "status", "queued",
            "message", "Analysis started"
        ));
    }

    /**
     * Get AI analysis metadata for an ad
     * GET /api/protected/library/ads/{id}/metadata
     */
    @GetMapping("/ads/{id}/metadata")
    public ResponseEntity<?> getAdMetadata(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String id
    ) throws IOException {
        String userId = getUserId(jwt);

        // Verify the ad belongs to the user and get its status
        String result = supabaseService.queryTable(ADS_TABLE, Map.of(
            "select", "id,analysis_status",
            "id", "eq." + id,
            "user_id", "eq." + userId
        ));

        List<Map<String, Object>> ads = objectMapper.readValue(result, List.class);
        if (ads.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        String analysisStatus = (String) ads.get(0).get("analysis_status");

        // Check if metadata exists
        return adAnalysisService.getMetadataByAdId(id)
                .map(metadata -> ResponseEntity.ok((Object) metadata))
                .orElse(ResponseEntity.ok(Map.of(
                        "status", analysisStatus != null ? analysisStatus : "pending",
                        "message", "Analysis not yet complete"
                )));
    }

    // ==================== WATCH HISTORY ENDPOINTS ====================

    /**
     * Get watch history for the current user
     * GET /api/protected/library/history
     */
    @GetMapping("/history")
    public String getWatchHistory(@AuthenticationPrincipal Jwt jwt) throws IOException {
        String userId = getUserId(jwt);
        return supabaseService.queryTable(HISTORY_TABLE, Map.of(
            "select", "*",
            "user_id", "eq." + userId,
            "order", "watched_at.desc"
        ));
    }

    /**
     * Add to watch history
     * POST /api/protected/library/history
     */
    @PostMapping("/history")
    public String addToHistory(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody Map<String, Object> data
    ) throws IOException {
        String userId = getUserId(jwt);

        Map<String, Object> historyData = new HashMap<>();
        historyData.put("user_id", userId);
        historyData.put("youtube_url", data.get("youtube_url"));
        historyData.put("video_title", data.getOrDefault("video_title", null));
        historyData.put("thumbnail_url", data.getOrDefault("thumbnail_url", null));
        historyData.put("watched_at", Instant.now().toString());
        historyData.put("ad_ids", data.getOrDefault("ad_ids", new String[]{}));

        return supabaseService.insertIntoTable(HISTORY_TABLE, historyData);
    }

    /**
     * Delete a history entry
     * DELETE /api/protected/library/history/{id}
     */
    @DeleteMapping("/history/{id}")
    public ResponseEntity<Void> deleteHistoryEntry(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String id
    ) throws IOException {
        String userId = getUserId(jwt);

        supabaseService.deleteFromTable(HISTORY_TABLE, Map.of(
            "id", "eq." + id,
            "user_id", "eq." + userId
        ));

        return ResponseEntity.noContent().build();
    }
}
