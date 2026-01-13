package com.richwavelet.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.richwavelet.backend.dto.*;
import com.richwavelet.backend.model.AdMetadata;
import com.richwavelet.backend.model.AdUpload;
import com.richwavelet.backend.model.VideoAnalysis;
import com.richwavelet.backend.repository.AdMetadataRepository;
import com.richwavelet.backend.repository.AdUploadRepository;
import com.richwavelet.backend.repository.VideoAnalysisRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdMatchingService {

    private static final Logger logger = LoggerFactory.getLogger(AdMatchingService.class);

    private final ObjectMapper objectMapper;
    private final AdMetadataRepository adMetadataRepository;
    private final AdUploadRepository adUploadRepository;
    private final VideoAnalysisRepository videoAnalysisRepository;
    private final YouTubeAnalysisService youtubeAnalysisService;

    // Matching algorithm weights (from PRD Section 5.3.1)
    private static final double CATEGORY_WEIGHT = 0.40;
    private static final double TONE_WEIGHT = 0.25;
    private static final double ERA_WEIGHT = 0.20;
    private static final double ENERGY_WEIGHT = 0.15;

    // Minimum spacing between ads (seconds)
    private static final int MIN_AD_SPACING = 120;

    public AdMatchingService(
            AdMetadataRepository adMetadataRepository,
            AdUploadRepository adUploadRepository,
            VideoAnalysisRepository videoAnalysisRepository,
            YouTubeAnalysisService youtubeAnalysisService) {
        this.objectMapper = new ObjectMapper();
        this.adMetadataRepository = adMetadataRepository;
        this.adUploadRepository = adUploadRepository;
        this.videoAnalysisRepository = videoAnalysisRepository;
        this.youtubeAnalysisService = youtubeAnalysisService;
    }

    /**
     * Match ads to a YouTube video and generate a playback schedule
     */
    public MatchResponse matchAdsToVideo(String youtubeUrl, List<String> adIds, Integer maxAds) throws IOException {
        logger.info("Matching {} ads to video: {}", adIds.size(), youtubeUrl);

        // Step 1: Analyze or retrieve cached video analysis
        VideoAnalysisResult videoAnalysis = youtubeAnalysisService.analyze(youtubeUrl);

        // Step 2: Fetch video entity to get ad break suggestions
        String videoId = youtubeAnalysisService.extractVideoId(youtubeUrl);
        VideoAnalysis videoEntity = videoAnalysisRepository.findByVideoId(videoId)
                .orElseThrow(() -> new IllegalStateException("Video analysis not found for: " + videoId));

        // Step 3: Score and rank all provided ads
        List<AdMatchResult> matches = scoreAds(adIds, videoEntity);

        // Step 4: Build schedule by assigning top ads to break points
        List<AdScheduleItem> schedule = buildSchedule(matches, videoEntity, maxAds != null ? maxAds : 3);

        logger.info("Generated schedule with {} ads for video {}", schedule.size(), videoId);
        return new MatchResponse(videoAnalysis, schedule);
    }

    /**
     * Score each ad against the video content
     */
    private List<AdMatchResult> scoreAds(List<String> adIds, VideoAnalysis video) {
        List<AdMatchResult> results = new ArrayList<>();

        for (String adId : adIds) {
            try {
                // Fetch ad metadata
                Optional<AdMetadata> metadataOpt = adMetadataRepository.findByAdId(adId);
                if (metadataOpt.isEmpty()) {
                    logger.warn("No metadata found for ad: {}, skipping", adId);
                    continue;
                }
                AdMetadata metadata = metadataOpt.get();

                // Fetch ad upload info for URL and duration
                Optional<AdUpload> uploadOpt = adUploadRepository.findById(adId);
                if (uploadOpt.isEmpty()) {
                    logger.warn("No upload found for ad: {}, skipping", adId);
                    continue;
                }
                AdUpload upload = uploadOpt.get();

                // Compute individual scores
                double categoryScore = computeCategoryScore(metadata.getCategories(), video.getCategories());
                double toneScore = computeToneScore(metadata.getTone(), video.getSentiment());
                double eraScore = computeEraScore(metadata.getEraStyle());
                double energyScore = computeEnergyScore(metadata.getEnergyLevel());

                // Weighted overall score
                double overallScore = (categoryScore * CATEGORY_WEIGHT) +
                                    (toneScore * TONE_WEIGHT) +
                                    (eraScore * ERA_WEIGHT) +
                                    (energyScore * ENERGY_WEIGHT);

                // Find matched categories
                List<String> matchedCategories = findMatchedCategories(
                        metadata.getCategories(),
                        video.getCategories()
                );

                // Generate match reason
                String matchReason = generateMatchReason(matchedCategories, metadata.getTone(),
                                                        metadata.getEraStyle(), overallScore);

                int duration = upload.getDurationSeconds() != null ?
                              upload.getDurationSeconds().intValue() : 30;

                AdMatchResult match = new AdMatchResult(
                        adId,
                        upload.getFileUrl(),
                        duration,
                        overallScore,
                        categoryScore,
                        toneScore,
                        eraScore,
                        energyScore,
                        matchedCategories,
                        matchReason
                );

                results.add(match);

            } catch (NumberFormatException e) {
                logger.warn("Invalid ad ID format: {}, skipping", adId);
            } catch (Exception e) {
                logger.error("Error scoring ad {}: {}", adId, e.getMessage(), e);
            }
        }

        // Sort by overall score descending
        results.sort((a, b) -> Double.compare(b.matchScore(), a.matchScore()));

        logger.info("Scored {} ads, top score: {}", results.size(),
                   results.isEmpty() ? 0 : results.get(0).matchScore());

        return results;
    }

    /**
     * Build ad schedule by assigning top-scoring ads to break points
     */
    private List<AdScheduleItem> buildSchedule(List<AdMatchResult> matches,
                                               VideoAnalysis video,
                                               int maxAds) throws IOException {
        List<AdScheduleItem> schedule = new ArrayList<>();

        if (matches.isEmpty()) {
            logger.warn("No matching ads available");
            return schedule;
        }

        // Parse ad break suggestions
        List<AdBreakSuggestion> breakPoints = parseAdBreakSuggestions(video.getAdBreakSuggestions());

        if (breakPoints.isEmpty()) {
            logger.warn("No ad break suggestions available");
            return schedule;
        }

        // Sort break points by priority (descending)
        breakPoints.sort((a, b) -> Integer.compare(b.priority(), a.priority()));

        // Assign ads to break points
        int adsScheduled = 0;
        int matchIndex = 0;

        for (AdBreakSuggestion breakPoint : breakPoints) {
            if (adsScheduled >= maxAds || matchIndex >= matches.size()) {
                break;
            }

            // Check spacing constraint with previous ads
            if (isValidPlacement(schedule, breakPoint.timestamp())) {
                AdMatchResult match = matches.get(matchIndex);

                AdScheduleItem item = new AdScheduleItem(
                        match.adId(),
                        match.adUrl(),
                        breakPoint.timestamp(),
                        match.duration(),
                        match.matchScore(),
                        match.matchReason()
                );

                schedule.add(item);
                adsScheduled++;
                matchIndex++;
            }
        }

        // Sort schedule by timestamp
        schedule.sort(Comparator.comparingInt(AdScheduleItem::insertAt));

        return schedule;
    }

    /**
     * Check if an ad can be placed at this timestamp without violating spacing constraints
     */
    private boolean isValidPlacement(List<AdScheduleItem> schedule, int timestamp) {
        for (AdScheduleItem existing : schedule) {
            if (Math.abs(existing.insertAt() - timestamp) < MIN_AD_SPACING) {
                return false;
            }
        }
        return true;
    }

    /**
     * Compute category overlap score (0.0 to 1.0)
     */
    private double computeCategoryScore(List<String> adCategories, List<String> videoCategories) {
        if (adCategories == null || adCategories.isEmpty() ||
            videoCategories == null || videoCategories.isEmpty()) {
            return 0.0;
        }

        Set<String> adSet = new HashSet<>(adCategories);
        Set<String> videoSet = new HashSet<>(videoCategories);

        // Count overlap
        Set<String> intersection = new HashSet<>(adSet);
        intersection.retainAll(videoSet);

        // Jaccard similarity
        Set<String> union = new HashSet<>(adSet);
        union.addAll(videoSet);

        return union.isEmpty() ? 0.0 : (double) intersection.size() / union.size();
    }

    /**
     * Compute tone compatibility score (0.0 to 1.0)
     */
    private double computeToneScore(String adTone, String videoSentiment) {
        if (adTone == null || videoSentiment == null) {
            return 0.5; // Neutral score if either is missing
        }

        // Define compatibility matrix
        Map<String, Map<String, Double>> compatibility = new HashMap<>();
        compatibility.put("humorous", Map.of(
                "positive", 1.0, "neutral", 0.7, "negative", 0.3, "mixed", 0.8
        ));
        compatibility.put("serious", Map.of(
                "positive", 0.6, "neutral", 0.9, "negative", 0.8, "mixed", 0.7
        ));
        compatibility.put("nostalgic", Map.of(
                "positive", 0.9, "neutral", 0.8, "negative", 0.5, "mixed", 0.8
        ));
        compatibility.put("exciting", Map.of(
                "positive", 1.0, "neutral", 0.6, "negative", 0.4, "mixed", 0.7
        ));
        compatibility.put("calm", Map.of(
                "positive", 0.8, "neutral", 1.0, "negative", 0.4, "mixed", 0.6
        ));
        compatibility.put("informative", Map.of(
                "positive", 0.7, "neutral", 1.0, "negative", 0.6, "mixed", 0.8
        ));

        return compatibility.getOrDefault(adTone.toLowerCase(), Map.of())
                .getOrDefault(videoSentiment.toLowerCase(), 0.5);
    }

    /**
     * Compute era style score (0.0 to 1.0)
     * Retro-style ads score higher
     */
    private double computeEraScore(String eraStyle) {
        if (eraStyle == null) {
            return 0.5;
        }

        Map<String, Double> eraScores = Map.of(
                "1950s", 1.0,
                "1960s", 1.0,
                "1970s", 1.0,
                "1980s", 1.0,
                "1990s", 0.9,
                "modern-retro", 0.8,
                "modern", 0.5
        );

        return eraScores.getOrDefault(eraStyle.toLowerCase(), 0.5);
    }

    /**
     * Compute energy level score (0.0 to 1.0)
     * Normalize energy level (1-10) to 0.0-1.0
     */
    private double computeEnergyScore(Integer energyLevel) {
        if (energyLevel == null) {
            return 0.5;
        }

        // Normalize to 0.0-1.0 range
        return Math.min(Math.max(energyLevel / 10.0, 0.0), 1.0);
    }

    /**
     * Find categories that match between ad and video
     */
    private List<String> findMatchedCategories(List<String> adCategories,
                                               List<String> videoCategories) {
        if (adCategories == null || videoCategories == null) {
            return Collections.emptyList();
        }

        return adCategories.stream()
                .filter(cat -> videoCategories.contains(cat))
                .collect(Collectors.toList());
    }

    /**
     * Generate human-readable match reason
     */
    private String generateMatchReason(List<String> matchedCategories,
                                      String tone,
                                      String eraStyle,
                                      double score) {
        StringBuilder reason = new StringBuilder();

        if (!matchedCategories.isEmpty()) {
            reason.append("Category match: ")
                  .append(String.join(", ", matchedCategories));
        }

        if (tone != null && !tone.isEmpty()) {
            if (reason.length() > 0) reason.append("; ");
            reason.append("Tone: ").append(tone);
        }

        if (eraStyle != null && !eraStyle.isEmpty()) {
            if (reason.length() > 0) reason.append("; ");
            reason.append("Era: ").append(eraStyle);
        }

        if (reason.length() == 0) {
            reason.append("General match");
        }

        reason.append(String.format(" (%.0f%% match)", score * 100));

        return reason.toString();
    }

    /**
     * Parse ad break suggestions from JSON
     */
    private List<AdBreakSuggestion> parseAdBreakSuggestions(String jsonSuggestions) throws IOException {
        if (jsonSuggestions == null || jsonSuggestions.isEmpty()) {
            return Collections.emptyList();
        }

        try {
            return objectMapper.readValue(jsonSuggestions, new TypeReference<List<AdBreakSuggestion>>() {});
        } catch (IOException e) {
            logger.error("Failed to parse ad break suggestions: {}", e.getMessage());
            throw e;
        }
    }
}
