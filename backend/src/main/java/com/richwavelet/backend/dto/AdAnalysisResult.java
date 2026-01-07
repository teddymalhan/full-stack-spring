package com.richwavelet.backend.dto;

import java.util.List;

public record AdAnalysisResult(
    List<String> categories,
    String tone,
    String eraStyle,
    List<String> keywords,
    String transcript,
    String brandName,
    Integer energyLevel
) {}
