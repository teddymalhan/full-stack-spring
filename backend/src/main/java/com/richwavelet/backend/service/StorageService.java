package com.richwavelet.backend.service;

import com.richwavelet.backend.config.SupabaseConfig;
import okhttp3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.text.Normalizer;
import java.util.UUID;

@Service
public class StorageService {

    private static final Logger logger = LoggerFactory.getLogger(StorageService.class);
    private static final int SIGNED_URL_EXPIRY_SECONDS = 3600; // 1 hour

    private final OkHttpClient httpClient;
    private final SupabaseConfig supabaseConfig;
    private final SupabaseService supabaseService;

    public StorageService(OkHttpClient supabaseHttpClient, SupabaseConfig supabaseConfig, SupabaseService supabaseService) {
        this.httpClient = supabaseHttpClient;
        this.supabaseConfig = supabaseConfig;
        this.supabaseService = supabaseService;
    }

    /**
     * Upload a video file to Supabase Storage
     * @return The storage path (not the full URL)
     */
    public String uploadVideo(String userId, MultipartFile file, String bucket) throws IOException {
        String sanitizedName = sanitizeFileName(file.getOriginalFilename());
        String uniqueName = UUID.randomUUID().toString() + "-" + sanitizedName;
        String storagePath = userId + "/" + uniqueName;

        uploadToStorage(bucket, storagePath, file.getBytes(), file.getContentType());

        logger.info("Uploaded video to {}/{}", bucket, storagePath);
        return storagePath;
    }

    /**
     * Upload bytes to Supabase Storage
     */
    public void uploadToStorage(String bucket, String path, byte[] data, String contentType) throws IOException {
        var requestBody = RequestBody.create(data, MediaType.parse(contentType));

        var request = new Request.Builder()
                .url(supabaseConfig.getSupabaseUrl() + "/storage/v1/object/" + bucket + "/" + path)
                .put(requestBody)  // Use PUT for upsert behavior
                .addHeader("Content-Type", contentType)
                .build();

        try (var response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                String errorBody = response.body() != null ? response.body().string() : "No error body";
                throw new IOException("Upload failed: " + response.code() + " - " + errorBody);
            }
        }
    }

    /**
     * Download a file from a URL to a local path
     */
    public void downloadFile(String fileUrl, Path destination) throws IOException {
        logger.info("Downloading file from {} to {}", fileUrl, destination);

        try (InputStream in = new URL(fileUrl).openStream();
             OutputStream out = Files.newOutputStream(destination,
                     StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING)) {
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = in.read(buffer)) != -1) {
                out.write(buffer, 0, bytesRead);
            }
        }

        logger.info("Downloaded file to {}", destination);
    }

    /**
     * Download a file from Supabase Storage to a local path using a signed URL (for private buckets)
     */
    public void downloadFromStorage(String bucket, String storagePath, Path destination) throws IOException {
        // Use signed URL for private bucket access
        String signedUrl = supabaseService.createSignedUrl(bucket, storagePath, SIGNED_URL_EXPIRY_SECONDS);
        logger.info("Downloading from signed URL for {}/{}", bucket, storagePath);
        downloadFile(signedUrl, destination);
    }

    /**
     * Get the public URL for a file in Supabase Storage
     */
    public String getPublicUrl(String bucket, String storagePath) {
        return supabaseConfig.getSupabaseUrl() + "/storage/v1/object/public/" + bucket + "/" + storagePath;
    }

    /**
     * Delete a file from Supabase Storage
     */
    public void deleteFromStorage(String bucket, String storagePath) throws IOException {
        var request = new Request.Builder()
                .url(supabaseConfig.getSupabaseUrl() + "/storage/v1/object/" + bucket + "/" + storagePath)
                .delete()
                .build();

        try (var response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful() && response.code() != 404) {
                throw new IOException("Delete failed: " + response.code());
            }
        }
    }

    /**
     * Ensure a user's folder exists in storage by creating a placeholder if needed
     */
    public void ensureUserFolderExists(String userId, String bucket) {
        String folderPath = userId + "/.keep";
        try {
            var request = new Request.Builder()
                    .url(supabaseConfig.getSupabaseUrl() + "/storage/v1/object/" + bucket + "/" + folderPath)
                    .head()
                    .build();

            try (var response = httpClient.newCall(request).execute()) {
                if (response.code() == 404) {
                    // Create placeholder file
                    uploadToStorage(bucket, folderPath, "".getBytes(), "text/plain");
                    logger.info("Created folder for user {} in bucket {}", userId, bucket);
                }
            }
        } catch (IOException e) {
            logger.warn("Could not ensure folder exists: {}", e.getMessage());
        }
    }

    /**
     * Sanitize a filename for safe storage
     */
    public String sanitizeFileName(String fileName) {
        if (fileName == null || fileName.isBlank()) {
            return "unnamed";
        }

        // Normalize unicode characters
        String normalized = Normalizer.normalize(fileName, Normalizer.Form.NFD);
        String noAccents = normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");

        // Replace unsafe characters
        String safe = noAccents.replaceAll("[^A-Za-z0-9._-]", "_");

        // Collapse multiple underscores
        safe = safe.replaceAll("_+", "_");

        // Remove leading/trailing underscores
        safe = safe.replaceAll("^_+|_+$", "");

        return safe.isEmpty() ? "unnamed" : safe;
    }

    /**
     * Get file extension from filename
     */
    public String getFileExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf("."));
    }

    /**
     * Upload a processed video file from a local path to Supabase Storage
     * @return The storage path (not the full URL)
     */
    public String uploadProcessedVideo(String userId, Path localPath, String outputFileName) throws IOException {
        String storagePath = userId + "/" + outputFileName;
        byte[] fileBytes = Files.readAllBytes(localPath);

        uploadToStorage("processed-videos", storagePath, fileBytes, "video/mp4");

        logger.info("Uploaded processed video to processed-videos/{}", storagePath);
        return storagePath;
    }
}
