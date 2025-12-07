package com.richwavelet.backend;

import org.springframework.security.oauth2.core.*;
import org.springframework.security.oauth2.jwt.Jwt;

public class AudienceValidator implements OAuth2TokenValidator<Jwt> {

    private final String audience;

    public AudienceValidator(String audience) {
        this.audience = audience;
    }

    @Override
    public OAuth2TokenValidatorResult validate(Jwt jwt) {

        if (jwt.getAudience().contains(audience)) {
            return OAuth2TokenValidatorResult.success();
        }

        OAuth2Error error = new OAuth2Error(
            "invalid_token",
            "Missing required audience"
            , null
        );

        return OAuth2TokenValidatorResult.failure(error);
    }
}
