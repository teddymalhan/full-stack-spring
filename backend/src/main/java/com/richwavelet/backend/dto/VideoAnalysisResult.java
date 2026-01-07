package com.richwavelet.backend.dto;

import java.util.List;

public record VideoAnalysisResult(
    String videoId,
    String youtubeUrl,
    String title,
    String description,
    int durationSeconds,
    List<String> categories,
    List<String> topics,
    String sentiment,
    List<AdBreakSuggestion> adBreakSuggestions
) {}
