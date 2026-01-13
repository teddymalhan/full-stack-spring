package com.richwavelet.backend.dto;

import com.richwavelet.backend.model.ShaderStyle;
import java.util.List;

public record ProcessVideoRequest(
    Long videoId,
    List<String> adIds,
    ShaderStyle shaderStyle
) {}
