package com.richwavelet.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.richwavelet.backend.dto.AdInsertionPoint;
import com.richwavelet.backend.dto.GeminiAnalysisResult;
import com.richwavelet.backend.model.ShaderStyle;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class GeminiServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private GeminiService geminiService;

    private ObjectMapper objectMapper;
    private Path tempVideoFile;

    @BeforeEach
    void setUp() throws Exception {
        objectMapper = new ObjectMapper();
        ReflectionTestUtils.setField(geminiService, "geminiKey", "test-api-key");
        ReflectionTestUtils.setField(geminiService, "geminiModel", "gemini-2.0-flash");
        ReflectionTestUtils.setField(geminiService, "restTemplate", restTemplate);
        ReflectionTestUtils.setField(geminiService, "objectMapper", objectMapper);

        tempVideoFile = Files.createTempFile("test-video", ".mp4");
        Files.write(tempVideoFile, "test video content".getBytes());
    }

    @Test
    void testBuildAnalysisPrompt_CRT() {
        String prompt = (String) ReflectionTestUtils.invokeMethod(
                geminiService, "buildAnalysisPrompt", ShaderStyle.CRT
        );

        assertNotNull(prompt);
        assertTrue(prompt.contains("CRT"));
        assertTrue(prompt.contains("Scene Breaks"));
        assertTrue(prompt.contains("Ad Insertion Points"));
    }

    @Test
    void testBuildAnalysisPrompt_VHS() {
        String prompt = (String) ReflectionTestUtils.invokeMethod(
                geminiService, "buildAnalysisPrompt", ShaderStyle.VHS
        );

        assertNotNull(prompt);
        assertTrue(prompt.contains("VHS"));
    }

    @Test
    void testBuildAnalysisPrompt_ARCADE() {
        String prompt = (String) ReflectionTestUtils.invokeMethod(
                geminiService, "buildAnalysisPrompt", ShaderStyle.ARCADE
        );

        assertNotNull(prompt);
        assertTrue(prompt.contains("ARCADE"));
    }

    @Test
    void testBuildResponseSchema() {
        Object schema = ReflectionTestUtils.invokeMethod(
                geminiService, "buildResponseSchema"
        );

        assertNotNull(schema);
        // Schema should be a Map structure
        assertTrue(schema instanceof java.util.Map);
    }

    @Test
    void testParseAnalysisResponse() throws Exception {
        String responseJson = """
            {
              "candidates": [{
                "content": {
                  "parts": [{
                    "text": "{\\"sceneBreaks\\":[{\\"startTime\\":\\"0:00\\",\\"endTime\\":\\"1:30\\",\\"description\\":\\"Opening scene\\"}],\\"adInsertionPoints\\":[{\\"timestamp\\":\\"1:30\\",\\"priority\\":8,\\"reason\\":\\"Natural transition\\"}],\\"videoSummary\\":\\"Test video\\"}"
                  }]
                }
              }]
            }
            """;

        GeminiAnalysisResult result = (GeminiAnalysisResult) ReflectionTestUtils.invokeMethod(
                geminiService, "parseAnalysisResponse", responseJson
        );

        assertNotNull(result);
        assertEquals(1, result.sceneBreaks().size());
        assertEquals(1, result.adInsertionPoints().size());
        assertEquals("Test video", result.videoSummary());
        assertEquals("0:00", result.sceneBreaks().get(0).startTime());
        assertEquals("1:30", result.adInsertionPoints().get(0).timestamp());
        assertEquals(8, result.adInsertionPoints().get(0).priority());
    }

    @Test
    void testParseAnalysisResponse_MultipleScenes() throws Exception {
        String responseJson = """
            {
              "candidates": [{
                "content": {
                  "parts": [{
                    "text": "{\\"sceneBreaks\\":[{\\"startTime\\":\\"0:00\\",\\"endTime\\":\\"1:30\\",\\"description\\":\\"Scene 1\\"},{\\"startTime\\":\\"1:30\\",\\"endTime\\":\\"3:00\\",\\"description\\":\\"Scene 2\\"}],\\"adInsertionPoints\\":[{\\"timestamp\\":\\"1:30\\",\\"priority\\":9,\\"reason\\":\\"Good spot\\"}],\\"videoSummary\\":\\"Multi-scene video\\"}"
                  }]
                }
              }]
            }
            """;

        GeminiAnalysisResult result = (GeminiAnalysisResult) ReflectionTestUtils.invokeMethod(
                geminiService, "parseAnalysisResponse", responseJson
        );

        assertNotNull(result);
        assertEquals(2, result.sceneBreaks().size());
        assertEquals(1, result.adInsertionPoints().size());
    }

    @Test
    void testParseAnalysisResponse_SortedByPriority() throws Exception {
        String responseJson = """
            {
              "candidates": [{
                "content": {
                  "parts": [{
                    "text": "{\\"sceneBreaks\\":[],\\"adInsertionPoints\\":[{\\"timestamp\\":\\"2:00\\",\\"priority\\":5,\\"reason\\":\\"Low\\"},{\\"timestamp\\":\\"1:00\\",\\"priority\\":9,\\"reason\\":\\"High\\"},{\\"timestamp\\":\\"3:00\\",\\"priority\\":7,\\"reason\\":\\"Medium\\"}],\\"videoSummary\\":\\"Test\\"}"
                  }]
                }
              }]
            }
            """;

        GeminiAnalysisResult result = (GeminiAnalysisResult) ReflectionTestUtils.invokeMethod(
                geminiService, "parseAnalysisResponse", responseJson
        );

        assertNotNull(result);
        List<AdInsertionPoint> points = result.adInsertionPoints();
        assertEquals(3, points.size());
        // Should be sorted by priority descending
        assertEquals(9, points.get(0).priority());
        assertEquals(7, points.get(1).priority());
        assertEquals(5, points.get(2).priority());
    }

    // Note: Tests for uploadVideo and analyzeVideo would require mocking complex HTTP interactions
    // with multiple requests/responses. These are better suited for integration tests.
    // The unit tests above cover the core parsing and prompt building logic.
}

