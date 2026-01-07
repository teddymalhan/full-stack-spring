package com.richwavelet.backend.model;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.List;

@Entity
@Table(name = "video_analysis")
public class VideoAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "video_id", nullable = false, unique = true, length = 20)
    private String videoId;

    @Column(name = "youtube_url", nullable = false, length = 500)
    private String youtubeUrl;

    @Column(name = "title", length = 500)
    private String title;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "categories", columnDefinition = "text[]")
    private List<String> categories;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "topics", columnDefinition = "text[]")
    private List<String> topics;

    @Column(name = "sentiment", length = 50)
    private String sentiment;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "ad_break_suggestions", columnDefinition = "jsonb")
    private String adBreakSuggestions;

    @Column(name = "analyzed_at")
    private OffsetDateTime analyzedAt;

    public VideoAnalysis() {
    }

    public VideoAnalysis(String videoId, String youtubeUrl) {
        this.videoId = videoId;
        this.youtubeUrl = youtubeUrl;
        this.analyzedAt = OffsetDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getVideoId() {
        return videoId;
    }

    public void setVideoId(String videoId) {
        this.videoId = videoId;
    }

    public String getYoutubeUrl() {
        return youtubeUrl;
    }

    public void setYoutubeUrl(String youtubeUrl) {
        this.youtubeUrl = youtubeUrl;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getDurationSeconds() {
        return durationSeconds;
    }

    public void setDurationSeconds(Integer durationSeconds) {
        this.durationSeconds = durationSeconds;
    }

    public List<String> getCategories() {
        return categories;
    }

    public void setCategories(List<String> categories) {
        this.categories = categories;
    }

    public List<String> getTopics() {
        return topics;
    }

    public void setTopics(List<String> topics) {
        this.topics = topics;
    }

    public String getSentiment() {
        return sentiment;
    }

    public void setSentiment(String sentiment) {
        this.sentiment = sentiment;
    }

    public String getAdBreakSuggestions() {
        return adBreakSuggestions;
    }

    public void setAdBreakSuggestions(String adBreakSuggestions) {
        this.adBreakSuggestions = adBreakSuggestions;
    }

    public OffsetDateTime getAnalyzedAt() {
        return analyzedAt;
    }

    public void setAnalyzedAt(OffsetDateTime analyzedAt) {
        this.analyzedAt = analyzedAt;
    }
}
