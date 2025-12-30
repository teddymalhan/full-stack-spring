package com.richwavelet.backend.config;

import com.google.cloud.tasks.v2.CloudTasksClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;

@Configuration
public class CloudTasksConfig {

    private static final Logger logger = LoggerFactory.getLogger(CloudTasksConfig.class);

    @Bean
    @ConditionalOnProperty(name = "gcp.project-id", matchIfMissing = false)
    public CloudTasksClient cloudTasksClient() {
        try {
            logger.info("Initializing Cloud Tasks client...");
            return CloudTasksClient.create();
        } catch (IOException e) {
            logger.warn("Failed to create Cloud Tasks client: {}. Video processing features will be disabled.", e.getMessage());
            return null;
        }
    }
}
