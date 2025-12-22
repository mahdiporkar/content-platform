package com.contentplatform.backend.infrastructure.security;

import java.util.List;

public record JwtUser(String subject, String email, List<String> applicationIds) {
}
