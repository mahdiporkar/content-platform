package com.contentplatform.backend.interfaces.web;

import com.contentplatform.backend.infrastructure.security.JwtAuthenticationToken;
import com.contentplatform.backend.infrastructure.security.JwtUser;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.List;

public final class SecurityUtils {
    private SecurityUtils() {
    }

    public static List<String> getAllowedApplicationIds() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof JwtAuthenticationToken jwtAuth) {
            JwtUser user = (JwtUser) jwtAuth.getPrincipal();
            return user.applicationIds();
        }
        return Collections.emptyList();
    }
}
