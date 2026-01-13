package com.richwavelet.backend.dto;

import java.util.List;

public record WorkerPayload(
    String jobId,
    String userId,
    Long videoId,
    List<String> adIds,
    String shaderStyle
) {}
