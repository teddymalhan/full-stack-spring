package com.richwavelet.backend.dto;

public record AdScheduleItem(
    String adId,
    String adUrl,
    int insertAt,
    int duration,
    double matchScore,
    String matchReason
) {}
