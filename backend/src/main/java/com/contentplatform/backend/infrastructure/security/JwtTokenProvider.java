package com.contentplatform.backend.infrastructure.security;

import com.contentplatform.backend.application.port.out.TokenProvider;
import com.contentplatform.backend.domain.model.AdminUser;
import com.contentplatform.backend.domain.value.ServicePermission;
import com.contentplatform.backend.domain.value.SystemPermission;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;

@Component
public class JwtTokenProvider implements TokenProvider {
    private final byte[] secret;
    private final long expirationMinutes;

    public JwtTokenProvider(@Value("${app.jwt.secret}") String secret,
                            @Value("${app.jwt.expiration-minutes}") long expirationMinutes) {
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        this.expirationMinutes = expirationMinutes;
    }

    @Override
    public String generate(AdminUser adminUser) {
        Instant now = Instant.now();
        Instant expiry = now.plus(expirationMinutes, ChronoUnit.MINUTES);
        return Jwts.builder()
            .setSubject(adminUser.getId())
            .claim("email", adminUser.getEmail())
            .claim("applicationIds", adminUser.getAllowedApplicationIds())
            .claim("systemPermissions", adminUser.getSystemPermissions().stream().map(Enum::name).toList())
            .claim("servicePermissions", adminUser.getServicePermissions().stream().map(Enum::name).toList())
            .setIssuedAt(Date.from(now))
            .setExpiration(Date.from(expiry))
            .signWith(Keys.hmacShaKeyFor(secret), SignatureAlgorithm.HS256)
            .compact();
    }

    public JwtUser parse(String token) {
        Claims claims = Jwts.parserBuilder()
            .setSigningKey(Keys.hmacShaKeyFor(secret))
            .build()
            .parseClaimsJws(token)
            .getBody();
        String subject = claims.getSubject();
        String email = claims.get("email", String.class);
        List<String> applicationIds = claims.get("applicationIds", List.class);
        List<String> systemRaw = claims.get("systemPermissions", List.class);
        List<String> serviceRaw = claims.get("servicePermissions", List.class);
        List<SystemPermission> systemPermissions = parseSystemPermissions(systemRaw);
        List<ServicePermission> servicePermissions = parseServicePermissions(serviceRaw);
        return new JwtUser(subject, email, applicationIds, systemPermissions, servicePermissions);
    }

    private List<SystemPermission> parseSystemPermissions(List<String> values) {
        if (values == null) {
            return List.of();
        }
        return values.stream()
            .map(value -> {
                try {
                    return SystemPermission.valueOf(value);
                } catch (IllegalArgumentException ex) {
                    return null;
                }
            })
            .filter(permission -> permission != null)
            .toList();
    }

    private List<ServicePermission> parseServicePermissions(List<String> values) {
        if (values == null) {
            return List.of();
        }
        return values.stream()
            .map(value -> {
                try {
                    return ServicePermission.valueOf(value);
                } catch (IllegalArgumentException ex) {
                    return null;
                }
            })
            .filter(permission -> permission != null)
            .toList();
    }
}
