package com.richwavelet.backend;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class ConfigController {

    @GetMapping("/config")
    public Map<String, String> config() {
        // These keys are safe to expose to the client (public/anon keys only)
        Map<String, String> config = new HashMap<>();

        String clerkPk = System.getenv("VITE_CLERK_PUBLISHABLE_KEY");
        config.put("clerkPublishableKey", clerkPk != null ? clerkPk : "");

        String supabaseUrl = System.getenv("SUPABASE_URL");
        config.put("supabaseUrl", supabaseUrl != null ? supabaseUrl : "");

        String supabaseAnonKey = System.getenv("SUPABASE_ANON_KEY");
        config.put("supabaseAnonKey", supabaseAnonKey != null ? supabaseAnonKey : "");

        return config;
    }
}

