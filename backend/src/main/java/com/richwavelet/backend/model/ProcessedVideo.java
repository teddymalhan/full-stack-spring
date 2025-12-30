package com.richwavelet.backend.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "processed_videos")
public class ProcessedVideo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "source_video_id")
    private Long sourceVideoId;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_url", nullable = false)
    private String fileUrl;

    @Column(name = "storage_path")
    private String storagePath;

    @Enumerated(EnumType.STRING)
    @Column(name = "shader_style")
    private ShaderStyle shaderStyle;

    @Column(name = "ad_insertion_points", columnDefinition = "TEXT")
    private String adInsertionPoints;  // JSON array of timestamps

    @Column(name = "video_summary", columnDefinition = "TEXT")
    private String videoSummary;

    @Column(name = "processing_duration_ms")
    private Long processingDurationMs;

    @Column(name = "processed_at")
    private OffsetDateTime processedAt;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    public ProcessedVideo() {
    }

    public ProcessedVideo(String userId, Long sourceVideoId, String fileName, String fileUrl,
                          String storagePath, ShaderStyle shaderStyle) {
        this.userId = userId;
        this.sourceVideoId = sourceVideoId;
        this.fileName = fileName;
        this.fileUrl = fileUrl;
        this.storagePath = storagePath;
        this.shaderStyle = shaderStyle;
        this.createdAt = OffsetDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public Long getSourceVideoId() {
        return sourceVideoId;
    }

    public void setSourceVideoId(Long sourceVideoId) {
        this.sourceVideoId = sourceVideoId;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFileUrl() {
        return fileUrl;
    }

    public void setFileUrl(String fileUrl) {
        this.fileUrl = fileUrl;
    }

    public String getStoragePath() {
        return storagePath;
    }

    public void setStoragePath(String storagePath) {
        this.storagePath = storagePath;
    }

    public ShaderStyle getShaderStyle() {
        return shaderStyle;
    }

    public void setShaderStyle(ShaderStyle shaderStyle) {
        this.shaderStyle = shaderStyle;
    }

    public String getAdInsertionPoints() {
        return adInsertionPoints;
    }

    public void setAdInsertionPoints(String adInsertionPoints) {
        this.adInsertionPoints = adInsertionPoints;
    }

    public Long getProcessingDurationMs() {
        return processingDurationMs;
    }

    public void setProcessingDurationMs(Long processingDurationMs) {
        this.processingDurationMs = processingDurationMs;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getVideoSummary() {
        return videoSummary;
    }

    public void setVideoSummary(String videoSummary) {
        this.videoSummary = videoSummary;
    }

    public OffsetDateTime getProcessedAt() {
        return processedAt;
    }

    public void setProcessedAt(OffsetDateTime processedAt) {
        this.processedAt = processedAt;
    }
}
