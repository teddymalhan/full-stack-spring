package com.richwavelet.backend.dto;

import java.util.List;

public record AdBreakSuggestion(
    int timestamp,
    String reason,
    int priority,
    List<String> suggestedAdCategories
) {}
