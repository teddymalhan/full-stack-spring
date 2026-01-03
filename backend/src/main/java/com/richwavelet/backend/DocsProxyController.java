package com.richwavelet.backend;

import jakarta.servlet.http.HttpServletRequest;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

/**
 * Proxy controller that forwards requests from /docs/** to the Mintlify-hosted documentation.
 * This allows the documentation to be served from the same domain as the API.
 */
@Controller
@Order(1) // Higher priority - handle before SpaController
@RequestMapping("/docs")
public class DocsProxyController {

    private static final String MINTLIFY_DOCS_URL = "https://sfu-dc39816c.mintlify.dev";
    private final OkHttpClient httpClient;

    public DocsProxyController() {
        this.httpClient = new OkHttpClient.Builder()
                .followRedirects(true)
                .followSslRedirects(true)
                .build();
    }

    /**
     * Proxy all requests under /docs/** to Mintlify.
     * Preserves the path and query parameters.
     */
    @GetMapping(value = {"", "/**"})
    public ResponseEntity<byte[]> proxyToMintlify(HttpServletRequest servletRequest) {
        try {
            // Build the target URL
            String path = servletRequest.getRequestURI();
            String queryString = servletRequest.getQueryString();
            String targetUrl = MINTLIFY_DOCS_URL + path;
            if (queryString != null && !queryString.isEmpty()) {
                targetUrl += "?" + queryString;
            }

            // Build the proxy request with appropriate headers
            Request.Builder requestBuilder = new Request.Builder()
                    .url(targetUrl)
                    .header("Host", "sfu-dc39816c.mintlify.dev")
                    .header("X-Forwarded-Host", servletRequest.getHeader("Host"))
                    .header("X-Forwarded-Proto", servletRequest.getScheme());

            // Copy relevant headers from the original request
            copyHeaders(servletRequest, requestBuilder);

            Request proxyRequest = requestBuilder.build();

            // Execute the proxy request
            try (Response response = httpClient.newCall(proxyRequest).execute()) {
                if (response.body() == null) {
                    return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
                }

                // Build response headers
                HttpHeaders responseHeaders = new HttpHeaders();
                response.headers().toMultimap().forEach((key, values) -> {
                    // Skip certain headers that shouldn't be proxied
                    if (!shouldSkipHeader(key)) {
                        responseHeaders.put(key, values);
                    }
                });

                // Return the proxied response
                return ResponseEntity
                        .status(response.code())
                        .headers(responseHeaders)
                        .body(response.body().bytes());
            }

        } catch (IOException e) {
            System.err.println("Error proxying request to Mintlify: " + e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.BAD_GATEWAY)
                    .body(("Error loading documentation: " + e.getMessage()).getBytes());
        }
    }

    /**
     * Copy relevant headers from the servlet request to the proxy request.
     */
    private void copyHeaders(HttpServletRequest servletRequest, Request.Builder requestBuilder) {
        List<String> headersToProxy = List.of(
                "Accept",
                "Accept-Encoding",
                "Accept-Language",
                "User-Agent",
                "Referer"
        );

        Collections.list(servletRequest.getHeaderNames()).forEach(headerName -> {
            if (headersToProxy.contains(headerName)) {
                String headerValue = servletRequest.getHeader(headerName);
                if (headerValue != null) {
                    requestBuilder.header(headerName, headerValue);
                }
            }
        });
    }

    /**
     * Determine if a response header should be skipped when proxying back to the client.
     */
    private boolean shouldSkipHeader(String headerName) {
        String lowerHeaderName = headerName.toLowerCase();
        return lowerHeaderName.equals("transfer-encoding") ||
               lowerHeaderName.equals("connection") ||
               lowerHeaderName.equals("server");
    }
}