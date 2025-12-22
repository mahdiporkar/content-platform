package com.contentplatform.backend.application.dto;

public class AuthTokenDto {
    private final String token;

    public AuthTokenDto(String token) {
        this.token = token;
    }

    public String getToken() {
        return token;
    }
}
