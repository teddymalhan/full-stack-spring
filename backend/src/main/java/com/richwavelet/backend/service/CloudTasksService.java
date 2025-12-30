package com.richwavelet.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.cloud.tasks.v2.*;
import com.google.protobuf.ByteString;
import com.richwavelet.backend.dto.ProcessVideoRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.Map;

@Service
public class CloudTasksService {

    private static final Logger logger = LoggerFactory.getLogger(CloudTasksService.class);

    private final CloudTasksClient tasksClient;
    private final ObjectMapper objectMapper;

    @Value("${gcp.project-id:}")
    private String projectId;

    @Value("${gcp.location:us-central1}")
    private String location;

    @Value("${gcp.task-queue:}")
    private String queueName;

    @Value("${gcp.worker-base-url:}")
    private String workerBaseUrl;

    @Value("${gcp.service-account:}")
    private String serviceAccount;

    public CloudTasksService(@Autowired(required = false) CloudTasksClient tasksClient) {
        this.tasksClient = tasksClient;
        this.objectMapper = new ObjectMapper();
        if (tasksClient == null) {
            logger.warn("CloudTasksClient not available - video processing features will be disabled");
        }
    }

    /**
     * Check if Cloud Tasks is configured and available
     */
    public boolean isAvailable() {
        return tasksClient != null && projectId != null && !projectId.isEmpty();
    }

    /**
     * Check if user already has a task in the queue
     */
    public boolean hasExistingTask(String userId) {
        if (!isAvailable()) {
            logger.warn("Cloud Tasks not available, skipping duplicate check");
            return false;
        }
        try {
            String parent = QueueName.of(projectId, location, queueName).toString();
            ListTasksRequest listRequest = ListTasksRequest.newBuilder()
                    .setParent(parent)
                    .build();

            for (Task task : tasksClient.listTasks(listRequest).iterateAll()) {
                Map<String, String> headers = task.getHttpRequest().getHeadersMap();
                String queuedUserId = headers.get("X-User-Id");
                if (userId.equals(queuedUserId)) {
                    logger.info("User {} already has a task in queue", userId);
                    return true;
                }
            }
            return false;
        } catch (Exception e) {
            logger.error("Error checking for existing tasks: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Create a new video processing task
     * @return The task name
     */
    public String createProcessingTask(ProcessVideoRequest request, String userId, String jobId) throws IOException {
        if (!isAvailable()) {
            throw new IllegalStateException("Cloud Tasks is not configured. Set GCP_PROJECT_ID environment variable.");
        }
        String parent = QueueName.of(projectId, location, queueName).toString();

        // Create the payload
        Map<String, Object> payload = Map.of(
                "jobId", jobId,
                "userId", userId,
                "videoId", request.videoId(),
                "adIds", request.adIds(),
                "shaderStyle", request.shaderStyle().name()
        );

        byte[] payloadBytes = objectMapper.writeValueAsBytes(payload);

        // Build the HTTP request that Cloud Tasks will make
        String workerUrl = workerBaseUrl + "/api/tasks/process-video-worker";

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .setUrl(workerUrl)
                .setHttpMethod(HttpMethod.POST)
                .putHeaders("Content-Type", "application/json")
                .putHeaders("X-User-Id", userId)
                .putHeaders("X-Job-Id", jobId)
                .setOidcToken(
                        OidcToken.newBuilder()
                                .setServiceAccountEmail(serviceAccount)
                                .setAudience(workerBaseUrl)
                                .build()
                )
                .setBody(ByteString.copyFrom(payloadBytes))
                .build();

        // Create the task
        Task task = Task.newBuilder()
                .setHttpRequest(httpRequest)
                .build();

        Task createdTask = tasksClient.createTask(parent, task);
        logger.info("Created Cloud Task: {} for user: {}", createdTask.getName(), userId);

        return createdTask.getName();
    }

    /**
     * Get the queue path
     */
    public String getQueuePath() {
        return QueueName.of(projectId, location, queueName).toString();
    }
}
