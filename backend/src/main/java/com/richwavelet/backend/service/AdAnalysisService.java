package com.richwavelet.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.cloud.vertexai.VertexAI;
import com.google.cloud.vertexai.api.*;
import com.google.cloud.vertexai.generativeai.GenerativeModel;
import com.google.cloud.vertexai.generativeai.ResponseHandler;
import com.google.protobuf.ByteString;
import com.richwavelet.backend.dto.AdAnalysisResult;
import com.richwavelet.backend.model.AdMetadata;
import com.richwavelet.backend.model.AdUpload;
import com.richwavelet.backend.repository.AdMetadataRepository;
import com.richwavelet.backend.repository.AdUploadRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AdAnalysisService {

    private static final Logger logger = LoggerFactory.getLogger(AdAnalysisService.class);

    @Value("${gcp.project-id}")
    private String projectId;

    @Value("${gcp.location:us-central1}")
    private String location;

    @Value("${gemini.model:gemini-2.0-flash-001}")
    private String geminiModel;

    private final ObjectMapper objectMapper;
    private final StorageService storageService;
    private final AdUploadRepository adUploadRepository;
    private final AdMetadataRepository adMetadataRepository;
    private final SupabaseService supabaseService;

    public AdAnalysisService(
            StorageService storageService,
            AdUploadRepository adUploadRepository,
            AdMetadataRepository adMetadataRepository,
            SupabaseService supabaseService) {
        this.objectMapper = new ObjectMapper();
        this.storageService = storageService;
        this.adUploadRepository = adUploadRepository;
        this.adMetadataRepository = adMetadataRepository;
        this.supabaseService = supabaseService;
    }

    /**
     * Analyze an ad asynchronously
     */
    @Async
    public void analyzeAdAsync(String adId) {
        try {
            analyzeAd(adId);
        } catch (Exception e) {
            logger.error("Async ad analysis failed for ad {}: {}", adId, e.getMessage(), e);
        }
    }

    /**
     * Analyze an ad video using Vertex AI Gemini and save the results
     */
    public AdMetadata analyzeAd(String adId) throws IOException {
        logger.info("Starting analysis for ad {}", adId);

        Optional<AdUpload> adOpt = adUploadRepository.findById(adId);
        if (adOpt.isEmpty()) {
            throw new IllegalArgumentException("Ad not found: " + adId);
        }

        AdUpload ad = adOpt.get();

        // Update status to analyzing
        ad.setAnalysisStatus("analyzing");
        adUploadRepository.save(ad);

        Path tempFile = null;
        try {
            // Download ad video to temp file
            tempFile = Files.createTempFile("ad-analysis-", ".mp4");
            storageService.downloadFromStorage("ads", ad.getStoragePath(), tempFile);

            // Read video for Gemini
            byte[] videoBytes = readVideoForGemini(tempFile, ad.getFileName());

            // Analyze with Vertex AI Gemini
            AdAnalysisResult result = analyzeWithGemini(videoBytes);

            // Save metadata
            AdMetadata metadata = saveMetadata(adId, result);

            // Update status to completed
            ad.setAnalysisStatus("completed");
            adUploadRepository.save(ad);

            logger.info("Analysis completed for ad {}", adId);
            return metadata;

        } catch (Exception e) {
            logger.error("Analysis failed for ad {}: {}", adId, e.getMessage(), e);
            ad.setAnalysisStatus("failed");
            adUploadRepository.save(ad);
            throw e;
        } finally {
            // Clean up temp file
            if (tempFile != null) {
                try {
                    Files.deleteIfExists(tempFile);
                } catch (IOException e) {
                    logger.warn("Failed to delete temp file: {}", tempFile);
                }
            }
        }
    }

    /**
     * Read video and return bytes for Vertex AI Gemini inline usage
     */
    private byte[] readVideoForGemini(Path videoPath, String displayName) throws IOException {
        logger.info("Reading ad video for Vertex AI Gemini: {}", displayName);
        byte[] videoBytes = Files.readAllBytes(videoPath);
        logger.info("Ad video prepared for Vertex AI: {} ({} bytes)", displayName, videoBytes.length);
        return videoBytes;
    }

    /**
     * Analyze ad video with Vertex AI Gemini
     */
    private AdAnalysisResult analyzeWithGemini(byte[] videoBytes) throws IOException {
        logger.info("Analyzing ad with Vertex AI Gemini");

        String prompt = buildAdAnalysisPrompt();

        try (VertexAI vertexAI = new VertexAI(projectId, location)) {
            // Build generation config with JSON response
            GenerationConfig generationConfig = GenerationConfig.newBuilder()
                    .setResponseMimeType("application/json")
                    .setResponseSchema(buildAdAnalysisSchema())
                    .build();

            GenerativeModel model = new GenerativeModel.Builder()
                    .setModelName(geminiModel)
                    .setVertexAi(vertexAI)
                    .setGenerationConfig(generationConfig)
                    .build();

            // Build content with video and prompt
            Content content = Content.newBuilder()
                    .setRole("user")
                    .addParts(Part.newBuilder()
                            .setInlineData(Blob.newBuilder()
                                    .setMimeType("video/mp4")
                                    .setData(ByteString.copyFrom(videoBytes))
                                    .build())
                            .build())
                    .addParts(Part.newBuilder()
                            .setText(prompt)
                            .build())
                    .build();

            GenerateContentResponse response = model.generateContent(content);
            String responseText = ResponseHandler.getText(response);

            return parseAdAnalysisResponse(responseText);
        } catch (Exception e) {
            logger.error("Vertex AI Gemini ad analysis failed: {}", e.getMessage(), e);
            throw new IOException("Gemini ad analysis failed: " + e.getMessage(), e);
        }
    }

    /**
     * Build the response schema for Vertex AI structured output
     */
    private Schema buildAdAnalysisSchema() {
        return Schema.newBuilder()
                .setType(Type.OBJECT)
                .putProperties("categories", Schema.newBuilder()
                        .setType(Type.ARRAY)
                        .setItems(Schema.newBuilder().setType(Type.STRING).build())
                        .build())
                .putProperties("tone", Schema.newBuilder().setType(Type.STRING).build())
                .putProperties("eraStyle", Schema.newBuilder().setType(Type.STRING).build())
                .putProperties("keywords", Schema.newBuilder()
                        .setType(Type.ARRAY)
                        .setItems(Schema.newBuilder().setType(Type.STRING).build())
                        .build())
                .putProperties("transcript", Schema.newBuilder().setType(Type.STRING).build())
                .putProperties("brandName", Schema.newBuilder().setType(Type.STRING).build())
                .putProperties("energyLevel", Schema.newBuilder().setType(Type.INTEGER).build())
                .addRequired("categories")
                .addRequired("tone")
                .addRequired("eraStyle")
                .addRequired("keywords")
                .addRequired("transcript")
                .addRequired("energyLevel")
                .build();
    }

    private String buildAdAnalysisPrompt() {
        return """
            Analyze this advertisement video and extract detailed metadata for ad matching purposes.

            Identify the following:

            1. **Categories**: Product/service categories this ad belongs to. Choose from:
               automotive, food, beverage, technology, fashion, home, health, entertainment,
               finance, travel, education, retail, sports, gaming, beauty, pets, kids, business

            2. **Tone**: The emotional tone of the ad:
               humorous, serious, nostalgic, exciting, calm, informative, dramatic, playful

            3. **Era Style**: The visual/production era the ad evokes:
               1950s, 1960s, 1970s, 1980s, 1990s, 2000s, modern-retro, modern

            4. **Keywords**: 5-10 relevant keywords describing the ad content, product, or theme

            5. **Transcript**: Full transcription of all spoken words in the ad

            6. **Brand Name**: The brand being advertised (if identifiable), or null

            7. **Energy Level**: Rate the ad's intensity/energy from 1-10:
               1-3 = calm/slow
               4-6 = moderate
               7-10 = high energy/fast-paced

            Return ONLY the JSON object as specified in the schema.
            """;
    }

    private AdAnalysisResult parseAdAnalysisResponse(String responseText) throws IOException {
        // Vertex AI returns the JSON directly when using structured output
        JsonNode structured = objectMapper.readTree(responseText);

        // Parse categories
        List<String> categories = new ArrayList<>();
        JsonNode categoriesNode = structured.path("categories");
        if (categoriesNode.isArray()) {
            for (JsonNode node : categoriesNode) {
                categories.add(node.asText());
            }
        }

        // Parse keywords
        List<String> keywords = new ArrayList<>();
        JsonNode keywordsNode = structured.path("keywords");
        if (keywordsNode.isArray()) {
            for (JsonNode node : keywordsNode) {
                keywords.add(node.asText());
            }
        }

        String tone = structured.path("tone").asText(null);
        String eraStyle = structured.path("eraStyle").asText(null);
        String transcript = structured.path("transcript").asText(null);
        String brandName = structured.path("brandName").asText(null);
        Integer energyLevel = structured.path("energyLevel").asInt(5);

        logger.info("Ad analysis complete: categories={}, tone={}, era={}, energy={}",
                categories, tone, eraStyle, energyLevel);

        return new AdAnalysisResult(categories, tone, eraStyle, keywords, transcript, brandName, energyLevel);
    }

    /**
     * Save analysis results to database
     */
    public AdMetadata saveMetadata(String adId, AdAnalysisResult result) {
        // Delete existing metadata if any
        adMetadataRepository.findByAdId(adId).ifPresent(adMetadataRepository::delete);

        AdMetadata metadata = new AdMetadata(adId);
        metadata.setCategories(result.categories());
        metadata.setTone(result.tone());
        metadata.setEraStyle(result.eraStyle());
        metadata.setKeywords(result.keywords());
        metadata.setTranscript(result.transcript());
        metadata.setBrandName(result.brandName());
        metadata.setEnergyLevel(result.energyLevel());
        metadata.setAnalyzedAt(OffsetDateTime.now());

        return adMetadataRepository.save(metadata);
    }

    /**
     * Get metadata for an ad
     */
    public Optional<AdMetadata> getMetadata(String adId) {
        return adMetadataRepository.findByAdId(adId);
    }

    /**
     * Analyze an ad from storage path asynchronously (for Supabase ads table)
     */
    @Async
    public void analyzeAdFromStorageAsync(String adId, String storagePath, String bucket, String tableName) {
        try {
            analyzeAdFromStorage(adId, storagePath, bucket, tableName);
        } catch (Exception e) {
            logger.error("Async ad analysis failed for ad {}: {}", adId, e.getMessage(), e);
            // Update status to failed
            try {
                supabaseService.updateTable(tableName,
                        Map.of("id", "eq." + adId),
                        Map.of("analysis_status", "failed")
                );
            } catch (IOException ex) {
                logger.error("Failed to update analysis status to failed: {}", ex.getMessage());
            }
        }
    }

    /**
     * Analyze an ad from storage path (for Supabase ads table)
     */
    public AdMetadata analyzeAdFromStorage(String adId, String storagePath, String bucket, String tableName) throws IOException {
        logger.info("Starting analysis for ad {} from storage {}/{}", adId, bucket, storagePath);

        Path tempFile = null;
        try {
            // Download ad video to temp file
            tempFile = Files.createTempFile("ad-analysis-", ".mp4");
            storageService.downloadFromStorage(bucket, storagePath, tempFile);

            // Read video for Gemini
            byte[] videoBytes = readVideoForGemini(tempFile, "ad-" + adId);

            // Analyze with Vertex AI Gemini
            AdAnalysisResult result = analyzeWithGemini(videoBytes);

            // Save metadata
            AdMetadata metadata = saveMetadata(adId, result);

            // Update status to completed
            supabaseService.updateTable(tableName,
                    Map.of("id", "eq." + adId),
                    Map.of("analysis_status", "completed")
            );

            logger.info("Analysis completed for ad {}", adId);
            return metadata;

        } catch (Exception e) {
            logger.error("Analysis failed for ad {}: {}", adId, e.getMessage(), e);
            // Update status to failed
            supabaseService.updateTable(tableName,
                    Map.of("id", "eq." + adId),
                    Map.of("analysis_status", "failed")
            );
            throw e;
        } finally {
            // Clean up temp file
            if (tempFile != null) {
                try {
                    Files.deleteIfExists(tempFile);
                } catch (IOException e) {
                    logger.warn("Failed to delete temp file: {}", tempFile);
                }
            }
        }
    }
}
