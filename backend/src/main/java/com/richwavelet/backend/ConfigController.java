package com.richwavelet.backend;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class ConfigController {

    @GetMapping("/config")
    public Map<String, String> config() {
        // Clerk publishable key is safe to expose to the client.
        String clerkPk = System.getenv("VITE_CLERK_PUBLISHABLE_KEY");
        return Map.of("clerkPublishableKey", clerkPk != null ? clerkPk : "");
    }
}

