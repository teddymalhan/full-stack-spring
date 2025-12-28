package com.richwavelet.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class ClerkWebhookEvent {

    private String type;  // e.g., "user.created", "user.updated", "user.deleted"
    private Data data;
    private Object object;  // "event"

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Data {
        private String id;  // Clerk user ID

        @JsonProperty("email_addresses")
        private EmailAddress[] emailAddresses;

        @JsonProperty("first_name")
        private String firstName;

        @JsonProperty("last_name")
        private String lastName;

        private String username;

        @JsonProperty("image_url")
        private String imageUrl;

        @JsonProperty("phone_numbers")
        private PhoneNumber[] phoneNumbers;

        @JsonProperty("created_at")
        private Long createdAt;

        @JsonProperty("updated_at")
        private Long updatedAt;

        // Getters and setters
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public EmailAddress[] getEmailAddresses() { return emailAddresses; }
        public void setEmailAddresses(EmailAddress[] emailAddresses) { this.emailAddresses = emailAddresses; }

        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }

        public String getLastName() { return lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }

        public String getImageUrl() { return imageUrl; }
        public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

        public PhoneNumber[] getPhoneNumbers() { return phoneNumbers; }
        public void setPhoneNumbers(PhoneNumber[] phoneNumbers) { this.phoneNumbers = phoneNumbers; }

        public Long getCreatedAt() { return createdAt; }
        public void setCreatedAt(Long createdAt) { this.createdAt = createdAt; }

        public Long getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(Long updatedAt) { this.updatedAt = updatedAt; }

        // Helper method to get primary email
        public String getPrimaryEmail() {
            if (emailAddresses != null && emailAddresses.length > 0) {
                for (EmailAddress email : emailAddresses) {
                    if (email.getId() != null) {
                        return email.getEmailAddress();
                    }
                }
                return emailAddresses[0].getEmailAddress();
            }
            return null;
        }

        // Helper method to check if email is verified
        public boolean isEmailVerified() {
            if (emailAddresses != null && emailAddresses.length > 0) {
                for (EmailAddress email : emailAddresses) {
                    if (email.getId() != null) {
                        return email.getVerification() != null &&
                               email.getVerification().getStatus() != null &&
                               email.getVerification().getStatus().equals("verified");
                    }
                }
            }
            return false;
        }

        // Helper method to get primary phone
        public String getPrimaryPhone() {
            if (phoneNumbers != null && phoneNumbers.length > 0) {
                return phoneNumbers[0].getPhoneNumber();
            }
            return null;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class EmailAddress {
        private String id;

        @JsonProperty("email_address")
        private String emailAddress;

        private Verification verification;

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getEmailAddress() { return emailAddress; }
        public void setEmailAddress(String emailAddress) { this.emailAddress = emailAddress; }

        public Verification getVerification() { return verification; }
        public void setVerification(Verification verification) { this.verification = verification; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PhoneNumber {
        @JsonProperty("phone_number")
        private String phoneNumber;

        public String getPhoneNumber() { return phoneNumber; }
        public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Verification {
        private String status;  // "verified", "unverified", etc.

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }

    // Main class getters and setters
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Data getData() { return data; }
    public void setData(Data data) { this.data = data; }

    public Object getObject() { return object; }
    public void setObject(Object object) { this.object = object; }
}
