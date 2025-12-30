package com.richwavelet.backend.dto;

public record AdInsertionPoint(
    String timestamp,
    int priority,
    String reason
) {}
