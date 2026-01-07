package com.richwavelet.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.cloud.vertexai.VertexAI;
import com.google.cloud.vertexai.api.*;
import com.google.cloud.vertexai.generativeai.GenerativeModel;
import com.google.cloud.vertexai.generativeai.ResponseHandler;
import com.google.protobuf.ByteString;
import com.richwavelet.backend.dto.AdInsertionPoint;
import com.richwavelet.backend.dto.GeminiAnalysisResult;
import com.richwavelet.backend.dto.SceneBreak;
import com.richwavelet.backend.model.ShaderStyle;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

@Service
public class GeminiService {

    private static final Logger logger = LoggerFactory.getLogger(GeminiService.class);

    @Value("${gcp.project-id}")
    private String projectId;

    @Value("${gcp.location:us-central1}")
    private String location;

    @Value("${gemini.model:gemini-2.0-flash-001}")
    private String geminiModel;

    private final ObjectMapper objectMapper;

    public GeminiService() {
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Upload a video and return base64 data for inline use with Vertex AI.
     * Note: Vertex AI Gemini supports inline video data for smaller files.
     * For larger files, consider using Cloud Storage URIs (gs://).
     * @return Base64 encoded video data
     */
    public String uploadVideo(Path videoPath, String displayName) throws IOException {
        logger.info("Reading video for Vertex AI Gemini: {}", displayName);
        
        // Read and encode video - Vertex AI accepts inline base64 for videos up to ~20MB
        // For larger files, you should upload to GCS and use gs:// URI
        byte[] videoBytes = Files.readAllBytes(videoPath);
        String base64Video = Base64.getEncoder().encodeToString(videoBytes);
        
        logger.info("Video prepared for Vertex AI: {} ({} bytes)", displayName, videoBytes.length);
        return base64Video;
    }

    /**
     * Analyze video for scene breaks and ad insertion points using Vertex AI Gemini
     */
    public GeminiAnalysisResult analyzeVideo(String base64VideoData, ShaderStyle style) throws IOException {
        logger.info("Analyzing video with Vertex AI Gemini for {} style", style);

        String prompt = buildAnalysisPrompt(style);

        try (VertexAI vertexAI = new VertexAI(projectId, location)) {
            // Build generation config with JSON response
            GenerationConfig generationConfig = GenerationConfig.newBuilder()
                    .setResponseMimeType("application/json")
                    .setResponseSchema(buildVertexResponseSchema())
                    .build();

            GenerativeModel model = new GenerativeModel.Builder()
                    .setModelName(geminiModel)
                    .setVertexAi(vertexAI)
                    .setGenerationConfig(generationConfig)
                    .build();

            // Build content with video and prompt
            byte[] videoBytes = Base64.getDecoder().decode(base64VideoData);
            
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
            
            return parseAnalysisResponse(responseText);
        } catch (Exception e) {
            logger.error("Vertex AI Gemini analysis failed: {}", e.getMessage(), e);
            throw new IOException("Gemini analysis failed: " + e.getMessage(), e);
        }
    }

    /**
     * Build the response schema for Vertex AI structured output
     */
    private Schema buildVertexResponseSchema() {
        return Schema.newBuilder()
                .setType(Type.OBJECT)
                .putProperties("sceneBreaks", Schema.newBuilder()
                        .setType(Type.ARRAY)
                        .setItems(Schema.newBuilder()
                                .setType(Type.OBJECT)
                                .putProperties("startTime", Schema.newBuilder().setType(Type.STRING).build())
                                .putProperties("endTime", Schema.newBuilder().setType(Type.STRING).build())
                                .putProperties("description", Schema.newBuilder().setType(Type.STRING).build())
                                .addRequired("startTime")
                                .addRequired("endTime")
                                .addRequired("description")
                                .build())
                        .build())
                .putProperties("adInsertionPoints", Schema.newBuilder()
                        .setType(Type.ARRAY)
                        .setItems(Schema.newBuilder()
                                .setType(Type.OBJECT)
                                .putProperties("timestamp", Schema.newBuilder().setType(Type.STRING).build())
                                .putProperties("priority", Schema.newBuilder().setType(Type.INTEGER).build())
                                .putProperties("reason", Schema.newBuilder().setType(Type.STRING).build())
                                .addRequired("timestamp")
                                .addRequired("priority")
                                .addRequired("reason")
                                .build())
                        .build())
                .putProperties("videoSummary", Schema.newBuilder().setType(Type.STRING).build())
                .addRequired("sceneBreaks")
                .addRequired("adInsertionPoints")
                .addRequired("videoSummary")
                .build();
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

    private GeminiAnalysisResult parseAnalysisResponse(String responseText) throws IOException {
        // Vertex AI returns the JSON directly when using structured output
        JsonNode structured = objectMapper.readTree(responseText);

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

        logger.info("Vertex AI Gemini analysis complete: {} scenes, {} ad points",
                sceneBreaks.size(), adInsertionPoints.size());

        return new GeminiAnalysisResult(sceneBreaks, adInsertionPoints, videoSummary);
    }
}
