package com.richwavelet.backend.service;

import com.richwavelet.backend.config.SupabaseConfig;
import okhttp3.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SupabaseServiceTest {

    @Mock
    private OkHttpClient httpClient;

    @Mock
    private Call call;

    @Mock
    private Response response;

    @Mock
    private ResponseBody responseBody;

    @Mock
    private SupabaseConfig supabaseConfig;

    private SupabaseService supabaseService;

    @BeforeEach
    void setUp() {
        when(supabaseConfig.getSupabaseUrl()).thenReturn("https://test.supabase.co");
        supabaseService = new SupabaseService(httpClient, supabaseConfig);
    }

    @Test
    void testQueryTable_Success() throws IOException {
        when(httpClient.newCall(any(Request.class))).thenReturn(call);
        when(call.execute()).thenReturn(response);
        when(response.isSuccessful()).thenReturn(true);
        when(response.body()).thenReturn(responseBody);
        when(responseBody.string()).thenReturn("[{\"id\":\"123\"}]");

        Map<String, String> params = new HashMap<>();
        params.put("select", "*");
        params.put("id", "eq.123");

        String result = supabaseService.queryTable("users", params);

        assertEquals("[{\"id\":\"123\"}]", result);
        verify(httpClient).newCall(any(Request.class));
    }

    @Test
    void testQueryTable_Error() throws IOException {
        when(httpClient.newCall(any(Request.class))).thenReturn(call);
        when(call.execute()).thenReturn(response);
        when(response.isSuccessful()).thenReturn(false);

        Map<String, String> params = new HashMap<>();

        assertThrows(IOException.class, () -> {
            supabaseService.queryTable("users", params);
        });
    }

    @Test
    void testInsertIntoTable_Success() throws IOException {
        when(httpClient.newCall(any(Request.class))).thenReturn(call);
        when(call.execute()).thenReturn(response);
        when(response.isSuccessful()).thenReturn(true);
        when(response.body()).thenReturn(responseBody);
        when(responseBody.string()).thenReturn("{\"id\":\"123\"}");

        Map<String, Object> data = new HashMap<>();
        data.put("name", "Test");

        String result = supabaseService.insertIntoTable("users", data);

        assertEquals("{\"id\":\"123\"}", result);
        verify(httpClient).newCall(any(Request.class));
    }

    @Test
    void testUpdateTable_Success() throws IOException {
        when(httpClient.newCall(any(Request.class))).thenReturn(call);
        when(call.execute()).thenReturn(response);
        when(response.isSuccessful()).thenReturn(true);
        when(response.body()).thenReturn(responseBody);
        when(responseBody.string()).thenReturn("{\"id\":\"123\",\"name\":\"Updated\"}");

        Map<String, String> filters = new HashMap<>();
        filters.put("id", "eq.123");
        Map<String, Object> data = new HashMap<>();
        data.put("name", "Updated");

        String result = supabaseService.updateTable("users", filters, data);

        assertEquals("{\"id\":\"123\",\"name\":\"Updated\"}", result);
        verify(httpClient).newCall(any(Request.class));
    }

    @Test
    void testDeleteFromTable_Success() throws IOException {
        when(httpClient.newCall(any(Request.class))).thenReturn(call);
        when(call.execute()).thenReturn(response);
        when(response.isSuccessful()).thenReturn(true);

        Map<String, String> filters = new HashMap<>();
        filters.put("id", "eq.123");

        assertDoesNotThrow(() -> {
            supabaseService.deleteFromTable("users", filters);
        });

        verify(httpClient).newCall(any(Request.class));
    }

    @Test
    void testDeleteFromTable_Error() throws IOException {
        when(httpClient.newCall(any(Request.class))).thenReturn(call);
        when(call.execute()).thenReturn(response);
        when(response.isSuccessful()).thenReturn(false);
        when(response.body()).thenReturn(responseBody);
        when(responseBody.string()).thenReturn("Error message");

        Map<String, String> filters = new HashMap<>();
        filters.put("id", "eq.123");

        assertThrows(IOException.class, () -> {
            supabaseService.deleteFromTable("users", filters);
        });
    }

    @Test
    void testUploadFile_Success() throws IOException {
        when(httpClient.newCall(any(Request.class))).thenReturn(call);
        when(call.execute()).thenReturn(response);
        when(response.isSuccessful()).thenReturn(true);
        when(response.body()).thenReturn(responseBody);
        when(responseBody.string()).thenReturn("{\"path\":\"file.jpg\"}");

        byte[] fileData = "test content".getBytes();
        String result = supabaseService.uploadFile("bucket", "path/file.jpg", fileData, "image/jpeg");

        assertEquals("{\"path\":\"file.jpg\"}", result);
        verify(httpClient).newCall(any(Request.class));
    }

    @Test
    void testGetPublicUrl() {
        String result = supabaseService.getPublicUrl("bucket", "path/file.jpg");
        assertEquals("https://test.supabase.co/storage/v1/object/public/bucket/path/file.jpg", result);
    }
}

