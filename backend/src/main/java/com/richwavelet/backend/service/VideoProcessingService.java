package com.richwavelet.backend.service;

import com.richwavelet.backend.model.ShaderStyle;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class VideoProcessingService {

    private static final Logger logger = LoggerFactory.getLogger(VideoProcessingService.class);

    @Value("${video.temp-dir:/tmp/video-processing}")
    private String tempDir;

    /**
     * Apply shader effects to a video based on the selected style
     */
    public Path applyShaderEffects(Path inputVideo, ShaderStyle style, Path outputDir) throws IOException, InterruptedException {
        Path outputVideo = outputDir.resolve("shaded-" + UUID.randomUUID() + ".mp4");

        String filterChain = getFilterChain(style);

        List<String> command = new ArrayList<>(List.of(
                "ffmpeg", "-y",
                "-i", inputVideo.toString(),
                "-vf", filterChain,
                "-c:v", "libx264",
                "-preset", "fast",
                "-crf", "23",
                "-c:a", "copy",
                "-movflags", "+faststart",
                outputVideo.toString()
        ));

        runFfmpegCommand(command, "shader effects");

        logger.info("Applied {} shader effects to video", style);
        return outputVideo;
    }

    /**
     * Get the FFmpeg filter chain for a shader style
     */
    private String getFilterChain(ShaderStyle style) {
        return switch (style) {
            case CRT -> getCrtFilterChain();
            case VHS -> getVhsFilterChain();
            case ARCADE -> getArcadeFilterChain();
        };
    }

    /**
     * CRT monitor effect: scanlines, vignette, warm colors
     */
    private String getCrtFilterChain() {
        return String.join(",",
                // Add scanlines
                "geq=lum='lum(X,Y)':cb='if(mod(Y,2),cb(X,Y)*0.7,cb(X,Y))':cr='if(mod(Y,2),cr(X,Y)*0.7,cr(X,Y))'",
                // Vignette effect
                "vignette=PI/4",
                // Warm color temperature
                "colorbalance=rs=0.1:gs=-0.05:bs=-0.1",
                // Slight blur for CRT softness
                "gblur=sigma=0.5",
                // Reduce saturation slightly
                "eq=saturation=0.85"
        );
    }

    /**
     * VHS tape effect: chromatic aberration, noise, tape wobble
     */
    private String getVhsFilterChain() {
        return String.join(",",
                // Add noise for tape grain
                "noise=c0s=15:c0f=t",
                // Desaturate slightly
                "eq=saturation=0.75",
                // Thicker scanlines for VHS
                "geq=lum='lum(X,Y)*if(mod(Y,4)<2,0.85,1.0)'",
                // Warm color shift (aged tape)
                "colorbalance=rs=0.15:gs=0.05:bs=-0.1",
                // Blur for tape quality
                "gblur=sigma=0.8"
        );
    }

    /**
     * Arcade cabinet effect: phosphor dots, high contrast, glow
     */
    private String getArcadeFilterChain() {
        return String.join(",",
                // High contrast and brightness
                "eq=contrast=1.2:brightness=0.05:saturation=1.2",
                // Vivid colors
                "colorbalance=rs=0.1:gs=0.1:bs=0.05",
                // Phosphor dot pattern simulation via scanlines
                "geq=lum='lum(X,Y)*if(mod(Y,3),0.9,1.0)'",
                // Slight bloom/glow via blur blend
                "gblur=sigma=1.5"
        );
    }

    /**
     * Add crackly/vintage audio effects
     */
    public Path addAudioEffects(Path inputVideo, Path outputDir) throws IOException, InterruptedException {
        Path outputVideo = outputDir.resolve("audio-fx-" + UUID.randomUUID() + ".mp4");

        List<String> command = List.of(
                "ffmpeg", "-y",
                "-i", inputVideo.toString(),
                "-af", getAudioFilterChain(),
                "-c:v", "copy",
                outputVideo.toString()
        );

        runFfmpegCommand(command, "audio effects");

        logger.info("Applied vintage audio effects to video");
        return outputVideo;
    }

    /**
     * Audio filter chain for vintage TV sound
     */
    private String getAudioFilterChain() {
        return String.join(",",
                // Add subtle static noise
                "aeval='val(0)+random(0)*0.015':c=same",
                // Low-pass filter for old TV speaker
                "lowpass=f=8000",
                // Slight compression
                "acompressor=threshold=0.5:ratio=3:attack=10:release=100"
        );
    }

    /**
     * Insert ads at specified timestamps
     */
    public Path insertAds(Path mainVideo, List<Path> adVideos, List<String> insertionPoints, Path outputDir) throws IOException, InterruptedException {
        if (adVideos.isEmpty() || insertionPoints.isEmpty()) {
            logger.info("No ads to insert, returning original video");
            return mainVideo;
        }

        // Get video duration
        double videoDuration = getVideoDuration(mainVideo);

        // Parse and sort insertion points
        List<Double> insertSeconds = insertionPoints.stream()
                .map(this::parseTimestamp)
                .filter(t -> t > 0 && t < videoDuration)
                .sorted()
                .toList();

        if (insertSeconds.isEmpty()) {
            logger.info("No valid insertion points, returning original video");
            return mainVideo;
        }

        // Create segments
        List<Path> segments = new ArrayList<>();
        double lastEnd = 0;

        for (int i = 0; i < insertSeconds.size(); i++) {
            double insertTime = insertSeconds.get(i);

            // Extract video segment before this ad
            if (insertTime > lastEnd) {
                Path segment = extractSegment(mainVideo, lastEnd, insertTime, outputDir, "seg-" + i);
                segments.add(segment);
            }

            // Add ad (cycle through available ads)
            Path ad = adVideos.get(i % adVideos.size());
            segments.add(ad);

            lastEnd = insertTime;
        }

        // Add final segment after last ad
        if (lastEnd < videoDuration) {
            Path finalSegment = extractSegment(mainVideo, lastEnd, videoDuration, outputDir, "seg-final");
            segments.add(finalSegment);
        }

        // Concatenate all segments
        return concatenateVideos(segments, outputDir);
    }

    /**
     * Extract a segment from a video
     */
    private Path extractSegment(Path video, double startTime, double endTime, Path outputDir, String name) throws IOException, InterruptedException {
        Path output = outputDir.resolve(name + "-" + UUID.randomUUID() + ".mp4");
        double duration = endTime - startTime;

        List<String> command = List.of(
                "ffmpeg", "-y",
                "-i", video.toString(),
                "-ss", formatTimestamp(startTime),
                "-t", formatTimestamp(duration),
                "-c:v", "libx264",
                "-preset", "ultrafast",
                "-crf", "23",
                "-c:a", "aac",
                "-b:a", "128k",
                "-movflags", "+faststart",
                output.toString()
        );

        runFfmpegCommand(command, "extract segment");
        return output;
    }

    /**
     * Concatenate multiple videos
     */
    private Path concatenateVideos(List<Path> videos, Path outputDir) throws IOException, InterruptedException {
        Path concatList = outputDir.resolve("concat-" + UUID.randomUUID() + ".txt");
        Path output = outputDir.resolve("concatenated-" + UUID.randomUUID() + ".mp4");

        // Create concat file
        try (PrintWriter writer = new PrintWriter(concatList.toFile())) {
            for (Path video : videos) {
                writer.println("file '" + video.toString().replace("'", "\\'") + "'");
            }
        }

        List<String> command = List.of(
                "ffmpeg", "-y",
                "-f", "concat",
                "-safe", "0",
                "-i", concatList.toString(),
                "-c:v", "libx264",
                "-preset", "fast",
                "-crf", "23",
                "-c:a", "aac",
                "-b:a", "192k",
                "-movflags", "+faststart",
                output.toString()
        );

        runFfmpegCommand(command, "concatenate videos");

        // Clean up concat list
        Files.deleteIfExists(concatList);

        return output;
    }

    /**
     * Get video duration in seconds
     */
    public double getVideoDuration(Path videoPath) throws IOException, InterruptedException {
        List<String> command = List.of(
                "ffprobe",
                "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                videoPath.toString()
        );

        ProcessBuilder pb = new ProcessBuilder(command);
        pb.redirectErrorStream(true);
        Process process = pb.start();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line = reader.readLine();
            process.waitFor();
            return line != null ? Double.parseDouble(line.trim()) : 0;
        }
    }

    /**
     * Run an FFmpeg command and wait for completion
     */
    private void runFfmpegCommand(List<String> command, String description) throws IOException, InterruptedException {
        logger.info("Running FFmpeg command for {}: {}", description, String.join(" ", command));

        ProcessBuilder pb = new ProcessBuilder(command);
        pb.redirectErrorStream(true);
        Process process = pb.start();

        // Read and log output
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                logger.debug("FFmpeg: {}", line);
            }
        }

        int exitCode = process.waitFor();
        if (exitCode != 0) {
            throw new IOException("FFmpeg command failed for " + description + " with exit code: " + exitCode);
        }

        logger.info("FFmpeg command completed successfully for {}", description);
    }

    /**
     * Parse timestamp string to seconds
     * Supports formats: M:SS, MM:SS, H:MM:SS
     */
    private double parseTimestamp(String timestamp) {
        try {
            String[] parts = timestamp.split(":");
            if (parts.length == 2) {
                return Double.parseDouble(parts[0]) * 60 + Double.parseDouble(parts[1]);
            } else if (parts.length == 3) {
                return Double.parseDouble(parts[0]) * 3600 +
                       Double.parseDouble(parts[1]) * 60 +
                       Double.parseDouble(parts[2]);
            }
        } catch (NumberFormatException e) {
            logger.warn("Invalid timestamp format: {}", timestamp);
        }
        return 0;
    }

    /**
     * Format seconds as timestamp
     */
    private String formatTimestamp(double seconds) {
        int hours = (int) (seconds / 3600);
        int minutes = (int) ((seconds % 3600) / 60);
        double secs = seconds % 60;

        if (hours > 0) {
            return String.format("%d:%02d:%06.3f", hours, minutes, secs);
        }
        return String.format("%d:%06.3f", minutes, secs);
    }

    /**
     * Create a temporary working directory
     */
    public Path createWorkDir(String userId) throws IOException {
        Path workDir = Path.of(tempDir, userId, UUID.randomUUID().toString());
        Files.createDirectories(workDir);
        logger.info("Created work directory: {}", workDir);
        return workDir;
    }

    /**
     * Clean up a working directory
     */
    public void cleanupWorkDir(Path workDir) {
        try {
            if (workDir != null && Files.exists(workDir)) {
                Files.walk(workDir)
                        .sorted((a, b) -> b.compareTo(a)) // Reverse order for deletion
                        .forEach(path -> {
                            try {
                                Files.deleteIfExists(path);
                            } catch (IOException e) {
                                logger.warn("Failed to delete: {}", path);
                            }
                        });
                logger.info("Cleaned up work directory: {}", workDir);
            }
        } catch (IOException e) {
            logger.error("Error cleaning up work directory: {}", workDir, e);
        }
    }
}
