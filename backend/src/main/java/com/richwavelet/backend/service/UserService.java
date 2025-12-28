package com.richwavelet.backend.service;

import com.richwavelet.backend.dto.ClerkWebhookEvent;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Service
public class UserService {

    private final SupabaseService supabaseService;

    public UserService(SupabaseService supabaseService) {
        this.supabaseService = supabaseService;
    }

    /**
     * Create a user in Supabase from Clerk webhook event
     */
    public void createUserFromClerkEvent(ClerkWebhookEvent.Data userData) throws IOException {
        Map<String, Object> user = new HashMap<>();

        user.put("id", userData.getId());

        // Only include email if it's not null
        String email = userData.getPrimaryEmail();
        if (email != null) {
            user.put("email", email);
        }

        user.put("first_name", userData.getFirstName());
        user.put("last_name", userData.getLastName());
        user.put("username", userData.getUsername());
        user.put("image_url", userData.getImageUrl());
        user.put("phone_number", userData.getPrimaryPhone());
        user.put("email_verified", userData.isEmailVerified());
        user.put("clerk_created_at", userData.getCreatedAt());
        user.put("clerk_updated_at", userData.getUpdatedAt());

        supabaseService.insertIntoTable("User", user);
    }

    /**
     * Update a user in Supabase from Clerk webhook event
     */
    public void updateUserFromClerkEvent(ClerkWebhookEvent.Data userData) throws IOException {
        Map<String, Object> updates = new HashMap<>();

        updates.put("email", userData.getPrimaryEmail());
        updates.put("first_name", userData.getFirstName());
        updates.put("last_name", userData.getLastName());
        updates.put("username", userData.getUsername());
        updates.put("image_url", userData.getImageUrl());
        updates.put("phone_number", userData.getPrimaryPhone());
        updates.put("email_verified", userData.isEmailVerified());
        updates.put("clerk_updated_at", userData.getUpdatedAt());

        Map<String, String> filters = new HashMap<>();
        filters.put("id", "eq." + userData.getId());

        supabaseService.updateTable("User", filters, updates);
    }

    /**
     * Delete a user from Supabase
     */
    public void deleteUser(String userId) throws IOException {
        Map<String, String> filters = new HashMap<>();
        filters.put("id", "eq." + userId);

        supabaseService.deleteFromTable("User", filters);
    }

    /**
     * Check if user exists in Supabase
     */
    public boolean userExists(String userId) throws IOException {
        Map<String, String> params = new HashMap<>();
        params.put("select", "id");
        params.put("id", "eq." + userId);

        String result = supabaseService.queryTable("User", params);
        return result != null && !result.equals("[]");
    }
}
