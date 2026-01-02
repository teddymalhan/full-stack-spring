package com.richwavelet.backend.service;

import com.richwavelet.backend.dto.ClerkWebhookEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private SupabaseService supabaseService;

    @InjectMocks
    private UserService userService;

    private ClerkWebhookEvent.Data userData;

    @BeforeEach
    void setUp() {
        userData = new ClerkWebhookEvent.Data();
        userData.setId("user123");
        userData.setFirstName("John");
        userData.setLastName("Doe");
        userData.setUsername("johndoe");
        userData.setImageUrl("http://example.com/image.jpg");
        userData.setCreatedAt(1000L);
        userData.setUpdatedAt(2000L);

        ClerkWebhookEvent.EmailAddress email = new ClerkWebhookEvent.EmailAddress();
        email.setId("email1");
        email.setEmailAddress("john@example.com");
        ClerkWebhookEvent.Verification verification = new ClerkWebhookEvent.Verification();
        verification.setStatus("verified");
        email.setVerification(verification);
        userData.setEmailAddresses(new ClerkWebhookEvent.EmailAddress[]{email});

        ClerkWebhookEvent.PhoneNumber phone = new ClerkWebhookEvent.PhoneNumber();
        phone.setPhoneNumber("+1234567890");
        userData.setPhoneNumbers(new ClerkWebhookEvent.PhoneNumber[]{phone});
    }

    @Test
    @SuppressWarnings("unchecked")
    void testCreateUserFromClerkEvent_Success() throws IOException {
        ArgumentCaptor<Map<String, Object>> captor = ArgumentCaptor.forClass(Map.class);

        userService.createUserFromClerkEvent(userData);

        verify(supabaseService).insertIntoTable(eq("User"), captor.capture());
        Map<String, Object> captured = captor.getValue();

        assertEquals("user123", captured.get("id"));
        assertEquals("john@example.com", captured.get("email"));
        assertEquals("John", captured.get("first_name"));
        assertEquals("Doe", captured.get("last_name"));
        assertEquals("johndoe", captured.get("username"));
        assertEquals("http://example.com/image.jpg", captured.get("image_url"));
        assertEquals("+1234567890", captured.get("phone_number"));
        assertTrue((Boolean) captured.get("email_verified"));
        assertEquals(1000L, captured.get("clerk_created_at"));
        assertEquals(2000L, captured.get("clerk_updated_at"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void testCreateUserFromClerkEvent_WithNullEmail() throws IOException {
        userData.setEmailAddresses(null);
        ArgumentCaptor<Map<String, Object>> captor = ArgumentCaptor.forClass(Map.class);

        userService.createUserFromClerkEvent(userData);

        verify(supabaseService).insertIntoTable(eq("User"), captor.capture());
        Map<String, Object> captured = captor.getValue();

        assertFalse(captured.containsKey("email"));
        assertEquals("user123", captured.get("id"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void testUpdateUserFromClerkEvent_Success() throws IOException {
        userService.updateUserFromClerkEvent(userData);

        verify(supabaseService).updateTable(eq("User"), any(Map.class), any(Map.class));
    }

    @Test
    @SuppressWarnings("unchecked")
    void testDeleteUser_Success() throws IOException {
        userService.deleteUser("user123");

        verify(supabaseService).deleteFromTable(eq("User"), any(Map.class));
    }

    @Test
    void testUserExists_True() throws IOException {
        when(supabaseService.queryTable(eq("User"), any(Map.class))).thenReturn("[{\"id\":\"user123\"}]");

        boolean exists = userService.userExists("user123");

        assertTrue(exists);
        verify(supabaseService).queryTable(eq("User"), any(Map.class));
    }

    @Test
    void testUserExists_False() throws IOException {
        when(supabaseService.queryTable(eq("User"), any(Map.class))).thenReturn("[]");

        boolean exists = userService.userExists("user123");

        assertFalse(exists);
        verify(supabaseService).queryTable(eq("User"), any(Map.class));
    }

    @Test
    void testUserExists_NullResponse() throws IOException {
        when(supabaseService.queryTable(eq("User"), any(Map.class))).thenReturn(null);

        boolean exists = userService.userExists("user123");

        assertFalse(exists);
    }
}

