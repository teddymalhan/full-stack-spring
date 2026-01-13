package com.richwavelet.backend.dto;

import java.util.List;

public record AdMatchResult(
    String adId,
    String adUrl,
    int duration,
    double matchScore,
    double categoryScore,
    double toneScore,
    double eraScore,
    double energyScore,
    List<String> matchedCategories,
    String matchReason
) {}
