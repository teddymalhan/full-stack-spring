package com.richwavelet.backend.dto;

public record YouTubeMetadata(
    String videoId,
    String title,
    String description,
    int durationSeconds,
    String category,
    String[] tags
) {}
