package com.richwavelet.backend;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.firewall.HttpFirewall;
import org.springframework.security.web.firewall.StrictHttpFirewall;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public HttpFirewall allowUrlEncodedPercentHttpFirewall() {
        StrictHttpFirewall firewall = new StrictHttpFirewall();
        // Allow double-encoded characters for Mintlify docs proxy
        firewall.setAllowUrlEncodedPercent(true);
        firewall.setAllowUrlEncodedSlash(true);
        firewall.setAllowSemicolon(true);
        return firewall;
    }

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        return http
            .csrf(AbstractHttpConfigurer::disable)  // TODO: Enable CSRF in production with proper token handling
            .cors(Customizer.withDefaults())  // Enable CORS for frontend
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/protected/**").authenticated()
                .requestMatchers("/api/tasks/**").permitAll()  // OIDC verified in controller
                .requestMatchers("/api/webhooks/**").permitAll()  // Signature verified in controller
                .anyRequest().permitAll()
            )
            .oauth2ResourceServer(oauth -> oauth.jwt(Customizer.withDefaults()))
            .build();
    }
}

