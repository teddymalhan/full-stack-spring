package com.richwavelet.backend.webhook;

import com.richwavelet.backend.dto.ClerkWebhookEvent;
import com.richwavelet.backend.service.UserService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

@RestController
@RequestMapping("/api/webhooks")
public class ClerkWebhookController {

    private final UserService userService;

    @Value("${clerk.webhook.secret:}")
    private String webhookSecret;

    public ClerkWebhookController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/clerk")
    public ResponseEntity<String> handleClerkWebhook(
            @RequestBody String rawBody,
            @RequestHeader(value = "svix-id", required = false) String svixId,
            @RequestHeader(value = "svix-timestamp", required = false) String svixTimestamp,
            @RequestHeader(value = "svix-signature", required = false) String svixSignature
    ) {
        try {
            // Parse the event from raw JSON
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            ClerkWebhookEvent event = mapper.readValue(rawBody, ClerkWebhookEvent.class);

            // Verify webhook signature (if secret is configured)
            if (webhookSecret != null && !webhookSecret.isEmpty()) {
                if (!verifyWebhookSignature(svixId, svixTimestamp, svixSignature, rawBody)) {
                    System.err.println("Webhook signature verification failed");
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body("Invalid webhook signature");
                }
            }

            // Handle different event types
            switch (event.getType()) {
                case "user.created":
                    handleUserCreated(event);
                    break;

                case "user.updated":
                    handleUserUpdated(event);
                    break;

                case "user.deleted":
                    handleUserDeleted(event);
                    break;

                default:
                    // Log unknown event type
                    System.out.println("Unhandled Clerk event type: " + event.getType());
            }

            return ResponseEntity.ok("Webhook processed successfully");

        } catch (Exception e) {
            System.err.println("Error processing Clerk webhook: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error processing webhook: " + e.getMessage());
        }
    }

    private void handleUserCreated(ClerkWebhookEvent event) throws Exception {
        System.out.println("Creating user from Clerk webhook: " + event.getData().getId());
        userService.createUserFromClerkEvent(event.getData());
        System.out.println("User created successfully: " + event.getData().getId());
    }

    private void handleUserUpdated(ClerkWebhookEvent event) throws Exception {
        System.out.println("Updating user from Clerk webhook: " + event.getData().getId());

        // Check if user exists, if not create them
        if (!userService.userExists(event.getData().getId())) {
            System.out.println("User doesn't exist, creating: " + event.getData().getId());
            userService.createUserFromClerkEvent(event.getData());
        } else {
            userService.updateUserFromClerkEvent(event.getData());
        }

        System.out.println("User updated successfully: " + event.getData().getId());
    }

    private void handleUserDeleted(ClerkWebhookEvent event) throws Exception {
        System.out.println("Deleting user from Clerk webhook: " + event.getData().getId());
        userService.deleteUser(event.getData().getId());
        System.out.println("User deleted successfully: " + event.getData().getId());
    }

    /**
     * Verify Clerk webhook signature using Svix
     * See: https://docs.clerk.com/integrations/webhooks/overview#webhook-signature-verification
     */
    private boolean verifyWebhookSignature(
            String svixId,
            String svixTimestamp,
            String svixSignature,
            String rawBody
    ) {
        if (svixId == null || svixTimestamp == null || svixSignature == null) {
            System.err.println("Missing webhook signature headers");
            return false;
        }

        try {
            // Construct the signed content exactly as Svix does: id.timestamp.payload
            String signedContent = svixId + "." + svixTimestamp + "." + rawBody;

            // Compute HMAC using the webhook secret
            // The secret format is: whsec_<base64_encoded_key>
            // We need to strip the prefix and base64 decode to get the actual signing key
            byte[] secretBytes;
            if (webhookSecret.startsWith("whsec_")) {
                String base64Secret = webhookSecret.substring(6);
                secretBytes = Base64.getDecoder().decode(base64Secret);
            } else {
                secretBytes = webhookSecret.getBytes(StandardCharsets.UTF_8);
            }

            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(secretBytes, "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hmacBytes = mac.doFinal(signedContent.getBytes(StandardCharsets.UTF_8));
            String computedSignature = "v1," + Base64.getEncoder().encodeToString(hmacBytes);

            System.out.println("Computed signature: " + computedSignature);
            System.out.println("Received signature: " + svixSignature);

            // Compare signatures (Svix signature format is: v1,signature1 v1,signature2 ...)
            return svixSignature.contains(computedSignature);

        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            System.err.println("Error verifying webhook signature: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
}
