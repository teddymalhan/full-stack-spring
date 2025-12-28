package com.richwavelet.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.richwavelet.backend.config.SupabaseConfig;
import okhttp3.*;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.Map;

@Service
public class SupabaseService {

    private final OkHttpClient httpClient;
    private final SupabaseConfig supabaseConfig;
    private final ObjectMapper objectMapper;

    public SupabaseService(OkHttpClient supabaseHttpClient, SupabaseConfig supabaseConfig) {
        this.httpClient = supabaseHttpClient;
        this.supabaseConfig = supabaseConfig;
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Query a Supabase table using the REST API
     * Example: queryTable("users", Map.of("select", "*", "id", "eq.123"))
     */
    public String queryTable(String tableName, Map<String, String> params) throws IOException {
        var urlBuilder = HttpUrl.parse(supabaseConfig.getSupabaseUrl() + "/rest/v1/" + tableName).newBuilder();

        params.forEach(urlBuilder::addQueryParameter);

        var request = new Request.Builder()
                .url(urlBuilder.build())
                .get()
                .build();

        try (var response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Unexpected code " + response);
            }
            return response.body().string();
        }
    }

    /**
     * Insert data into a Supabase table
     */
    public String insertIntoTable(String tableName, Object data) throws IOException {
        var jsonData = objectMapper.writeValueAsString(data);

        var requestBody = RequestBody.create(
                jsonData,
                MediaType.parse("application/json")
        );

        var request = new Request.Builder()
                .url(supabaseConfig.getSupabaseUrl() + "/rest/v1/" + tableName)
                .post(requestBody)
                .addHeader("Prefer", "return=representation")
                .build();

        try (var response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Unexpected code " + response + ": " + response.body().string());
            }
            return response.body().string();
        }
    }

    /**
     * Update data in a Supabase table
     */
    public String updateTable(String tableName, Map<String, String> filters, Object data) throws IOException {
        var jsonData = objectMapper.writeValueAsString(data);

        var urlBuilder = HttpUrl.parse(supabaseConfig.getSupabaseUrl() + "/rest/v1/" + tableName).newBuilder();
        filters.forEach(urlBuilder::addQueryParameter);

        var requestBody = RequestBody.create(
                jsonData,
                MediaType.parse("application/json")
        );

        var request = new Request.Builder()
                .url(urlBuilder.build())
                .patch(requestBody)
                .addHeader("Prefer", "return=representation")
                .build();

        try (var response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Unexpected code " + response + ": " + response.body().string());
            }
            return response.body().string();
        }
    }

    /**
     * Delete data from a Supabase table
     */
    public void deleteFromTable(String tableName, Map<String, String> filters) throws IOException {
        var urlBuilder = HttpUrl.parse(supabaseConfig.getSupabaseUrl() + "/rest/v1/" + tableName).newBuilder();
        filters.forEach(urlBuilder::addQueryParameter);

        var request = new Request.Builder()
                .url(urlBuilder.build())
                .delete()
                .build();

        try (var response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Unexpected code " + response + ": " + response.body().string());
            }
        }
    }

    /**
     * Upload a file to Supabase Storage
     */
    public String uploadFile(String bucket, String path, byte[] fileData, String contentType) throws IOException {
        var requestBody = RequestBody.create(fileData, MediaType.parse(contentType));

        var request = new Request.Builder()
                .url(supabaseConfig.getSupabaseUrl() + "/storage/v1/object/" + bucket + "/" + path)
                .post(requestBody)
                .addHeader("Content-Type", contentType)
                .build();

        try (var response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Unexpected code " + response + ": " + response.body().string());
            }
            return response.body().string();
        }
    }

    /**
     * Get public URL for a file in Supabase Storage
     */
    public String getPublicUrl(String bucket, String path) {
        return supabaseConfig.getSupabaseUrl() + "/storage/v1/object/public/" + bucket + "/" + path;
    }
}
