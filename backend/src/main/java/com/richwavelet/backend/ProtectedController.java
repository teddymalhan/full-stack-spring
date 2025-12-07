package com.richwavelet.backend;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;


@RestController
@RequestMapping("/api/protected")
public class ProtectedController {

    @GetMapping("/hello")
    public String secureEndpoint(Authentication auth) {
        return "You are authenticated as: " + auth.getName();
    }
}
