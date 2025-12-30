package com.richwavelet.backend.dto;

import java.util.List;

public record GeminiAnalysisResult(
    List<SceneBreak> sceneBreaks,
    List<AdInsertionPoint> adInsertionPoints,
    String videoSummary
) {}
