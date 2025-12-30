package com.richwavelet.backend.dto;

public record ProcessVideoResponse(
    String jobId,
    String message,
    String status
) {}
