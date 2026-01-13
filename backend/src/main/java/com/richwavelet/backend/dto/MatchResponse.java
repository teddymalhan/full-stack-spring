package com.richwavelet.backend.dto;

import java.util.List;

public record MatchResponse(
    VideoAnalysisResult videoAnalysis,
    List<AdScheduleItem> schedule
) {}
