package com.richwavelet.backend.dto;

import java.util.List;

public record MatchRequest(
    String youtubeUrl,
    List<String> adIds,
    Integer maxAds
) {}
