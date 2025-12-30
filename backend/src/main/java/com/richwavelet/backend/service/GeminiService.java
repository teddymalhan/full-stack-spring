package com.richwavelet.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.richwavelet.backend.dto.AdInsertionPoint;
import com.richwavelet.backend.dto.GeminiAnalysisResult;
import com.richwavelet.backend.dto.SceneBreak;
import com.richwavelet.backend.model.ShaderStyle;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    private static final Logger logger = LoggerFactory.getLogger(GeminiService.class);

    @Value("${gemini.api-key}")
    private String geminiKey;

    @Value("${gemini.model:gemini-2.0-flash}")
    private String geminiModel;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GeminiService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Upload a video to Gemini using resumable upload protocol
     * @return The file URI for use in generateContent
     */
    public String uploadVideo(Path videoPath, String displayName) throws IOException {
        logger.info("Uploading video to Gemini: {}", displayName);

        long fileSize = Files.size(videoPath);
        String mimeType = "video/mp4";

        // Sanitize display name
        String sanitizedName = displayName.toLowerCase()
                .replaceAll("[^a-z0-9-]", "-")
                .replaceAll("^-+", "")
                .replaceAll("-+$", "");

        String metadata = "{\"file\":{\"display_name\":\"" + sanitizedName + "\"}}";

        // Step 1: Start resumable upload
        String uploadUrl = "https://generativelanguage.googleapis.com/upload/v1beta/files?key=" + geminiKey;

        HttpHeaders startHeaders = new HttpHeaders();
        startHeaders.setContentType(MediaType.APPLICATION_JSON);
        startHeaders.set("X-Goog-Upload-Protocol", "resumable");
        startHeaders.set("X-Goog-Upload-Command", "start");
        startHeaders.set("X-Goog-Upload-Header-Content-Length", String.valueOf(fileSize));
        startHeaders.set("X-Goog-Upload-Header-Content-Type", mimeType);

        HttpEntity<String> startRequest = new HttpEntity<>(metadata, startHeaders);
        ResponseEntity<Void> startResponse = restTemplate.exchange(uploadUrl, HttpMethod.POST, startRequest, Void.class);

        String resumableUrl = startResponse.getHeaders().getFirst("X-Goog-Upload-URL");
        if (resumableUrl == null) {
            throw new IOException("No upload URL returned from Gemini");
        }

        // Step 2: Upload the file content
        HttpHeaders uploadHeaders = new HttpHeaders();
        uploadHeaders.set("X-Goog-Upload-Offset", "0");
        uploadHeaders.set("X-Goog-Upload-Command", "upload, finalize");
        uploadHeaders.setContentType(MediaType.parseMediaType(mimeType));

        byte[] fileContent = Files.readAllBytes(videoPath);
        HttpEntity<byte[]> uploadRequest = new HttpEntity<>(fileContent, uploadHeaders);
        ResponseEntity<String> uploadResponse = restTemplate.exchange(resumableUrl, HttpMethod.PUT, uploadRequest, String.class);

        if (!uploadResponse.getStatusCode().is2xxSuccessful()) {
            throw new IOException("Failed to upload video to Gemini: " + uploadResponse.getBody());
        }

        // Parse the response to get file URI
        JsonNode root = objectMapper.readTree(uploadResponse.getBody());
        String fileName = root.path("file").path("name").asText(null);
        String fileUri = root.path("file").path("uri").asText(null);

        if (fileUri == null) {
            throw new IOException("No file URI returned from Gemini");
        }

        // Step 3: Wait for file to become ACTIVE
        waitForFileActive(fileName);

        logger.info("Video uploaded to Gemini: {}", fileUri);
        return fileUri;
    }

    /**
     * Wait for the uploaded file to become ACTIVE
     */
    private void waitForFileActive(String fileName) throws IOException {
        logger.info("Waiting for file to become active: {}", fileName);
        String pollUrl = "https://generativelanguage.googleapis.com/v1beta/" + fileName + "?key=" + geminiKey;

        for (int i = 0; i < 60; i++) {
            try {
                ResponseEntity<String> response = restTemplate.getForEntity(pollUrl, String.class);
                JsonNode root = objectMapper.readTree(response.getBody());
                String state = root.path("state").asText("");

                if ("ACTIVE".equalsIgnoreCase(state)) {
                    logger.info("File is now ACTIVE");
                    return;
                }

                Thread.sleep(1000);
            } catch (Exception e) {
                logger.debug("File not ready yet, retrying... {}", e.getMessage());
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new IOException("Interrupted while waiting for file", ie);
                }
            }
        }

        throw new IOException("File never became active after 60 seconds");
    }

    /**
     * Analyze video for scene breaks and ad insertion points
     */
    public GeminiAnalysisResult analyzeVideo(String fileUri, ShaderStyle style) throws IOException {
        logger.info("Analyzing video with Gemini for {} style", style);

        String prompt = buildAnalysisPrompt(style);

        // Build the request
        Map<String, Object> schema = buildResponseSchema();

        Map<String, Object> generationConfig = Map.of(
                "response_mime_type", "application/json",
                "response_schema", schema
        );

        Map<String, Object> contents = Map.of(
                "parts", List.of(
                        Map.of("text", prompt),
                        Map.of("file_data", Map.of(
                                "mime_type", "video/mp4",
                                "file_uri", fileUri
                        ))
                )
        );

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(contents),
                "generationConfig", generationConfig
        );

        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + geminiModel + ":generateContent?key=" + geminiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        String requestJson = objectMapper.writeValueAsString(requestBody);
        HttpEntity<String> request = new HttpEntity<>(requestJson, headers);

        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new IOException("Gemini analysis failed: " + response.getBody());
        }

        return parseAnalysisResponse(response.getBody());
    }

    private String buildAnalysisPrompt(ShaderStyle style) {
        return """
            You are a video analysis assistant specialized in identifying optimal advertisement insertion points for retro TV-style video productions.

            Analyze this video and provide:

            1. **Scene Breaks**: Identify 5-10 natural scene transitions or major content shifts. For each, provide:
               - Start and end timestamps (format: "M:SS" or "H:MM:SS")
               - Brief description of the scene content

            2. **Ad Insertion Points**: Identify 2-5 optimal locations to insert advertisements, considering:
               - Natural pauses or transitions (avoid cutting mid-sentence or mid-action)
               - Spacing (ads should not be too close together)
               - Viewer attention patterns (after hook moments, before climax)

               For each insertion point, provide:
               - Timestamp (format: "M:SS" or "H:MM:SS")
               - Priority score (1-10, where 10 = ideal spot)
               - Brief reason why this is a good insertion point

            3. **Video Summary**: One sentence describing the overall video content for logging purposes.

            The video will be transformed with retro %s effects to look like 80s/90s TV content.
            Consider how commercial breaks worked in that era - typically every 5-8 minutes of content.

            Return ONLY the JSON object as specified in the schema.
            """.formatted(style.name());
    }

    private Map<String, Object> buildResponseSchema() {
        return Map.of(
                "type", "object",
                "properties", Map.of(
                        "sceneBreaks", Map.of(
                                "type", "array",
                                "items", Map.of(
                                        "type", "object",
                                        "properties", Map.of(
                                                "startTime", Map.of("type", "string"),
                                                "endTime", Map.of("type", "string"),
                                                "description", Map.of("type", "string")
                                        ),
                                        "required", List.of("startTime", "endTime", "description")
                                )
                        ),
                        "adInsertionPoints", Map.of(
                                "type", "array",
                                "items", Map.of(
                                        "type", "object",
                                        "properties", Map.of(
                                                "timestamp", Map.of("type", "string"),
                                                "priority", Map.of("type", "integer"),
                                                "reason", Map.of("type", "string")
                                        ),
                                        "required", List.of("timestamp", "priority", "reason")
                                )
                        ),
                        "videoSummary", Map.of("type", "string")
                ),
                "required", List.of("sceneBreaks", "adInsertionPoints", "videoSummary")
        );
    }

    private GeminiAnalysisResult parseAnalysisResponse(String responseBody) throws IOException {
        JsonNode root = objectMapper.readTree(responseBody);

        // Navigate to the text content
        JsonNode partsNode = root.path("candidates").get(0).path("content").path("parts");
        String textContent = partsNode.get(0).path("text").asText();

        // Parse the JSON content
        JsonNode structured = objectMapper.readTree(textContent);

        // Parse scene breaks
        List<SceneBreak> sceneBreaks = new ArrayList<>();
        JsonNode sceneBreaksNode = structured.path("sceneBreaks");
        if (sceneBreaksNode.isArray()) {
            for (JsonNode node : sceneBreaksNode) {
                sceneBreaks.add(new SceneBreak(
                        node.path("startTime").asText(),
                        node.path("endTime").asText(),
                        node.path("description").asText()
                ));
            }
        }

        // Parse ad insertion points
        List<AdInsertionPoint> adInsertionPoints = new ArrayList<>();
        JsonNode adPointsNode = structured.path("adInsertionPoints");
        if (adPointsNode.isArray()) {
            for (JsonNode node : adPointsNode) {
                adInsertionPoints.add(new AdInsertionPoint(
                        node.path("timestamp").asText(),
                        node.path("priority").asInt(),
                        node.path("reason").asText()
                ));
            }
        }

        // Sort ad insertion points by priority (highest first)
        adInsertionPoints.sort((a, b) -> Integer.compare(b.priority(), a.priority()));

        String videoSummary = structured.path("videoSummary").asText("");

        logger.info("Gemini analysis complete: {} scenes, {} ad points",
                sceneBreaks.size(), adInsertionPoints.size());

        return new GeminiAnalysisResult(sceneBreaks, adInsertionPoints, videoSummary);
    }
}
