package com.richwavelet.backend.api;

import com.richwavelet.backend.model.AdUpload;
import com.richwavelet.backend.repository.AdUploadRepository;
import com.richwavelet.backend.service.StorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/protected/ads")
public class AdController {

    private static final Logger logger = LoggerFactory.getLogger(AdController.class);
    private static final String BUCKET = "ads";
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "video/mp4",
            "video/quicktime",
            "video/x-msvideo",
            "video/webm"
    );
    private static final long MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB for ads

    private final AdUploadRepository adUploadRepository;
    private final StorageService storageService;

    public AdController(AdUploadRepository adUploadRepository, StorageService storageService) {
        this.adUploadRepository = adUploadRepository;
        this.storageService = storageService;
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadAd(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {

        String userId = getUserId(authentication);
        logger.info("Uploading ad for user: {}", userId);

        // Validate file
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("File is empty");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                    .body("Ad file size exceeds maximum allowed (100MB)");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            return ResponseEntity.badRequest()
                    .body("Invalid file type. Allowed: MP4, MOV, AVI, WebM");
        }

        try {
            // Ensure user folder exists
            storageService.ensureUserFolderExists(userId, BUCKET);

            // Upload to storage
            String storagePath = storageService.uploadVideo(userId, file, BUCKET);
            String fileUrl = storageService.getPublicUrl(BUCKET, storagePath);

            // Save to database
            AdUpload adUpload = new AdUpload();
            adUpload.setUserId(userId);
            adUpload.setFileName(storageService.sanitizeFileName(file.getOriginalFilename()));
            adUpload.setFileUrl(fileUrl);
            adUpload.setStoragePath(storagePath);
            adUpload.setFileSize(file.getSize());
            adUpload.setUploadedAt(OffsetDateTime.now());

            AdUpload saved = adUploadRepository.save(adUpload);
            logger.info("Ad uploaded successfully: {}", saved.getId());

            return ResponseEntity.ok(saved);

        } catch (IOException e) {
            logger.error("Error uploading ad: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error uploading ad: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<AdUpload>> getAds(Authentication authentication) {
        String userId = getUserId(authentication);
        List<AdUpload> ads = adUploadRepository.findByUserIdOrderByUploadedAtDesc(userId);
        return ResponseEntity.ok(ads);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getAd(@PathVariable Long id, Authentication authentication) {
        String userId = getUserId(authentication);

        return adUploadRepository.findById(id)
                .filter(ad -> ad.getUserId().equals(userId))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAd(@PathVariable Long id, Authentication authentication) {
        String userId = getUserId(authentication);

        return adUploadRepository.findById(id)
                .filter(ad -> ad.getUserId().equals(userId))
                .map(ad -> {
                    try {
                        // Delete from storage
                        if (ad.getStoragePath() != null) {
                            storageService.deleteFromStorage(BUCKET, ad.getStoragePath());
                        }
                        // Delete from database
                        adUploadRepository.delete(ad);
                        return ResponseEntity.ok().body("Ad deleted");
                    } catch (IOException e) {
                        logger.error("Error deleting ad: {}", e.getMessage());
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body("Error deleting ad");
                    }
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private String getUserId(Authentication authentication) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        return jwt.getSubject();
    }
}
