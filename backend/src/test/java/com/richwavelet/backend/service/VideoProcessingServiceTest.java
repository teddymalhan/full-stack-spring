package com.richwavelet.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class VideoProcessingServiceTest {

    @InjectMocks
    private VideoProcessingService videoProcessingService;

    private Path tempDir;

    @BeforeEach
    void setUp() throws IOException {
        tempDir = Files.createTempDirectory("video-processing-test");
        ReflectionTestUtils.setField(videoProcessingService, "tempDir", tempDir.toString());
    }

    @Test
    void testCreateWorkDir() throws IOException {
        Path workDir = videoProcessingService.createWorkDir("user123");

        assertNotNull(workDir);
        assertTrue(Files.exists(workDir));
        assertTrue(workDir.toString().contains("user123"));
    }

    @Test
    void testCleanupWorkDir() throws IOException {
        Path workDir = videoProcessingService.createWorkDir("user123");
        Path testFile = workDir.resolve("test.txt");
        Files.writeString(testFile, "test content");

        assertTrue(Files.exists(workDir));
        assertTrue(Files.exists(testFile));

        videoProcessingService.cleanupWorkDir(workDir);

        assertFalse(Files.exists(workDir));
        assertFalse(Files.exists(testFile));
    }

    @Test
    void testCleanupWorkDir_Null() {
        // Should not throw
        assertDoesNotThrow(() -> videoProcessingService.cleanupWorkDir(null));
    }

    @Test
    void testCleanupWorkDir_NonExistent() {
        Path nonExistent = Path.of("/non/existent/path");
        // Should not throw
        assertDoesNotThrow(() -> videoProcessingService.cleanupWorkDir(nonExistent));
    }

    @Test
    void testParseTimestamp_MinutesSeconds() {
        double result = (Double) ReflectionTestUtils.invokeMethod(
                videoProcessingService, "parseTimestamp", "5:30"
        );
        assertEquals(330.0, result, 0.01);
    }

    @Test
    void testParseTimestamp_HoursMinutesSeconds() {
        double result = (Double) ReflectionTestUtils.invokeMethod(
                videoProcessingService, "parseTimestamp", "1:30:45"
        );
        assertEquals(5445.0, result, 0.01);
    }

    @Test
    void testParseTimestamp_Invalid() {
        double result = (Double) ReflectionTestUtils.invokeMethod(
                videoProcessingService, "parseTimestamp", "invalid"
        );
        assertEquals(0.0, result);
    }

    @Test
    void testFormatTimestamp_MinutesSeconds() {
        String result = (String) ReflectionTestUtils.invokeMethod(
                videoProcessingService, "formatTimestamp", 125.5
        );
        assertTrue(result.matches("\\d+:\\d{2}\\.\\d{3}"));
    }

    @Test
    void testFormatTimestamp_HoursMinutesSeconds() {
        String result = (String) ReflectionTestUtils.invokeMethod(
                videoProcessingService, "formatTimestamp", 3661.5
        );
        assertTrue(result.matches("\\d+:\\d{2}:\\d{2}\\.\\d{3}"));
    }

    @Test
    void testInsertAds_EmptyAdsList() throws IOException, InterruptedException {
        Path mainVideo = Files.createTempFile(tempDir, "main", ".mp4");
        Files.write(mainVideo, "test content".getBytes());

        Path result = videoProcessingService.insertAds(
                mainVideo,
                List.of(),
                List.of(),
                tempDir
        );

        assertEquals(mainVideo, result);
    }

    @Test
    void testInsertAds_EmptyInsertionPoints() throws IOException, InterruptedException {
        Path mainVideo = Files.createTempFile(tempDir, "main", ".mp4");
        Files.write(mainVideo, "test content".getBytes());
        Path adVideo = Files.createTempFile(tempDir, "ad", ".mp4");
        Files.write(adVideo, "ad content".getBytes());

        Path result = videoProcessingService.insertAds(
                mainVideo,
                Arrays.asList(adVideo),
                List.of(),
                tempDir
        );

        assertEquals(mainVideo, result);
    }

    // Note: Tests for applyShaderEffects, addAudioEffects, getVideoDuration, etc.
    // would require mocking external processes (ffmpeg, ffprobe) which is complex.
    // These are integration-level tests that would be better suited for integration test suite.
}

